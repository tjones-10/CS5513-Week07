// Import authentication methods and providers from Firebase Auth SDK
// Import GoogleAuthProvider class to configure Google OAuth authentication
import {
  GoogleAuthProvider,
  // Import signInWithPopup function to initiate authentication in a browser popup
  signInWithPopup,
  // Import onAuthStateChanged aliased as _onAuthStateChanged to prevent name collisions
  onAuthStateChanged as _onAuthStateChanged,
  // Import onIdTokenChanged aliased as _onIdTokenChanged to prevent name collisions
  onIdTokenChanged as _onIdTokenChanged,
} from "firebase/auth";

// Import the initialized client-side Firebase Auth instance
import { auth } from "@/src/lib/firebase/clientApp";

/**
 * Subscribes to Firebase authentication state changes (sign-in, sign-out).
 * @param {Function} cb - Callback invoked whenever authentication state changes.
 * @returns {Function} Unsubscribe function to remove the listener.
 */
// Export a function that listens for changes in user sign-in state
export function onAuthStateChanged(cb) {
  // Register the callback with Firebase Auth and return the unsubscribe function
  return _onAuthStateChanged(auth, cb);
}

/**
 * Subscribes to ID token changes (token refresh, sign-in, sign-out).
 * @param {Function} cb - Callback invoked whenever the ID token changes.
 * @returns {Function} Unsubscribe function to remove the listener.
 */
// Export a function that listens for changes or refreshes to the user's ID token
export function onIdTokenChanged(cb) {
  // Register the callback with Firebase Auth token listener and return unsubscribe function
  return _onIdTokenChanged(auth, cb);
}

/**
 * Initiates user sign-in via Google OAuth popup.
 * Uses GoogleAuthProvider with the client Auth instance and logs any errors.
 */
// Export an async function to prompt the user to sign in using their Google account
export async function signInWithGoogle() {
  // Instantiate Google authentication provider instance
  const provider = new GoogleAuthProvider();

  // Begin try block to catch potential popup or network errors during authentication
  try {
    // Open the Google sign-in popup dialog and await completion
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Output error details to console if sign-in fails or user closes the popup
    console.error("Error signing in with Google", error);
  }
}

/**
 * Signs out the currently authenticated user from Firebase Auth.
 * Logs any encountered errors to the console.
 */
// Export an async function to log the user out of the application
export async function signOut() {
  // Begin try block to handle any sign-out failure
  try {
    // Invoke signOut method on the client Firebase Auth instance
    return auth.signOut();
  } catch (error) {
    // Log error details to console if sign-out fails
    console.error("Error signing out with Google", error);
  }
}

