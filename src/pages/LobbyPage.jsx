import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Copy, Edit, Trash2, Check, X } from 'lucide-react';

import { db } from '../lib/firebase/config';
import { updateTeamName, removePlayerFromGame } from '../lib/firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

const LobbyPage = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);

  const isHost = game && user && game.hostId === user.uid;

  useEffect(() => {
    if (!gameId || !user) return;
    const gameRef = doc(db, 'games', gameId);
    const teamsRef = collection(db, `games/${gameId}/teams`);

    const unsubGame = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) setGame({ id: doc.id, ...doc.data() });
      else {
        toast.error("Game not found! Redirecting...");
        navigate('/');
      }
      setIsLoading(false);
    });

    const unsubTeams = onSnapshot(teamsRef, (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
      if (!isLoading && !isHost && teamsData.length > 0 && !teamsData.some(team => team.id === user.uid)) {
        toast.error("You have been removed from the game.");
        navigate('/');
      }
    });

    return () => { unsubGame(); unsubTeams(); };
  }, [gameId, user, isLoading, isHost, navigate]);

  const handleEditClick = (team) => {
    setEditingTeamId(team.id);
    setNewTeamName(team.teamName);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setNewTeamName('');
  };

  const handleSaveName = async () => {
    if (!newTeamName.trim() || !editingTeamId) return;
    await updateTeamName(gameId, editingTeamId, newTeamName);
    setEditingTeamId(null);
    setNewTeamName('');
  };

  const openRemoveModal = (team) => {
    setPlayerToRemove(team);
    setIsRemoveModalOpen(true);
  };

  const confirmRemovePlayer = async () => {
    if (!playerToRemove) return;
    await removePlayerFromGame(gameId, playerToRemove.id);
    setIsRemoveModalOpen(false);
    setPlayerToRemove(null);
    toast.success(`${playerToRemove.teamName} has been removed.`);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(gameId).then(() => toast.success("Game code copied!"));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><Spinner size="lg" /></div>;
  }

  return (
    <>
      <Modal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        title={`Remove ${playerToRemove?.teamName}?`}
      >
        <p className="text-secondary-foreground mb-6">Are you sure you want to remove this player from the lobby? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsRemoveModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmRemovePlayer}>Remove Player</Button>
        </div>
      </Modal>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-card-foreground">Game Lobby</h1>
              <p className="text-secondary-foreground mt-2">Share this code with your friends to have them join!</p>
              <div className="mt-4 flex justify-center items-center gap-2">
                <span className="px-6 py-3 text-2xl font-mono tracking-widest bg-input border border-border rounded-md text-primary">
                  {game?.id}
                </span>
                <Button onClick={handleCopyToClipboard} variant="secondary" size="icon" className="rounded-full">
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-card-foreground mb-4 border-b border-border pb-2">Players in Lobby ({teams.length})</h2>
              <ul className="space-y-3">
                {teams.map((team) => (
                  <li key={team.id} className="p-3 bg-secondary rounded-md flex justify-between items-center">
                    {editingTeamId === team.id ? (
                      <div className="flex-grow flex items-center gap-2">
                        <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="flex-grow px-3 py-1 bg-input border border-border rounded-md text-foreground focus:ring-2 focus:ring-ring focus:outline-none" />
                        <Button onClick={handleSaveName} size="icon" className="rounded-full"><Check className="h-4 w-4" /></Button>
                        <Button onClick={handleCancelEdit} variant="secondary" size="icon" className="rounded-full"><X className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-secondary-foreground">{team.teamName}</span>
                        <div className="flex items-center gap-2">
                          {user.uid === team.id && (
                            <Button onClick={() => handleEditClick(team)} variant="secondary" size="icon" className="rounded-full"><Edit className="h-4 w-4" /></Button>
                          )}
                          {isHost && user.uid !== team.id && (
                            <Button onClick={() => openRemoveModal(team)} variant="destructive" size="icon" className="rounded-full"><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center">
              {isHost ? (
                <div className="flex justify-center items-center gap-4">
                  {game.status === 'lobby' && (
                    <Link to={`/game/${gameId}/setup`}>
                      <Button>Setup Auction</Button>
                    </Link>
                  )}
                  {game.status === 'ready' && (
                    <>
                      <Link to={`/game/${gameId}/setup`}>
                        <Button variant="secondary">Edit Setup</Button>
                      </Link>
                      <Button>Start Auction</Button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-lg text-secondary-foreground animate-pulse">Waiting for host to start the game...</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LobbyPage;
