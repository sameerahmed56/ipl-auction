import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  const adminUID = import.meta.env.VITE_ADMIN_UID;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.uid !== adminUID) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default AdminRoute;
