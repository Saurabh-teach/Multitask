import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import apiClient from '../api/client';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token && user) {
      apiClient.get('/notifications/').then(res => {
        setNotifications(res.data.results || []);
        setUnreadCount(res.data.results?.filter(n => !n.is_read).length || 0);
      }).catch(err => console.error("Notification load error:", err));
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) return;

    // WebSocket URL using Token authentication
    const wsUrl = `ws://127.0.0.1:8000/ws/notifications/?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast(data.message, {
          icon: '🔔',
          style: {
            borderLeft: '6px solid #0052CC',
            background: '#fff',
            color: '#172B4D',
            fontWeight: '600'
          }
        });
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    socket.onerror = (err) => console.error("Notification WebSocket error:", err);

    return () => socket.close();
  }, [token, user]);

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark_all_read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
