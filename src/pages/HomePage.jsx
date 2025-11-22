import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { createGame, joinGame } from '../lib/firebase/firestore';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';

const HomePage = () => {
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateGame = async () => {
    if (!user) {
      return toast.error("You must be logged in to create a game.");
    }
    setIsLoading(true);
    try {
      const newGameId = await createGame(user);
      if (newGameId) {
        navigate(`/lobby/${newGameId}`);
      } else {
        toast.error("Failed to create game. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    if (!user) {
      return toast.error("You must be logged in to join a game.");
    }
    setIsLoading(true);
    try {
      const result = await joinGame(gameCode, user);
      if (result.success) {
        navigate(`/lobby/${gameCode}`);
      } else {
        toast.error(`Could not join game: ${result.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Game Card */}
            <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">Create New Game</h2>
              <p className="text-secondary-foreground mb-6">Start a new auction and invite your friends to play.</p>
              <Button onClick={handleCreateGame} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Game Lobby'}
              </Button>
            </div>

            {/* Join Game Card */}
            <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">Join Existing Game</h2>
              <p className="text-secondary-foreground mb-6">Enter a game code from a friend to join their auction.</p>
              <form onSubmit={handleJoinGame} className="w-full max-w-sm">
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="ENTER GAME CODE"
                  className="w-full px-4 py-2 mb-4 text-center font-bold tracking-widest bg-input border border-border rounded-md text-foreground placeholder-secondary-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={!gameCode || isLoading}>
                  {isLoading ? 'Joining...' : 'Join Game'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
