import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Edit, Trash2, XCircle, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';

import { db } from '../lib/firebase/config';
import { saveAuctionSetup } from '../lib/firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const PLAYER_ROLES = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];

// --- Sub-components (No changes) ---
const CuratedPlayer = ({ player, onUnassign, onEdit }) => (
  <div className="p-2 bg-background rounded text-sm flex justify-between items-center group">
    <div><p className="text-foreground font-semibold">{player.name}</p><p className="text-xs text-secondary-foreground">Pts: {player.points} | Base: {player.basePrice} Cr</p></div>
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
      <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => onEdit(player)}><Edit className="h-3 w-3" /></Button>
      <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => onUnassign(player)}><XCircle className="h-4 w-4 text-destructive" /></Button>
    </div>
  </div>
);
const Pool = ({ pool, players, onRename, onDelete, onUnassign, onEditPlayer, onToggleCollapse }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: pool.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="p-4 bg-secondary rounded-lg border border-border touch-none">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <button {...attributes} {...listeners} className="cursor-grab text-secondary-foreground/50"><GripVertical /></button>
          <button onClick={() => onToggleCollapse(pool.id)} className="flex items-center gap-1 text-secondary-foreground">
            {pool.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <h3 className="font-bold truncate">{pool.name}</h3>
          </button>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => onRename(pool)}><Edit className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => onDelete(pool)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      {!pool.isCollapsed && (
        <div className="space-y-2 min-h-[2rem] pl-6">
          {pool.playerIds.map(id => players[id] ? <CuratedPlayer key={id} player={players[id]} onUnassign={onUnassign} onEdit={onEditPlayer} /> : null)}
        </div>
      )}
    </div>
  );
};
const MasterPlayerList = ({ players, onStage, onAssign, assignedPlayerIds, stagedPlayerIds, searchTerm, setSearchTerm, roleFilter, setRoleFilter, hasPools }) => (
  <div className="bg-card p-4 rounded-lg shadow-lg mt-8">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-card-foreground">Master Player List</h2>
      {stagedPlayerIds.size > 0 && <Button onClick={onAssign} disabled={!hasPools}>Assign Selected ({stagedPlayerIds.size})</Button>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-foreground" /><input type="text" placeholder="Search players..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-input border border-border rounded-md p-2 pl-10" /></div>
      <div><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-input border border-border rounded-md p-2">{PLAYER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
    </div>
    <div className="h-[50vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        {players.map(player => {
          const isAssigned = assignedPlayerIds.has(player.id);
          const isStaged = stagedPlayerIds.has(player.id);
          return (
            <div key={player.id} className={`p-2 rounded transition-all ${isAssigned ? 'opacity-40' : 'cursor-pointer'} ${isStaged ? 'bg-primary/20' : ''}`} onClick={() => !isAssigned && onStage(player.id)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isStaged} readOnly className="form-checkbox h-4 w-4 rounded bg-input border-border text-primary focus:ring-primary" disabled={isAssigned} />
                  <div><p className="font-semibold text-secondary-foreground">{player.name}</p><p className="text-xs text-secondary-foreground/70">{player.role}</p></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

const GameSetupPage = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [masterPlayers, setMasterPlayers] = useState([]);
  const [pools, setPools] = useState([]);
  const [curatedPlayers, setCuratedPlayers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [stagedPlayerIds, setStagedPlayerIds] = useState(new Set());

  // Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [poolToRename, setPoolToRename] = useState(null);
  const [newPoolName, setNewPoolName] = useState('');
  const [poolToDelete, setPoolToDelete] = useState(null);
  const [playerToEdit, setPlayerToEdit] = useState(null);
  const [editFormState, setEditFormState] = useState({ points: 0, basePrice: 0 });

  const loadInitialSetup = useCallback(async () => {
    if (!gameId) return;
    
    // Fetch game doc and auction players simultaneously
    const gameRef = doc(db, 'games', gameId);
    const auctionPlayersRef = collection(db, `games/${gameId}/auctionPlayers`);
    
    const [gameDoc, auctionPlayersSnap] = await Promise.all([
      getDoc(gameRef),
      getDocs(auctionPlayersRef)
    ]);

    if (!gameDoc.exists()) {
      toast.error("Game not found!");
      navigate('/');
      return;
    }

    // Load curated players into state
    const savedCuratedPlayers = {};
    auctionPlayersSnap.forEach(doc => {
      savedCuratedPlayers[doc.id] = { id: doc.id, ...doc.data() };
    });
    setCuratedPlayers(savedCuratedPlayers);

    // Load pools and reconstruct playerIds from curated players
    const savedPools = gameDoc.data().pools || [];
    const reconstructedPools = savedPools.map(pool => {
      const playerIdsInPool = Object.values(savedCuratedPlayers)
        .filter(p => p.poolId === pool.id)
        .map(p => p.id);
      return { ...pool, playerIds: playerIdsInPool };
    });
    setPools(reconstructedPools);

  }, [gameId, navigate]);

  useEffect(() => {
    // Fetch master players (can be real-time)
    const playersQuery = query(collection(db, "players"), orderBy("name", "asc"));
    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      setMasterPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    // Load the saved setup once
    loadInitialSetup();

    return () => unsubscribePlayers();
  }, [gameId, loadInitialSetup]);
  
  const assignedPlayerIds = new Set(Object.keys(curatedPlayers));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredMasterPlayers = useMemo(() => masterPlayers.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase())) && 
    (roleFilter === 'All' || p.role === roleFilter)
  ), [masterPlayers, searchTerm, roleFilter]);

  // --- Handlers (remain the same) ---
  const handleAddPool = () => setPools(p => [...p, { id: `pool-${nanoid()}`, name: `Pool ${p.length + 1}`, playerIds: [], isCollapsed: false }]);
  const handleTogglePoolCollapse = (poolId) => setPools(pools.map(p => p.id === poolId ? { ...p, isCollapsed: !p.isCollapsed } : p));
  const handleStagePlayer = (playerId) => { setStagedPlayerIds(prev => { const newStaged = new Set(prev); if (newStaged.has(playerId)) newStaged.delete(playerId); else newStaged.add(playerId); return newStaged; }); };
  const openAssignModal = () => { if (pools.length === 0) return toast.error("You must create a pool before assigning players."); if (stagedPlayerIds.size === 0) return toast.error("Please select players to assign."); setIsAssignModalOpen(true); };
  const confirmAssignPlayers = (poolId) => { if (!poolId || stagedPlayerIds.size === 0) return; const newPlayers = {}; masterPlayers.forEach(p => { if (stagedPlayerIds.has(p.id)) newPlayers[p.id] = { ...p, poolId }; }); setCuratedPlayers(prev => ({ ...prev, ...newPlayers })); setPools(prev => prev.map(p => p.id === poolId ? { ...p, playerIds: [...new Set([...p.playerIds, ...stagedPlayerIds])] } : p)); setStagedPlayerIds(new Set()); setIsAssignModalOpen(false); };
  const handleUnassignPlayer = (player) => { setCuratedPlayers(prev => { const newCurated = { ...prev }; delete newCurated[player.id]; return newCurated; }); setPools(prev => prev.map(p => p.id === player.poolId ? { ...p, playerIds: p.playerIds.filter(id => id !== player.id) } : p)); };
  const openRenameModal = (pool) => { setPoolToRename(pool); setNewPoolName(pool.name); };
  const confirmRenamePool = () => { if (!poolToRename || !newPoolName.trim()) return; setPools(prev => prev.map(p => p.id === poolToRename.id ? { ...p, name: newPoolName } : p)); setPoolToRename(null); };
  const openDeleteModal = (pool) => setPoolToDelete(pool);
  const confirmDeletePool = () => { if (!poolToDelete) return; const playersToUnassign = pools.find(p => p.id === poolToDelete.id)?.playerIds || []; setCuratedPlayers(prev => { const newCurated = { ...prev }; playersToUnassign.forEach(id => delete newCurated[id]); return newCurated; }); setPools(prev => prev.filter(p => p.id !== poolToDelete.id)); setPoolToDelete(null); };
  const openEditPlayerModal = (player) => { setPlayerToEdit(player); setEditFormState({ points: player.points, basePrice: player.basePrice }); };
  const handlePlayerEditChange = (e) => setEditFormState({...editFormState, [e.target.name]: e.target.value});
  const confirmEditPlayer = () => {
    if (!playerToEdit) return;

    const points = parseInt(editFormState.points, 10);
    if (isNaN(points) || points < 0 || points > 100) {
      return toast.error("Player points must be a number between 0 and 100.");
    }

    setCuratedPlayers(prev => ({
      ...prev,
      [playerToEdit.id]: {
        ...prev[playerToEdit.id],
        points: points,
        basePrice: parseFloat(editFormState.basePrice) || 0,
      }
    }));
    setPlayerToEdit(null);
  };
  const handleDragEnd = (event) => { const { active, over } = event; if (active.id !== over.id) { setPools((items) => { const oldIndex = items.findIndex(i => i.id === active.id); const newIndex = items.findIndex(i => i.id === over.id); return arrayMove(items, oldIndex, newIndex); }); } };
  const handleSaveSetup = async () => { if (Object.keys(curatedPlayers).length === 0) return toast.error("Please assign at least one player."); if (pools.some(p => p.playerIds.length === 0)) return toast.error("All pools must contain at least one player. Please delete any empty pools."); setIsSubmitting(true); const toastId = toast.loading('Saving auction setup...'); const setupData = { pools: pools.map((p, index) => ({ id: p.id, name: p.name, order: index, isCollapsed: p.isCollapsed })), players: Object.values(curatedPlayers), }; const success = await saveAuctionSetup(gameId, setupData, user.uid); if (success) { toast.success('Auction setup saved!', { id: toastId }); navigate(`/lobby/${gameId}`); } else { toast.error('Failed to save setup.', { id: toastId }); } setIsSubmitting(false); };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><Spinner /></div>;
  }

  return (
    <>
      {/* Modals */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assign ${stagedPlayerIds.size} Players`}>
        <p className="text-secondary-foreground mb-4">Select a pool:</p>
        <div className="space-y-2">{pools.map(pool => <Button key={pool.id} onClick={() => confirmAssignPlayers(pool.id)} className="w-full justify-start">{pool.name}</Button>)}</div>
      </Modal>
      <Modal isOpen={!!poolToRename} onClose={() => setPoolToRename(null)} title={`Rename ${poolToRename?.name}`}><input type="text" value={newPoolName} onChange={(e) => setNewPoolName(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md" /><div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={() => setPoolToRename(null)}>Cancel</Button><Button onClick={confirmRenamePool}>Save</Button></div></Modal>
      <Modal isOpen={!!poolToDelete} onClose={() => setPoolToDelete(null)} title={`Delete ${poolToDelete?.name}?`}><p className="text-secondary-foreground mb-6">All players in this pool will be unassigned.</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setPoolToDelete(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDeletePool}>Delete</Button></div></Modal>
      <Modal isOpen={!!playerToEdit} onClose={() => setPlayerToEdit(null)} title={`Edit ${playerToEdit?.name}`}><div className="space-y-4"><div><label className="block text-sm font-medium text-secondary-foreground">Points</label><input type="number" name="points" value={editFormState.points} onChange={handlePlayerEditChange} className="mt-1 w-full bg-input border border-border rounded-md p-2" /></div><div><label className="block text-sm font-medium text-secondary-foreground">Base Price (Cr)</label><input type="number" step="0.1" name="basePrice" value={editFormState.basePrice} onChange={handlePlayerEditChange} className="mt-1 w-full bg-input border border-border rounded-md p-2" /></div></div><div className="flex justify-end gap-2 mt-6"><Button variant="secondary" onClick={() => setPlayerToEdit(null)}>Cancel</Button><Button onClick={confirmEditPlayer}>Save Changes</Button></div></Modal>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-screen-xl mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <div><h1 className="text-3xl font-bold text-foreground">Auction Setup</h1><p className="mt-1 text-secondary-foreground">Organize players into draggable pools for the auction.</p></div>
            <div className="flex items-center gap-4">
              {stagedPlayerIds.size > 0 && (<Button onClick={openAssignModal}>Assign Selected ({stagedPlayerIds.size})</Button>)}
              <Button onClick={handleSaveSetup} disabled={isSubmitting || Object.keys(curatedPlayers).length === 0}>{isSubmitting ? 'Saving...' : 'Save Setup'}</Button>
            </div>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-8">
              <div className="bg-card p-4 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-card-foreground">Auction Pools</h2><Button onClick={handleAddPool} size="sm" variant="secondary"><Plus className="h-4 w-4 mr-2" />Add Pool</Button></div>
                <SortableContext items={pools.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">{pools.map(pool => <Pool key={pool.id} pool={pool} players={curatedPlayers} onRename={openRenameModal} onDelete={openDeleteModal} onUnassign={handleUnassignPlayer} onEditPlayer={openEditPlayerModal} onToggleCollapse={handleTogglePoolCollapse} />)}</div>
                </SortableContext>
              </div>
              <MasterPlayerList players={filteredMasterPlayers} onStage={handleStagePlayer} onAssign={openAssignModal} assignedPlayerIds={assignedPlayerIds} stagedPlayerIds={stagedPlayerIds} searchTerm={searchTerm} setSearchTerm={setSearchTerm} roleFilter={roleFilter} setRoleFilter={setRoleFilter} hasPools={pools.length > 0} />
            </div>
          </DndContext>
        </main>
      </div>
    </>
  );
};

export default GameSetupPage;
