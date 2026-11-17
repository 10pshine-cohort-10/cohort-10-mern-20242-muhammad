import React, { createContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getMe } from '../services/authService';

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  isAuthenticated: false
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const response = await getMe();
        if (isMounted && response?.data?.data?.user) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export default AuthContext;

