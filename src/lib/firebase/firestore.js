// Import generator for mock restaurant listings and review data
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import Firestore database methods and query utilities from Firebase SDK
import {
  // Reference a Firestore collection
  collection,
  // Attach a real-time listener for document or query snapshot changes
  onSnapshot,
  // Construct a Firestore query with constraints
  query,
  // Retrieve documents matching a query
  getDocs,
  // Reference a specific document in a collection
  doc,
  // Retrieve a single document snapshot
  getDoc,
  // Update fields of an existing document
  updateDoc,
  // Specify sort order for query results
  orderBy,
  // Firestore timestamp data type representation
  Timestamp,
  // Run an atomic transaction across multiple documents
  runTransaction,
  // Add equality/comparison filter constraints to a query
  where,
  // Add a new document with an auto-generated ID to a collection
  addDoc,
  // Access Firestore service instance
  getFirestore,
} from "firebase/firestore";

// Import initialized client-side Firestore instance
import { db } from "@/src/lib/firebase/clientApp";

/**
 * Updates the image URL reference for a specific restaurant document in Firestore.
 *
 * @param {string} restaurantId - The unique ID of the target restaurant.
 * @param {string} publicImageUrl - The new public image URL for the restaurant.
 */
// Define and export async function to update restaurant photo URL in Firestore
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  // Create document reference to the specific restaurant document in the "restaurants" collection
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  // Verify document reference exists
  if (restaurantRef) {
    // Update the photo field of the restaurant document with the new image URL
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

const updateWithRating = async (
    transaction,
    docRef,
    newRatingDocument,
    review
) => {
  const restaurant = await transaction.get(docRef);
  const data = restaurant.data();
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);
  const newAverage = newSumRating / newNumRatings;

  transaction.update(docRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  transaction.set(newRatingDocument, {
    ...review,
    timestamp: Timestamp.fromDate(new Date()),
  });
};


export async function addReviewToRestaurant(db, restaurantId, review) {
  if (!restaurantId) {
    throw new Error("No restaurant ID has been provided.");
  }

  if (!review) {
    throw new Error("A valid review has not been provided.");
  }

  try {
    const docRef = doc(collection(db, "restaurants"), restaurantId);
    const newRatingDocument = doc(
        collection(db, `restaurants/${restaurantId}/ratings`),
    );

    // corrected line
    await runTransaction(db, (transaction) =>
        updateWithRating(transaction, docRef, newRatingDocument, review),
    );
  } catch (error) {
    console.error(
        "There was an error adding the rating to the restaurant",
        error,
    );
    throw error;
  }
}


/**
 * Applies filtering and sorting criteria to a Firestore query based on user filter selections.
 *
 * @param {Query} q - Initial Firestore collection query.
 * @param {Object} filters - Filter criteria (category, city, price, sort).
 * @returns {Query} Filtered and sorted Firestore query.
 */
// Define helper function to apply filters and sort order to a Firestore query
function applyQueryFilters(q, { category, city, price, sort }) {
  // Check if a category filter is selected
  if (category) {
    // Add where clause filtering by category equality
    q = query(q, where("category", "==", category));
  }
  // Check if a city filter is selected
  if (city) {
    // Add where clause filtering by city equality
    q = query(q, where("city", "==", city));
  }
  // Check if a price filter is selected
  if (price) {
    // Add where clause filtering by price length (number of dollar signs)
    q = query(q, where("price", "==", price.length));
  }
  // Check if sort order is set to Rating or default (empty)
  if (sort === "Rating" || !sort) {
    // Order query results by avgRating in descending order
    q = query(q, orderBy("avgRating", "desc"));
  // Otherwise check if sort order is set to Review count
  } else if (sort === "Review") {
    // Order query results by numRatings in descending order
    q = query(q, orderBy("numRatings", "desc"));
  }
  // Return the configured query with all applied filters and sort orders
  return q;
}

/**
 * Fetches restaurants from Firestore matching the given filter criteria.
 * Formats Firestore timestamps to plain JavaScript Date objects for Server Component serialization.
 *
 * @param {Firestore} [db=db] - Firestore instance to query.
 * @param {Object} [filters={}] - Filter criteria.
 * @returns {Promise<Array<Object>>} List of formatted restaurant objects.
 */
// Define and export async function to fetch restaurant documents from Firestore
export async function getRestaurants(db = db, filters = {}) {
  // Initialize base query on the "restaurants" collection
  let q = query(collection(db, "restaurants"));

  // Apply filter and sorting constraints to the query
  q = applyQueryFilters(q, filters);
  // Execute query and fetch snapshot documents from Firestore
  const results = await getDocs(q);
  // Map document snapshots into plain JavaScript objects
  return results.docs.map((doc) => {
    // Return object containing document ID and serialized fields
    return {
      // Include document unique ID
      id: doc.id,
      // Spread all document data properties
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore Timestamp object to native JavaScript Date
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

/**
 * Sets up a real-time snapshot listener on the restaurants collection with filters applied.
 * Formats timestamps and executes callback with updated data whenever records change.
 *
 * @param {Function} cb - Callback function receiving array of restaurant objects.
 * @param {Object} [filters={}] - Filter criteria.
 * @returns {Function|undefined} Unsubscribe listener function.
 */
// Define and export function to subscribe to real-time updates for restaurant collection
export function getRestaurantsSnapshot(cb, filters = {}) {
  // Validate that callback parameter is a valid function
  if (typeof cb !== "function") {
    // Log error message when invalid callback is provided
    console.log("Error: The callback parameter is not a function");
    // Return early to prevent execution
    return;
  }

  // Initialize query on "restaurants" collection using client db
  let q = query(collection(db, "restaurants"));
  // Apply active filters to the query
  q = applyQueryFilters(q, filters);

  // Subscribe to real-time snapshot listener and return unsubscribe function
  return onSnapshot(q, (querySnapshot) => {
    // Map snapshot document results into formatted plain objects
    const results = querySnapshot.docs.map((doc) => {
      // Return object containing document ID and serialized fields
      return {
        // Document unique ID
        id: doc.id,
        // Document data fields
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore Timestamp to native Date
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // Invoke user callback with updated results array
    cb(results);
  });
}

/**
 * Fetches a single restaurant document by its ID.
 *
 * @param {Firestore} db - Firestore instance.
 * @param {string} restaurantId - ID of the restaurant document to retrieve.
 * @returns {Promise<Object|undefined>} Formatted restaurant data object.
 */
// Define and export async function to get a single restaurant document by ID
export async function getRestaurantById(db, restaurantId) {
  // Validate that a restaurant ID is provided
  if (!restaurantId) {
    // Log error message if restaurant ID is missing or invalid
    console.log("Error: Invalid ID received: ", restaurantId);
    // Return early
    return;
  }
  // Create document reference for target restaurant ID in "restaurants" collection
  const docRef = doc(db, "restaurants", restaurantId);
  // Fetch document snapshot from Firestore
  const docSnap = await getDoc(docRef);
  // Return formatted restaurant data object
  return {
    // Spread document fields
    ...docSnap.data(),
    // Convert Firestore Timestamp to native Date
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

/**
 * Subscribes to real-time changes for a single restaurant document.
 *
 * @param {string} restaurantId - ID of the restaurant document.
 * @param {Function} cb - Callback invoked with the updated restaurant data.
 * @returns {Function|undefined} Unsubscribe listener function.
 */
// Define and export function to subscribe to real-time updates for a single restaurant
export function getRestaurantSnapshotById(restaurantId, cb) {
  // Check if restaurant ID is valid
  if (!restaurantId) {
    // Log error message
    console.log("Error: Invalid ID received: ", restaurantId);
    // Return early
    return;
  }

  // Check if callback parameter is a valid function
  if (typeof cb !== "function") {
    // Log error message
    console.log("Error: The callback parameter is not a function");
    // Return early
    return;
  }

  // Create document reference for the restaurant
  const docRef = doc(db, "restaurants", restaurantId);
  // Attach real-time snapshot listener and return unsubscribe function
  return onSnapshot(docRef, (docSnap) => {
    // Execute callback with formatted document data
    cb({
      // Spread document fields
      ...docSnap.data(),
      // Convert Firestore Timestamp to native Date
      timestamp: docSnap.data().timestamp.toDate(),
    });
  });
}

/**
 * Fetches all reviews for a specific restaurant from its ratings subcollection, ordered newest first.
 *
 * @param {Firestore} db - Firestore instance.
 * @param {string} restaurantId - Restaurant document ID.
 * @returns {Promise<Array<Object>|undefined>} Array of formatted review objects.
 */
// Define and export async function to fetch all reviews for a given restaurant
export async function getReviewsByRestaurantId(db, restaurantId) {
  // Validate restaurant ID
  if (!restaurantId) {
    // Log error message if ID is missing
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    // Return early
    return;
  }

  // Create query on the "ratings" subcollection ordered by timestamp descending
  const q = query(
    // Reference nested "ratings" subcollection inside restaurant document
    collection(db, "restaurants", restaurantId, "ratings"),
    // Order reviews newest first
    orderBy("timestamp", "desc")
  );

  // Fetch all review documents matching query
  const results = await getDocs(q);
  // Map document snapshots to plain objects
  return results.docs.map((doc) => {
    // Return formatted review object
    return {
      // Review document ID
      id: doc.id,
      // Review data fields
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore Timestamp to native Date
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

/**
 * Subscribes to real-time changes for a restaurant's reviews subcollection.
 *
 * @param {string} restaurantId - Restaurant document ID.
 * @param {Function} cb - Callback invoked with updated array of reviews.
 * @returns {Function|undefined} Unsubscribe listener function.
 */
// Define and export function to subscribe to real-time review updates for a restaurant
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // Validate restaurant ID
  if (!restaurantId) {
    // Log error message if ID is missing
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    // Return early
    return;
  }

  // Create query on "ratings" subcollection ordered by timestamp descending
  const q = query(
    // Reference nested "ratings" subcollection
    collection(db, "restaurants", restaurantId, "ratings"),
    // Order reviews newest first
    orderBy("timestamp", "desc")
  );
  // Attach real-time snapshot listener and return unsubscribe function
  return onSnapshot(q, (querySnapshot) => {
    // Map snapshot documents into formatted plain objects
    const results = querySnapshot.docs.map((doc) => {
      // Return formatted review object
      return {
        // Review document ID
        id: doc.id,
        // Review data fields
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore Timestamp to native Date
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    // Invoke callback with updated reviews array
    cb(results);
  });
}

/**
 * Seeds mock restaurants and reviews into Firestore for development/demo purposes.
 * Generates mock data and writes restaurant documents and associated ratings subcollections.
 */
// Define and export async function to generate and insert fake restaurant and review data
export async function addFakeRestaurantsAndReviews() {
  // Generate array of fake restaurant objects with nested ratings
  const data = await generateFakeRestaurantsAndReviews();
  // Loop over each generated restaurant and ratings entry
  for (const { restaurantData, ratingsData } of data) {
    // Begin try block to handle document write errors
    try {
      // Add restaurant document to "restaurants" collection in Firestore
      const docRef = await addDoc(
        // Collection reference
        collection(db, "restaurants"),
        // Restaurant data payload
        restaurantData
      );

      // Loop through mock ratings for this restaurant
      for (const ratingData of ratingsData) {
        // Add rating document to nested "ratings" subcollection of the created restaurant
        await addDoc(
          // Subcollection reference under restaurant document ID
          collection(db, "restaurants", docRef.id, "ratings"),
          // Rating data payload
          ratingData
        );
      }
    // Catch write errors
    } catch (e) {
      // Log failure notice to console
      console.log("There was an error adding the document");
      // Log error details
      console.error("Error adding document: ", e);
    }
  }
}
