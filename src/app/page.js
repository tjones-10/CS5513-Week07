// Import client component for displaying restaurant listings and filter controls
import RestaurantListings from "@/src/components/RestaurantListings.jsx";

// Import Firestore function to query restaurants
import { getRestaurants } from "@/src/lib/firebase/firestore.js";

// Import server app authentication helper
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";

// Import Firestore initialization helper
import { getFirestore } from "firebase/firestore";

// Force Next.js to treat this route as dynamically server-side rendered on every request
// Without this line, Next.js would treat this route as static during build
export const dynamic = "force-dynamic";

// Optional configuration to ensure cache revalidation is immediate
// export const revalidate = 0;

/**
 * Server Component representing the home page.
 * Reads URL search parameters (e.g. ?city=London&category=Indian&sort=Review),
 * queries Firestore on the server using an authenticated server Firebase instance,
 * and passes initial data to the interactive client component for optimal performance and SEO.
 *
 * @param {Object} props - Next.js page props.
 * @param {Promise<Object>} props.searchParams - Promise resolving to URL query search parameters.
 */
// Define and export the async Home page Server Component
export default async function Home(props) {
  // Await search parameters provided by Next.js App Router
  const searchParams = await props.searchParams;

  // Retrieve authenticated Firebase Server App instance for server-side queries
  const { firebaseServerApp } = await getAuthenticatedAppForUser();

  // Query restaurants from Firestore using server Firestore instance and active search filters
  const restaurants = await getRestaurants(
    // Initialize Firestore service bound to the authenticated server app
    getFirestore(firebaseServerApp),
    // Pass search parameters for query filtering
    searchParams
  );

  // Return the main JSX container for the home page
  return (
    // Render main element with home page styling class
    <main className="main__home">
      {/* Pass initial server-fetched restaurants and search parameters to client listings component */}
      <RestaurantListings
        // Pass server-fetched restaurant records as initial props
        initialRestaurants={restaurants}
        // Pass initial search parameters to keep client filter state in sync
        searchParams={searchParams}
      />
    </main>
  );
}
