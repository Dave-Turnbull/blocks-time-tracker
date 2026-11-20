import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'authentik_failed' ? 'Authentik login failed. Please try again.' : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [authentikEnabled, setAuthentikEnabled] = useState(false);

  useEffect(() => {
    // Public, unauthenticated — decides whether to render the Authentik
    // link below. AUTHENTIK_ENABLED=false keeps this permanently hidden.
    api
      .get('/auth/authentik/enabled')
      .then(({ data }) => setAuthentikEnabled(Boolean(data.enabled)))
      .catch(() => setAuthentikEnabled(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm p-8 bg-canvas rounded-panel border">
        <h1 className="text-2xl font-bold text-fg mb-6">Sign in</h1>

        {error && (
          <p className="mb-4 text-sm text-danger border border-danger rounded-control px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fg mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-control border bg-canvas text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fg mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-control border bg-canvas text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-fg disabled:opacity-50 text-canvas font-medium rounded-control transition-colors"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {authentikEnabled && (
          <div className="mt-4">
            {/* A plain <a href>, not a react-router Link or axios call — this
               has to be a real full-page browser navigation to Authentik's
               own domain, not a client-side route change. */}
            <a
              href="/auth/authentik/redirect"
              className="w-full block text-center py-2 px-4 border rounded-control text-fg font-medium hover:bg-hover transition-colors"
            >
              Log in with Authentik
            </a>
          </div>
        )}

        <p className="mt-4 text-sm text-center text-muted">
          No account?{' '}
          <Link to="/register" className="text-fg font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
