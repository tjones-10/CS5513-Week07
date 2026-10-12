// Directive instructing Next.js to treat this component as a client component
"use client";
// Import React library and useEffect hook for side effects
import React, { useEffect } from "react";
// Import Next.js Link component for client-side navigation
import Link from "next/link";
// Import Firebase authentication helper functions
import {
  // Import sign-in with Google function
  signInWithGoogle,
  // Import sign-out function
  signOut,
  // Import listener for auth ID token changes
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
// Import helper to populate mock Firestore data
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// Import cookie manipulation functions from cookies-next
import { setCookie, deleteCookie } from "cookies-next";

/**
 * Custom React Hook to manage and sync user authentication session state.
 * Listens for Firebase ID token changes, updates the "__session" cookie
 * so server components can access credentials, and triggers a page reload
 * if the user state changes compared to initial server rendering.
 *
 * @param {Object|null} initialUser - User object serialized from server-side rendering.
 * @returns {Object|null} The initial user object passed into the hook.
 */
// Define custom hook for managing auth session and syncing cookie with server
function useUserSession(initialUser) {
  // Run side effect on mount and when initialUser changes
  useEffect(() => {
    // Listen for authentication token changes (login, logout, token refresh)
    return onIdTokenChanged(async (user) => {
      // Check if user is logged in
      if (user) {
        // Retrieve fresh ID token and store in cookie for server-side auth
        const idToken = await user.getIdToken();
        // Save session cookie for Next.js SSR requests
        await setCookie("__session", idToken);
      } else {
        // Clear session cookie when user logs out
        await deleteCookie("__session");
      }
      // Reload page if current client auth status differs from initial SSR user state
      if (initialUser?.uid === user?.uid) {
        // Exit early if user session state matches initial SSR state
        return;
      }
      // Trigger full page reload to refresh server-rendered state
      window.location.reload();
    });
    // Dependency array for the effect
  }, [initialUser]);

  // Return the initial user data passed into the hook
  return initialUser;
}

/**
 * Header component displaying navigation bar, logo, user profile status,
 * sign-in/sign-out actions, and sample data population trigger.
 *
 * @param {Object} props - Component properties.
 * @param {Object|null} props.initialUser - Initial user data from server component.
 */
// Define and export main navigation Header component
export default function Header({ initialUser }) {
  // Sync user session state across client and cookie storage
  const user = useUserSession(initialUser);

  // Handle user sign-out action
  const handleSignOut = (event) => {
    // Prevent default browser link navigation behavior
    event.preventDefault();
    // Invoke sign out helper
    signOut();
  };

  // Handle user sign-in action via Google authentication
  const handleSignIn = (event) => {
    // Prevent default browser link navigation behavior
    event.preventDefault();
    // Invoke Google sign-in popup flow
    signInWithGoogle();
  };

  // Render navigation bar UI
  return (
    // Header semantic element container
    <header>
      {/* Brand logo and link to homepage */}
      <Link href="/" className="logo">
        {/* FriendlyEats SVG brand image */}
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {/* Render user profile and menu if signed in, otherwise show Sign In button */}
      {user ? (
        // Render authenticated user UI fragment
        <>
          {/* Profile container div */}
          <div className="profile">
            {/* User info paragraph displaying avatar and name */}
            <p>
              {/* User profile image with fallback placeholder */}
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {/* Display user name */}
              {user.displayName}
            </p>

            {/* Profile menu dropdown container */}
            <div className="menu">
              ...
              {/* Menu items list */}
              <ul>
                {/* User display name item */}
                <li>{user.displayName}</li>

                {/* Trigger function to seed mock restaurants and reviews in Firestore */}
                <li>
                  {/* Anchor link to trigger sample data generation */}
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                {/* Sign out link */}
                <li>
                  {/* Anchor link to sign out */}
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // Render unauthenticated sign-in button container
        <div className="profile">
          {/* Sign in with Google trigger */}
          <a href="#" onClick={handleSignIn}>
            {/* Profile placeholder icon */}
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
