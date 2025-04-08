import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Assuming useAuth hook provides authentication status

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from your AuthContext
  const location = useLocation();

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking auth state
    return <div>Loading...</div>;
  }

  if (!user) {
    // User not logged in, redirect them to the login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the requested component
  return <>{children}</>;
};

export default ProtectedRoute;
