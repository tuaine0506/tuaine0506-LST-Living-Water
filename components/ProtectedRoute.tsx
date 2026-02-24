
import React from 'react';
import { useApp } from '../context/AppContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useApp();

  if (!isAdmin) {
    // Redirect them to the home page, but save the current location they were
    // trying to go to. This is not used in this app, but is good practice.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
