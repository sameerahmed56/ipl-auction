import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./config";

/**
 * Initiates the Google Sign-In popup flow.
 * @returns {Promise<UserCredential|null>} A promise that resolves with the user credential on success, or null on error.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    return null;
  }
};

/**
 * Signs out the current user.
 * @returns {Promise<void>} A promise that resolves when the user is signed out.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
