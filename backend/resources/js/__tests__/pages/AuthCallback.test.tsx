import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from '../../pages/AuthCallback';
import { AuthContext } from '../../contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

function makeAuthContext(overrides: Partial<{ loginWithToken: (token: string) => Promise<void> }> = {}) {
    return {
        user: null,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        loginWithToken: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function renderCallback(path: string, ctx = makeAuthContext()) {
    return render(
        <AuthContext.Provider value={ctx}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/auth/callback" element={<AuthCallback />} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

describe('AuthCallback page', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('stores the token from the query string and navigates home', async () => {
        const ctx = makeAuthContext();
        renderCallback('/auth/callback?token=1%7Csecret', ctx);

        await waitFor(() => expect(ctx.loginWithToken).toHaveBeenCalledWith('1|secret'));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    });

    it('shows an error and a way back to login when there is no token', async () => {
        renderCallback('/auth/callback');

        expect(await screen.findByText(/missing login token/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
    });

    it('shows an error when storing the token fails', async () => {
        const ctx = makeAuthContext({ loginWithToken: vi.fn().mockRejectedValue(new Error('network')) });
        renderCallback('/auth/callback?token=bad', ctx);

        expect(await screen.findByText(/authentik login failed/i)).toBeInTheDocument();
    });
});
