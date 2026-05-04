import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const handleLogout = () => {
  localStorage.removeItem('token');
  toast.success("Logged out successfully");
  window.location.href = '/login';
};

// In the bottom user section, replace LogOut with:
<LogOut 
  size={20} 
  className="text-gray-400 hover:text-red-500 cursor-pointer" 
  onClick={handleLogout} 
/>

