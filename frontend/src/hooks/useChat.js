import { useState, useEffect, useRef, useCallback } from 'react';

export const useChat = (roomId, token) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !token) return;

    // Use ws:// for development
    const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
    };

    socketRef.current.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("WebSocket Message:", data);
      
      if (data.type === 'chat_message') {
        setMessages((prev) => [...prev, data]);
      } else if (data.type === 'user_typing') {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (data.is_typing) next.add(data.user);
          else next.delete(data.user);
          return next;
        });
      } else if (data.type === 'read_receipt') {
          // Future: Handle read receipts visually
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [roomId, token]);

  const sendMessage = useCallback((content) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'message',
        message: content
      }));
    }
  }, []);

  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'typing',
        is_typing: isTyping
      }));
    }
  }, []);

  const markRead = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            action: 'mark_read'
        }));
    }
  }, []);

  return { messages, setMessages, typingUsers, isConnected, sendMessage, sendTyping, markRead };
};
