import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Loading…</div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
