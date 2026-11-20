import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors).flat().join(' ')
        : data?.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-sm p-8 bg-canvas rounded-panel border">
        <h1 className="text-2xl font-bold text-fg mb-6">Create account</h1>

        {error && (
          <p className="mb-4 text-sm text-danger border border-danger rounded-control px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-fg mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-control border bg-canvas text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>
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
              minLength={8}
              className="w-full px-3 py-2 rounded-control border bg-canvas text-fg focus:outline-none focus:ring-2 focus:ring-fg"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-fg disabled:opacity-50 text-canvas font-medium rounded-control transition-colors"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-fg font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
