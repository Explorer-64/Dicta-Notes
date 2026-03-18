import React from 'react';
import { UserGuard } from 'app';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <UserGuard>{children}</UserGuard>;
};
