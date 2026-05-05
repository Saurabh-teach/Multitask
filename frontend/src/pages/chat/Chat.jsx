import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Send, Hash, MessageSquare, Users, 
  Paperclip, Smile, MoreVertical, Search,
  ChevronLeft, Info, Settings, Phone, Video
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { useChat } from '../../hooks/useChat';
import { AuthContext } from '../../context/AuthContext';

const Chat = () => {
  const { orgId } = useParams();
  const { token, user } = React.useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const { 
    messages, 
    setMessages, 
    typingUsers, 
    sendMessage, 
    sendTyping,
    markRead 
  } = useChat(activeRoom?.id, token);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!orgId || !token) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/auth/organizations/${orgId}/chat-rooms/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRooms(res.data);
        if (res.data.length > 0 && !activeRoom) setActiveRoom(res.data[0]);
        setLoading(false);
      } catch (err) { 
        console.error(err);
        setLoading(false);
      }
    };
    fetchRooms();
  }, [orgId, token]);

  useEffect(() => {
    if (activeRoom && token) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`http://localhost:8000/api/auth/chat-rooms/${activeRoom.id}/history/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(res.data);
          markRead();
        } catch (err) { console.error(err); }
      };
      fetchHistory();
    }
  }, [activeRoom, token, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    sendTyping(false);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await axios.post(`http://localhost:8000/api/auth/organizations/${orgId}/chat-rooms/`, 
        { name: newRoomName, is_group: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms([...rooms, res.data]);
      setActiveRoom(res.data);
      setShowCreateModal(false);
      setNewRoomName('');
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex h-screen bg-[#f4f5f7] items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f4f5f7] dark:bg-slate-900 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Create a Channel</h3>
                <p className="text-slate-500 text-sm mb-8">Channels are where your team communicates. They’re best when organized around a topic — like #marketing.</p>
                
                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Channel Name</label>
                    <div className="relative">
                      <Hash className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        autoFocus
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="e.g. design-team"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!newRoomName.trim()}
                      className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Messenger
            </h2>
            <div className="mt-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search chats..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Channels</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-bold transition-all hover:scale-110"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {rooms.map(room => (
                  <button 
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group ${
                      activeRoom?.id === room.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Hash className={`w-4 h-4 ${activeRoom?.id === room.id ? 'text-blue-200' : 'text-slate-400'}`} />
                      <span className="font-semibold">{room.name || 'General'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Direct Messages</p>
              <p className="text-xs text-slate-400 italic px-4">No active DMs</p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-[#f8fafc] dark:bg-slate-950">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="h-20 px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {activeRoom?.name?.[0] || 'G'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">#{activeRoom?.name || 'General'}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Collaborative Space</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-green-500 font-medium">Active now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="flex flex-col items-center py-10 opacity-50 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Hash className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Start of #{activeRoom.name}</h4>
                    <p className="text-sm text-slate-500 max-w-md mt-2 px-6">
                        This is the beginning of the chat for #{activeRoom.name}. Welcome everyone!
                    </p>
                </div>

                {messages.map((msg, i) => {
                  const isMe = msg.sender?.username === user?.username;
                  const showAvatar = i === 0 || messages[i-1].sender?.username !== msg.sender?.username;

                  return (
                    <div key={i} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                      {!isMe && (
                        <div className={`w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 ${!showAvatar ? 'invisible' : ''}`}>
                          {msg.sender?.username?.[0].toUpperCase()}
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[65%]`}>
                        {showAvatar && (
                          <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {isMe ? 'You' : (msg.sender_name || msg.sender?.username)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div className={`px-5 py-3 rounded-2xl text-sm shadow-sm transition-all ${
                          isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none hover:bg-blue-700 shadow-blue-500/10' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50 hover:border-slate-200'
                        }`}>
                          {msg.message || msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                        {Array.from(typingUsers).join(', ')} is typing...
                    </p>
                  </div>
                )}
                <form onSubmit={handleSend} className="relative flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border-2 border-transparent focus-within:border-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-sm">
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      sendTyping(e.target.value.length > 0);
                    }}
                    placeholder={`Message #${activeRoom?.name || 'General'}`}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                  />
                  <div className="flex items-center gap-1">
                    <button type="button" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                        <Smile className="w-5 h-5" />
                    </button>
                    <button 
                        type="submit" 
                        disabled={!input.trim()}
                        className={`p-2.5 rounded-xl transition-all ${
                            input.trim() 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-100' 
                            : 'bg-slate-200 text-slate-400 scale-95 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 rounded-[40px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6">
                    <MessageSquare className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Your Workspace Messenger</h3>
                <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
                    Select a channel or member from the sidebar to start collaborating. Real-time updates keep your team in sync.
                </p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-8 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                >
                    Create New Channel
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;
