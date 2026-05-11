import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState('user');
  const [currentOrgId, setCurrentOrgIdState] = useState(localStorage.getItem('orgId'));

  const setCurrentOrgId = (id) => {
    localStorage.setItem('orgId', id);
    setCurrentOrgIdState(id);
    window.dispatchEvent(new Event('storage')); // For other tabs
  };

  const fetchContext = async () => {
    if (!token) return;
    try {
      let activeOrgId = localStorage.getItem('orgId');
      if (!activeOrgId) return;

      // Validate ID before fetching
      const orgsRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgs = orgsRes.data.organizations || [];
      const isValid = orgs.some(o => (o.id || o.organization_id) === activeOrgId);
      
      if (!isValid && orgs.length > 0) {
          console.log("AuthContext: activeOrgId not valid. Auto-recovering to first valid organization.");
          const newOrgId = orgs[0].id || orgs[0].organization_id;
          localStorage.setItem('orgId', newOrgId);
          setCurrentOrgIdState(newOrgId);
          window.dispatchEvent(new Event('storage'));
          activeOrgId = newOrgId; // Use the new one for the rest of the fetch
      } else if (!isValid) {
          console.log("AuthContext: activeOrgId not valid and no organizations found. Skipping context fetch.");
          return;
      }

      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${activeOrgId}/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPermissions(res.data.permissions || []);
      setRole(res.data.role || 'user');
    } catch (err) {
      console.error("Context sync error:", err);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
        if (!e.newValue) {
          setUser(null);
          setPermissions([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for local orgId changes from other tabs
    const handleOrgUpdate = (e) => {
      if (e.key === 'orgId') {
        setCurrentOrgIdState(e.newValue);
      }
    };
    window.addEventListener('storage', handleOrgUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', handleOrgUpdate);
    };
  }, []);

  useEffect(() => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const organizations = res.data.organizations || [];
        const userOrg = organizations[0];
        if (userOrg) {
          // Auto-select first org if none selected
          if (!localStorage.getItem('orgId')) {
            localStorage.setItem('orgId', userOrg.id || userOrg.organization_id);
            window.dispatchEvent(new Event('storage'));
          }
          setUser({ 
            id: userOrg.user_id || userOrg.id, 
            username: userOrg.username,
            name: `${userOrg.first_name || ''} ${userOrg.last_name || ''}`.trim() || userOrg.username
          });
          fetchContext();
        }
      });

      // Background sync every 30 seconds
      const interval = setInterval(fetchContext, 30000);
      return () => clearInterval(interval);
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
    setPermissions([]);
    setRole('user');
  };

  return (
    <AuthContext.Provider value={{ 
      token, user, role, permissions, 
      currentOrgId, setCurrentOrgId,
      login, logout, refreshPermissions: fetchContext 
    }}>
      {children}
    </AuthContext.Provider>
  );
};