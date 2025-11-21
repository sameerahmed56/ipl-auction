import React from 'react';
import Navbar from '../components/layout/Navbar';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-border rounded-lg h-96 p-4 text-center">
              <h2 className="text-2xl font-bold text-foreground">Welcome to the Game Lobby</h2>
              <p className="mt-2 text-secondary-foreground">
                "Create Game" and "Join Game" features will be implemented here in Phase 1.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
