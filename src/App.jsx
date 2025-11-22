import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import AdminPage from './pages/AdminPage';
import GameSetupPage from './pages/GameSetupPage';
import ProtectedRoute from './router/ProtectedRoute';
import AdminRoute from './router/AdminRoute';

function App() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    handleChange(); // Initial check
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }} />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby/:gameId" element={<LobbyPage />} />
          <Route path="/game/:gameId/setup" element={<GameSetupPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
