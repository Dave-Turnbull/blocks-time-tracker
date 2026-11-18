import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Landing point for a successful Authentik/OIDC login. The backend redirect
// (AuthentikController@callback) lands the browser here with a one-time
// Sanctum token in the query string; this page stores it the same way
// password login does and drops into the app.
const AuthCallback = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing login token.');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/', { replace: true }))
      .catch(() => setError('Authentik login failed. Please try again.'));
    // Only run once per mount — loginWithToken/navigate identities don't matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <p className="text-danger-note mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-accent-text hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="text-fg-muted">Signing in…</div>
    </div>
  );
};

export default AuthCallback;
