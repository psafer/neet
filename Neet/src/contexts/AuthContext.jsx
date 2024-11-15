import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = React.createContext(); // Export AuthContext

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up an authentication state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Update the current user when it changes
      setLoading(false); // Stop loading once authentication state is determined
    }, (error) => {
      console.error('Error with auth state change:', error);
      setLoading(false); // Ensure the loading state is reset even on error
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only when not loading */}
    </AuthContext.Provider>
  );
}

// Add PropTypes validation for the children prop
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
