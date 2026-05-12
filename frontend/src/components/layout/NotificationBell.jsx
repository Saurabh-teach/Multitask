import React, { useContext, useState } from 'react';
import { Bell, X, CheckCircle2, UserPlus, Mail, Info } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'invitation': return <UserPlus size={16} className="text-blue-500" />;
      case 'join_request': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'org_inquiry': return <Mail size={16} className="text-purple-500" />;
      default: return <Info size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#5E6C84] hover:bg-[#F4F5F7] rounded-full transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#DFE1E6] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#DFE1E6] flex justify-between items-center bg-[#F4F5F7]">
              <h3 className="text-sm font-semibold text-[#172B4D]">Notifications</h3>
              <button 
                onClick={markAllRead}
                className="text-xs text-[#0052CC] hover:underline font-medium"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`px-4 py-3 border-b border-[#F4F5F7] hover:bg-[#F4F5F7] transition-all cursor-pointer flex gap-3 ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#172B4D]">{n.title}</p>
                      <p className="text-xs text-[#5E6C84] mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-[#C1C7D0] mt-1 italic">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-[#0052CC] rounded-full mt-2" />}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-[#F4F5F7] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-[#C1C7D0]" />
                  </div>
                  <p className="text-sm text-[#5E6C84]">All caught up!</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <button className="w-full py-2 bg-white text-xs text-[#5E6C84] font-medium border-t border-[#DFE1E6] hover:bg-[#F4F5F7]">
                View all activity
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
