import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { useCurrentUser } from 'app'; // Use the existing hook to get the Firebase user
import { db } from './firebase'; // Import the initialized Firestore instance

export interface UserProfile extends DocumentData {
  // Define expected profile fields. Add others as needed.
  displayName?: string;
  email?: string;
  userType?: 'standard' | 'freelancer'; // Add the crucial userType field
  // Add other fields relevant to the user profile if they exist
}

export const useUserProfile = () => {
  const { user } = useCurrentUser(); // Get the firebase auth user object
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Encapsulate fetching logic into a callable function
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setProfile(null); // No user logged in
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid); // Reference to users/{userId}
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Handle case where profile document doesn't exist yet
        // For now, assume 'standard' if no profile exists
        console.log('No user profile document found for UID:', user.uid, '- Assuming standard user.');
        setProfile({ userType: 'standard' }); // Default to standard if no profile found
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependency on user

  // Initial fetch on mount or when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]); // Now depends on the memoized fetchProfile

  // Expose the fetchProfile function as refetch
  return { profile, loading, error, refetch: fetchProfile };
};