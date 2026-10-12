// Directive designating this file as a Client Component in Next.js
"use client";

// This component handles the restaurant listings page.
// It receives data from src/app/page.js, such as the initial restaurants and search params from the URL.

// Import Link component for client-side routing
import Link from "next/link";
// Import React, useState, and useEffect hooks
import { React, useState, useEffect } from "react";
// Import Next.js client router hook
import { useRouter } from "next/navigation";
// Import star rating rendering helper
import renderStars from "@/src/components/Stars.jsx";
// Import real-time Firestore snapshot listener
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
// Import filter dropdowns and controls component
import Filters from "@/src/components/Filters.jsx";

/**
 * Individual restaurant list item rendering a clickable link to restaurant details.
 *
 * @param {Object} props
 * @param {Object} props.restaurant - Restaurant data object.
 */
// Define subcomponent rendering a single restaurant card in list
const RestaurantItem = ({ restaurant }) => (
  // List item container keyed by restaurant ID
  <li key={restaurant.id}>
    {/* Clickable link to restaurant details page */}
    <Link href={`/restaurant/${restaurant.id}`}>
      {/* Active restaurant display card */}
      <ActiveResturant restaurant={restaurant} />
    </Link>
  </li>
);

/**
 * Composite container displaying the restaurant image cover and details.
 *
 * @param {Object} props
 * @param {Object} props.restaurant - Restaurant data object.
 */
// Define subcomponent displaying cover photo and restaurant metadata
const ActiveResturant = ({ restaurant }) => (
  // Container wrapper div
  <div>
    {/* Restaurant cover image component */}
    <ImageCover photo={restaurant.photo} name={restaurant.name} />
    {/* Restaurant details component */}
    <ResturantDetails restaurant={restaurant} />
  </div>
);

/**
 * Displays restaurant cover image with fallback styling and alt text.
 *
 * @param {Object} props
 * @param {string} props.photo - Image URL.
 * @param {string} props.name - Restaurant name.
 */
// Define subcomponent rendering cover image
const ImageCover = ({ photo, name }) => (
  // Image cover container
  <div className="image-cover">
    {/* Image element with source and alt attributes */}
    <img src={photo} alt={name} />
  </div>
);

/**
 * Displays restaurant information including name, rating summary, and metadata.
 *
 * @param {Object} props
 * @param {Object} props.restaurant - Restaurant data object.
 */
// Define subcomponent rendering restaurant info block
const ResturantDetails = ({ restaurant }) => (
  // Details container div
  <div className="restaurant__details">
    {/* Restaurant name header */}
    <h2>{restaurant.name}</h2>
    {/* Rating stars and review count */}
    <RestaurantRating restaurant={restaurant} />
    {/* Category, city, and price info */}
    <RestaurantMetadata restaurant={restaurant} />
  </div>
);

/**
 * Renders star rating icons along with total number of user ratings.
 *
 * @param {Object} props
 * @param {Object} props.restaurant - Restaurant data object containing avgRating and numRatings.
 */
// Define subcomponent rendering star rating and review count
const RestaurantRating = ({ restaurant }) => (
  // Rating wrapper div
  <div className="restaurant__rating">
    {/* Unordered list containing rendered star icons */}
    <ul>{renderStars(restaurant.avgRating)}</ul>
    {/* Total ratings count span */}
    <span>({restaurant.numRatings})</span>
  </div>
);

/**
 * Renders restaurant category, city, and price level in dollar signs ($).
 *
 * @param {Object} props
 * @param {Object} props.restaurant - Restaurant data object containing category, city, and price.
 */
// Define subcomponent rendering metadata tags
const RestaurantMetadata = ({ restaurant }) => (
  // Metadata wrapper div
  <div className="restaurant__meta">
    {/* Category and city paragraph */}
    <p>
      {/* Category and city formatted string */}
      {restaurant.category} | {restaurant.city}
    </p>
    {/* Price indicator repeating dollar sign by price integer */}
    <p>{"$".repeat(restaurant.price)}</p>
  </div>
);

/**
 * Main RestaurantListings component managing filter state, URL query syncing,
 * and real-time Firestore subscription to render restaurant cards.
 *
 * @param {Object} props
 * @param {Array<Object>} props.initialRestaurants - Initial restaurant records from server fetch.
 * @param {Object} props.searchParams - Search params parsed from URL query string.
 */
// Define and export default RestaurantListings component
export default function RestaurantListings({
  initialRestaurants,
  searchParams,
}) {
  // Initialize router for URL manipulation
  const router = useRouter();

  // Initialize filters based on URL search params, ensuring state persistence on reload
  const initialFilters = {
    // City filter value or default empty string
    city: searchParams.city || "",
    // Category filter value or default empty string
    category: searchParams.category || "",
    // Price filter value or default empty string
    price: searchParams.price || "",
    // Sort filter value or default empty string
    sort: searchParams.sort || "",
  };

  // State holding list of restaurants
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  // State holding active filter options
  const [filters, setFilters] = useState(initialFilters);

  // Sync filter changes to URL query parameters
  useEffect(() => {
    // Update router query parameters on filter change
    routerWithFilters(router, filters);
  }, [router, filters]);

  // Subscribe to real-time Firestore snapshot updates when filters change
  useEffect(() => {
    // Subscribe to snapshot updates and return cleanup listener
    return getRestaurantsSnapshot((data) => {
      // Update restaurant state with new data
      setRestaurants(data);
    }, filters);
  }, [filters]);

  // Render listings UI
  return (
    // Article container wrapping filter bar and listings
    <article>
      {/* Interactive filter dropdowns and controls */}
      <Filters filters={filters} setFilters={setFilters} />

      {/* Grid of restaurant cards */}
      <ul className="restaurants">
        {/* Map each restaurant to RestaurantItem card */}
        {restaurants.map((restaurant) => (
          // Render item component with restaurant key
          <RestaurantItem key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>
    </article>
  );
}

/**
 * Helper function to serialize filter parameters into URL search string and push to router.
 *
 * @param {Object} router - Next.js App Router navigation object.
 * @param {Object} filters - Current active filter state.
 */
// Define helper function to serialize filters into query string and push to router
function routerWithFilters(router, filters) {
  // Create URLSearchParams instance
  const queryParams = new URLSearchParams();

  // Loop through filter key-value entries
  for (const [key, value] of Object.entries(filters)) {
    // Check if filter has an active value
    if (value !== undefined && value !== "") {
      // Append filter parameter to search params
      queryParams.append(key, value);
    }
  }

  // Convert search params to string format
  const queryString = queryParams.toString();
  // Update browser URL query string without reloading page
  router.push(`?${queryString}`);
}
