import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Edit, Trash2, PlusCircle, Database } from 'lucide-react';

import { db } from '../lib/firebase/config';
import { useAuth } from '../hooks/useAuth';
import { addPlayer, updatePlayer, deletePlayer } from '../lib/firebase/firestore';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
const INITIAL_FORM_STATE = { name: '', role: 'Batsman', points: 70, basePrice: 0.5 };

const SEED_PLAYERS = [
  // Batsmen
  { name: 'Babar Azam', role: 'Batsman', points: 93, basePrice: 2.0 },
  { name: 'Steve Smith', role: 'Batsman', points: 90, basePrice: 2.0 },
  { name: 'Kane Williamson', role: 'Batsman', points: 91, basePrice: 2.0 },
  { name: 'David Warner', role: 'Batsman', points: 88, basePrice: 1.5 },
  { name: 'Suryakumar Yadav', role: 'Batsman', points: 89, basePrice: 1.5 },
  { name: 'Jos Buttler', role: 'Batsman', points: 92, basePrice: 2.0 },
  { name: 'Rohit Sharma', role: 'Batsman', points: 95, basePrice: 2.0 },
  { name: 'Virat Kohli', role: 'Batsman', points: 94, basePrice: 2.0 },

  // Bowlers
  { name: 'Jasprit Bumrah', role: 'Bowler', points: 95, basePrice: 2.0 },
  { name: 'Pat Cummins', role: 'Bowler', points: 92, basePrice: 2.0 },
  { name: 'Rashid Khan', role: 'Bowler', points: 94, basePrice: 2.0 },
  { name: 'Shaheen Afridi', role: 'Bowler', points: 91, basePrice: 2.0 },
  { name: 'Trent Boult', role: 'Bowler', points: 89, basePrice: 1.5 },
  { name: 'Kagiso Rabada', role: 'Bowler', points: 88, basePrice: 1.5 },
  { name: 'Wanindu Hasaranga', role: 'Bowler', points: 87, basePrice: 1.0 },
  { name: 'Jofra Archer', role: 'Bowler', points: 86, basePrice: 1.0 },
  // All-Rounders
  { name: 'Hardik Pandya', role: 'All-Rounder', points: 88, basePrice: 2.0 },
  { name: 'Ben Stokes', role: 'All-Rounder', points: 89, basePrice: 2.0 },
  { name: 'Shakib Al Hasan', role: 'All-Rounder', points: 85, basePrice: 1.5 },
  { name: 'Glenn Maxwell', role: 'All-Rounder', points: 86, basePrice: 1.5 },
  // Wicket-Keepers
  { name: 'Rishabh Pant', role: 'Wicket-Keeper', points: 87, basePrice: 1.5 },
  { name: 'Quinton de Kock', role: 'Wicket-Keeper', points: 89, basePrice: 2.0 },
];


const AdminPage = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  useEffect(() => {
    const playersQuery = query(collection(db, "players"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(playersQuery, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(playersData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingPlayerId(null);
  };

  const handleEditClick = (player) => {
    setEditingPlayerId(player.id);
    setFormState({ name: player.name, role: player.role, points: player.points, basePrice: player.basePrice });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Authentication error.");

    const points = parseInt(formState.points, 10);
    if (isNaN(points) || points < 0 || points > 100) {
      return toast.error("Player points must be a number between 0 and 100.");
    }
    
    const operation = editingPlayerId 
      ? updatePlayer(editingPlayerId, formState, user.uid)
      : addPlayer(formState, user.uid);
      
    const toastId = toast.loading(editingPlayerId ? 'Updating player...' : 'Adding player...');
    
    const success = await operation;
    
    if (success) {
      toast.success(editingPlayerId ? 'Player updated!' : 'Player added!', { id: toastId });
      clearForm();
    } else {
      toast.error('An error occurred.', { id: toastId });
    }
  };

  const openDeleteModal = (player) => {
    setPlayerToDelete(player);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    const toastId = toast.loading('Deleting player...');
    const success = await deletePlayer(playerToDelete.id);
    if (success) {
      toast.success('Player deleted!', { id: toastId });
    } else {
      toast.error('Failed to delete player.', { id: toastId });
    }
    setIsDeleteModalOpen(false);
    setPlayerToDelete(null);
  };

  const confirmSeed = async () => {
    const toastId = toast.loading('Seeding database with players...');
    let successCount = 0;
    for (const player of SEED_PLAYERS) {
      const success = await addPlayer(player, user.uid);
      if (success) successCount++;
    }
    if (successCount === SEED_PLAYERS.length) {
      toast.success(`Successfully added ${successCount} players!`, { id: toastId, duration: 4000 });
    } else {
      toast.error(`Could only add ${successCount} of ${SEED_PLAYERS.length} players.`, { id: toastId, duration: 4000 });
    }
    setIsSeedModalOpen(false);
  };

  return (
    <>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete ${playerToDelete?.name}?`}>
        <p className="text-secondary-foreground mb-6">Are you sure you want to permanently delete this player? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete}>Delete Player</Button>
        </div>
      </Modal>

      <Modal isOpen={isSeedModalOpen} onClose={() => setIsSeedModalOpen(false)} title="Seed Player Database?">
        <p className="text-secondary-foreground mb-6">This will add 20 default players to the master list. This action should only be performed on an empty database.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setIsSeedModalOpen(false)}>Cancel</Button>
          <Button onClick={confirmSeed}>Confirm & Seed</Button>
        </div>
      </Modal>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-lg space-y-4">
                <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                  <PlusCircle className="text-primary" />
                  {editingPlayerId ? 'Edit Player' : 'Add New Player'}
                </h2>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-foreground">Player Name</label>
                  <input type="text" name="name" id="name" value={formState.name} onChange={handleInputChange} required className="mt-1 block w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-ring" />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-secondary-foreground">Role</label>
                  <select name="role" id="role" value={formState.role} onChange={handleInputChange} className="mt-1 block w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-ring">
                    {PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-secondary-foreground">Points (1-100)</label>
                    <input type="number" name="points" id="points" value={formState.points} onChange={handleInputChange} required max="100" className="mt-1 block w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label htmlFor="basePrice" className="block text-sm font-medium text-secondary-foreground">Base Price (Cr)</label>
                    <input type="number" step="0.1" name="basePrice" id="basePrice" value={formState.basePrice} onChange={handleInputChange} required className="mt-1 block w-full bg-input border border-border rounded-md p-2 focus:ring-2 focus:ring-ring" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-grow">{editingPlayerId ? 'Update Player' : 'Add Player'}</Button>
                  {editingPlayerId && <Button variant="secondary" onClick={clearForm}>Cancel</Button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-card-foreground">Master Player List ({players.length})</h2>
                  {players.length === 0 && !isLoading && (
                    <Button variant="secondary" onClick={() => setIsSeedModalOpen(true)}>
                      <Database className="h-4 w-4 mr-2" />
                      Seed Database
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="p-2 text-secondary-foreground">Name</th>
                        <th className="p-2 text-secondary-foreground">Role</th>
                        <th className="p-2 text-secondary-foreground">Points</th>
                        <th className="p-2 text-secondary-foreground">Base Price</th>
                        <th className="p-2 text-secondary-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan="5" className="text-center p-4">Loading players...</td></tr>
                      ) : players.map(player => (
                        <tr key={player.id} className="border-b border-border/50">
                          <td className="p-2 font-medium text-foreground">{player.name}</td>
                          <td className="p-2 text-secondary-foreground">{player.role}</td>
                          <td className="p-2 text-secondary-foreground">{player.points}</td>
                          <td className="p-2 text-secondary-foreground">{player.basePrice} Cr</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button size="icon" variant="secondary" className="rounded-full" onClick={() => handleEditClick(player)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="destructive" className="rounded-full" onClick={() => openDeleteModal(player)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminPage;
