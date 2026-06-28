import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../contexts/AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

function makeAuthContext(overrides: Partial<{ login: () => Promise<void> }> = {}) {
    return {
        user: null,
        isLoading: false,
        login: vi.fn().mockResolvedValue(undefined),
        register: vi.fn(),
        logout: vi.fn(),
        ...overrides,
    };
}

function renderLogin(ctx = makeAuthContext()) {
    return render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<div>Register page</div>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login page', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renders email, password fields and a submit button', () => {
        renderLogin();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders a link to the register page', () => {
        renderLogin();

        expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    it('calls login with the entered credentials on submit', async () => {
        const ctx = makeAuthContext();
        renderLogin(ctx);

        await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(ctx.login).toHaveBeenCalledWith('user@example.com', 'password123');
        });
    });

    it('navigates to "/" on successful login', async () => {
        renderLogin(makeAuthContext({ login: vi.fn().mockResolvedValue(undefined) }));

        await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    });

    it('shows an error message when login fails', async () => {
        const error = { response: { data: { message: 'The provided credentials are incorrect.' } } };
        const ctx = makeAuthContext({ login: vi.fn().mockRejectedValue(error) });
        renderLogin(ctx);

        await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/the provided credentials are incorrect/i)).toBeInTheDocument();
        });
    });

    it('shows a fallback error message when the server sends no message', async () => {
        const ctx = makeAuthContext({ login: vi.fn().mockRejectedValue(new Error('Network error')) });
        renderLogin(ctx);

        await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
    });

    it('disables the submit button while the request is in flight', async () => {
        let resolve!: () => void;
        const loginPromise = new Promise<void>((res) => { resolve = res; });
        const ctx = makeAuthContext({ login: vi.fn().mockReturnValue(loginPromise) });
        renderLogin(ctx);

        await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

        resolve();
        await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled());
    });
});
