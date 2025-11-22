import { doc, writeBatch, serverTimestamp, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, getDocs } from "firebase/firestore";
import { db } from "./config";

/**
 * Generates a random 6-character uppercase alphanumeric string for a game code.
 * @returns {string} A 6-character game code.
 */
const generateGameCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Creates a new game document and adds the host to the teams sub-collection.
 * @param {object} hostUser - The Firebase auth user object of the host.
 * @returns {Promise<string|null>} The game ID if successful, otherwise null.
 */
export const createGame = async (hostUser) => {
  const gameId = generateGameCode();
  const gameRef = doc(db, "games", gameId);
  const teamRef = doc(db, `games/${gameId}/teams`, hostUser.uid);
  const now = serverTimestamp();

  try {
    const batch = writeBatch(db);

    // Set the main game document
    batch.set(gameRef, {
      hostId: hostUser.uid,
      status: "lobby",
      settings: {
        startingBudget: 100,
        bidTimer: 30,
      },
      createdAt: now,
      createdBy: hostUser.uid,
      updatedAt: now,
      updatedBy: hostUser.uid,
    });

    // Set the host's team document
    batch.set(teamRef, {
      userId: hostUser.uid,
      teamName: `${hostUser.displayName}'s Team`,
      remainingBudget: 100,
      players: [],
      createdAt: now,
      createdBy: hostUser.uid,
      updatedAt: now,
      updatedBy: hostUser.uid,
    });

    await batch.commit();
    console.log(`Game created with ID: ${gameId}`);
    return gameId;
  } catch (error) {
    console.error("Error creating game: ", error);
    return null;
  }
};

/**
 * Adds a user to an existing game.
 * @param {string} gameId - The ID of the game to join.
 * @param {object} user - The Firebase auth user object of the joining player.
 * @returns {Promise<{success: boolean, message: string}>} An object indicating success or failure.
 */
export const joinGame = async (gameId, user) => {
  const gameRef = doc(db, "games", gameId);
  const teamRef = doc(db, `games/${gameId}/teams`, user.uid);
  const now = serverTimestamp();

  try {
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) {
      return { success: false, message: "Game not found." };
    }

    const teamDoc = await getDoc(teamRef);
    if (teamDoc.exists()) {
      return { success: true, message: "Already in game." };
    }
    
    const gameSettings = gameDoc.data().settings;

    await setDoc(teamRef, {
      userId: user.uid,
      teamName: `${user.displayName}'s Team`,
      remainingBudget: gameSettings.startingBudget,
      players: [],
      createdAt: now,
      createdBy: user.uid,
      updatedAt: now,
      updatedBy: user.uid,
    });

    console.log(`User ${user.uid} joined game ${gameId}`);
    return { success: true, message: "Successfully joined game." };
  } catch (error) {
    console.error("Error joining game: ", error);
    return { success: false, message: "An error occurred while trying to join the game." };
  }
};

/**
 * Updates a user's team name in a game.
 * @param {string} gameId - The ID of the game.
 * @param {string} userId - The ID of the user whose team name is being updated.
 * @param {string} newName - The new team name.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const updateTeamName = async (gameId, userId, newName) => {
  if (!newName.trim()) {
    console.error("Team name cannot be empty.");
    return false;
  }
  const teamRef = doc(db, `games/${gameId}/teams`, userId);
  try {
    await updateDoc(teamRef, {
      teamName: newName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
    console.log(`Team name updated for user ${userId} in game ${gameId}`);
    return true;
  } catch (error) {
    console.error("Error updating team name: ", error);
    return false;
  }
};

/**
 * Removes a player from a game.
 * @param {string} gameId - The ID of the game.
 * @param {string} playerId - The ID of the player to remove.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const removePlayerFromGame = async (gameId, playerId) => {
  const teamRef = doc(db, `games/${gameId}/teams`, playerId);
  try {
    await deleteDoc(teamRef);
    console.log(`Player ${playerId} removed from game ${gameId}`);
    return true;
  } catch (error) {
    console.error("Error removing player: ", error);
    return false;
  }
};

// ==================================================================
// Admin Player Management Functions
// ==================================================================

const playersCollectionRef = collection(db, "players");

/**
 * Adds a new player to the master player list.
 * @param {object} playerData - The data for the new player.
 * @param {string} adminId - The UID of the admin performing the action.
 * @returns {Promise<string|null>} The new player's document ID if successful.
 */
export const addPlayer = async (playerData, adminId) => {
  try {
    const now = serverTimestamp();
    const docRef = await addDoc(playersCollectionRef, {
      ...playerData,
      basePrice: parseFloat(playerData.basePrice) || 0,
      points: parseInt(playerData.points, 10) || 0,
      createdAt: now,
      createdBy: adminId,
      updatedAt: now,
      updatedBy: adminId,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding player: ", error);
    return null;
  }
};

/**
 * Updates an existing player in the master list.
 * @param {string} playerId - The ID of the player to update.
 * @param {object} playerData - The new data for the player.
 * @param {string} adminId - The UID of the admin performing the action.
 * @returns {Promise<boolean>} True if successful.
 */
export const updatePlayer = async (playerId, playerData, adminId) => {
  const playerRef = doc(db, "players", playerId);
  try {
    await updateDoc(playerRef, {
      ...playerData,
      basePrice: parseFloat(playerData.basePrice) || 0,
      points: parseInt(playerData.points, 10) || 0,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    });
    return true;
  } catch (error) {
    console.error("Error updating player: ", error);
    return false;
  }
};

/**
 * Deletes a player from the master list.
 * @param {string} playerId - The ID of the player to delete.
 * @returns {Promise<boolean>} True if successful.
 */
export const deletePlayer = async (playerId) => {
  const playerRef = doc(db, "players", playerId);
  try {
    await deleteDoc(playerRef);
    return true;
  } catch (error) {
    console.error("Error deleting player: ", error);
    return false;
  }
};

/**
 * Saves the entire auction setup, including pools and curated players.
 * This is an atomic operation that first clears the old setup.
 * @param {string} gameId
 * @param {{pools: Array, players: Array}} setupData - Object containing ordered pools and player data.
 * @param {string} hostId - The UID of the host performing the action.
 * @returns {Promise<boolean>}
 */
export const saveAuctionSetup = async (gameId, setupData, hostId) => {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const gameRef = doc(db, "games", gameId);
  const auctionPlayersRef = collection(db, `games/${gameId}/auctionPlayers`);

  try {
    // 1. Clear existing auction players to ensure a fresh setup
    const existingPlayersQuery = query(auctionPlayersRef);
    const existingPlayersSnapshot = await getDocs(existingPlayersQuery);
    existingPlayersSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Set new auction players
    setupData.players.forEach(player => {
      const newPlayerRef = doc(db, `games/${gameId}/auctionPlayers`, player.id);
      batch.set(newPlayerRef, {
        ...player,
        status: 'pending', // pending, active, sold, unsold
      });
    });

    // 3. Update the main game document with pools and new status
    batch.update(gameRef, {
      pools: setupData.pools,
      status: 'ready',
      updatedAt: now,
      updatedBy: hostId,
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error saving auction setup: ", error);
    return false;
  }
};
