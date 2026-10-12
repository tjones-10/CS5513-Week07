// Enforces that this code can only be called on the server to prevent exposing server-side secrets or logic to client bundles
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
// Import server-only package to ensure build fails if this module is bundled into client builds
import "server-only";

// Import cookies utility from Next.js headers to read incoming request cookies
import { cookies } from "next/headers";
// Import Firebase App initialization methods for server-side and default app instances
import { initializeServerApp, initializeApp } from "firebase/app";
// Import getAuth to access the authentication service attached to a Firebase app instance
import { getAuth } from "firebase/auth";

/**
 * Creates and returns an authenticated Firebase Server App instance for Server-Side Rendering (SSR)
 * and Static Site Generation (SSG).
 *
 * Reads the "__session" cookie containing the client's Firebase Auth ID token,
 * initializes a scoped Firebase server app with this token, waits until authentication
 * state is ready, and returns both the server app instance and current user data.
 *
 * @returns {Promise<{firebaseServerApp: FirebaseServerApp, currentUser: User|null}>}
 */
// Define and export async helper to get authenticated server Firebase app instance for the request
export async function getAuthenticatedAppForUser() {
  // Extract "__session" cookie containing the client's Firebase auth ID token from request headers
  const authIdToken = (await cookies()).get("__session")?.value;

  // Firebase Server App allows instantiating the SDK with user credentials
  // retrieved from the client for safe execution in server environments.
  // Initialize server-side Firebase app configured with default credentials and current user token
  const firebaseServerApp = initializeServerApp(
      // Initialize the underlying default Firebase application configuration
      // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
      initializeApp(),
      // Provide the user auth ID token for server-side authorization
      {
        authIdToken,
      }
  );

  // Obtain auth instance associated with the server app
  const auth = getAuth(firebaseServerApp);
  // Await resolution of the authentication state on the server
  await auth.authStateReady();

  // Return server app instance along with currentUser record
  return { firebaseServerApp, currentUser: auth.currentUser };
}

