import { getFirestore } from 'firebase/firestore';
import { firebaseApp, firebaseAuth } from 'app';

// Export the firebase auth from the app module
export const auth = firebaseAuth;

// Initialize Firestore from the existing Firebase app
export const db = getFirestore(firebaseApp);

// Remove persistence setup that causes mobile issues
console.log('Firebase initialized');

// Export the Firebase app from the app module
export default firebaseApp;
