import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
        if (!e.newValue) {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (token) {
      // Decode user from token or fetch profile
      axios.get('http://localhost:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const organizations = res.data.organizations || [];
        const userOrg = organizations[0];
        if (userOrg) {
          setUser({ 
            id: userOrg.user, 
            username: userOrg.username,
            name: `${userOrg.first_name || ''} ${userOrg.last_name || ''}`.trim() || userOrg.username
          });
        } else {
          // Fallback if no org found
          setUser({ loggedIn: true, username: 'User' });
        }
      }).catch(err => {
        console.error("Profile fetch error:", err);
        setUser({ loggedIn: true, username: 'User' });
      });
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};