// Import global CSS styles applied across the entire application
import "@/src/app/styles.css";

// Import top navigation Header component
import Header from "@/src/components/Header.jsx";

// Import helper to fetch server-authenticated Firebase app and user instance
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";

// Force Next.js to treat this route layout as dynamically server-side rendered on every request
// Without this line, Next.js would generate a static HTML page during the build process
export const dynamic = "force-dynamic";

// Application metadata for HTML document head (<title>, <meta description>)
export const metadata = {
  // Set browser tab title
  title: "FriendlyEats",
  // Set SEO meta description
  description:
    "FriendlyEats is a restaurant review website built with Next.js and Firebase.",
};

/**
 * RootLayout component wrapping all pages in the Next.js App Router.
 * Fetches current authenticated user on the server to pass initial user state to the client Header,
 * ensuring seamless user experience and consistent auth status across server and client.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child page components to render within the layout.
 */
// Define and export the async root layout component for Next.js App Router
export default async function RootLayout({ children }) {
  // Retrieve the authenticated user session on the server
  const { currentUser } = await getAuthenticatedAppForUser();

  // Return the main document layout structure
  return (
    // HTML document element specifying English language
    <html lang="en">
      {/* Document body container */}
      <body>
        {/* Render Header with serialized user data (converted to JSON for client component passing) */}
        <Header initialUser={currentUser?.toJSON()} />

        {/* Main page content container hosting nested child routes */}
        <main>{children}</main>
      </body>
    </html>
  );
}
