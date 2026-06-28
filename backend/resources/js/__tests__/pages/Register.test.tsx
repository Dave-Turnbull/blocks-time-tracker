import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Register from '../../pages/Register';
import { AuthContext } from '../../contexts/AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

function makeAuthContext(overrides: Partial<{ register: () => Promise<void> }> = {}) {
    return {
        user: null,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn().mockResolvedValue(undefined),
        logout: vi.fn(),
        ...overrides,
    };
}

function renderRegister(ctx = makeAuthContext()) {
    return render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Register page', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renders name, email, password fields and a submit button', () => {
        renderRegister();

        expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders a link back to the login page', () => {
        renderRegister();

        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('calls register with name, email, and password on submit', async () => {
        const ctx = makeAuthContext();
        renderRegister(ctx);

        await userEvent.type(screen.getByLabelText(/^name$/i), 'Jane Doe');
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(ctx.register).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'password123');
        });
    });

    it('navigates to "/" on successful registration', async () => {
        renderRegister();

        await userEvent.type(screen.getByLabelText(/^name$/i), 'Jane Doe');
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    });

    it('displays validation errors returned from the server', async () => {
        const error = {
            response: {
                data: { errors: { email: ['The email has already been taken.'] } },
            },
        };
        const ctx = makeAuthContext({ register: vi.fn().mockRejectedValue(error) });
        renderRegister(ctx);

        await userEvent.type(screen.getByLabelText(/^name$/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/the email has already been taken/i)).toBeInTheDocument();
        });
    });

    it('displays a generic message error when server provides one', async () => {
        const error = { response: { data: { message: 'Something went wrong.' } } };
        const ctx = makeAuthContext({ register: vi.fn().mockRejectedValue(error) });
        renderRegister(ctx);

        await userEvent.type(screen.getByLabelText(/^name$/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        });
    });

    it('disables the submit button while the request is in flight', async () => {
        let resolve!: () => void;
        const registerPromise = new Promise<void>((res) => { resolve = res; });
        const ctx = makeAuthContext({ register: vi.fn().mockReturnValue(registerPromise) });
        renderRegister(ctx);

        await userEvent.type(screen.getByLabelText(/^name$/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'password123');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();

        resolve();
        await waitFor(() => expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled());
    });
});
