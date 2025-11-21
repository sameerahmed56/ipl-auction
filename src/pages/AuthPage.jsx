import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle } from '../lib/firebase/auth';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const AuthPage = () => {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 bg-card rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-2 text-card-foreground">IPL Auction Game</h1>
        <p className="text-secondary-foreground mb-6">Please sign in to continue</p>
        <Button onClick={handleSignIn} variant="primary">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default AuthPage;
