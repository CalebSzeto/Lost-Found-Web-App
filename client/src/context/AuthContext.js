'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerUser, loginUser, getCurrentUser, setAuthToken } from '@/lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, displayName) => {
    const res = await registerUser(email, password, displayName);
    const { token, user } = res.data;
    setAuthToken(token);
    setCurrentUser({
      uid: user.user_id,
      email: user.email,
      displayName: user.displayName,
    });
    return res;
  };

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    const { token, user } = res.data;
    setAuthToken(token);
    setCurrentUser({
      uid: user.user_id,
      email: user.email,
      displayName: user.displayName,
    });
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await getCurrentUser();
        const user = res.data;
        setCurrentUser({
          uid: user.user_id,
          email: user.email,
          displayName: user.displayName,
        });
      } catch (err) {
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
