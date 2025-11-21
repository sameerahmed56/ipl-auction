import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { signOutUser } from '../../lib/firebase/auth';
import Button from '../ui/Button';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-card shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-primary">IPL Auction</h1>
          </div>
          {user && (
            <div className="flex items-center">
              <span className="text-foreground mr-4">
                Welcome, {user.displayName || 'Player'}
              </span>
              <Button onClick={signOutUser} variant="secondary">
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
