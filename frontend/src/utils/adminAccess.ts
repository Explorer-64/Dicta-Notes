/**
 * Utility to check if a user is an admin/tester with access to beta features
 */

import { User } from "firebase/auth";

// List of admin UIDs that have access to beta features
const ADMIN_UIDS = [
  "9i0N2RABLaYAmvn889QjGXxI7x23", // Diana Reimer
];

/**
 * Checks if the current user is an admin with access to beta features
 * @param user The Firebase user object
 * @returns boolean indicating if user has admin access
 */
export const isAdminUser = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check if user's UID is in the admin list
  return ADMIN_UIDS.includes(user.uid);
};
