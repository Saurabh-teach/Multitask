import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { 
  LayoutDashboard, ListTodo, Target, Users, 
  Building2, LogOut, Settings, HelpCircle, ChevronRight, MessageSquare
} from 'lucide-react';

const Sidebar = () => {
  const { token } = React.useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: 'Loading...',
    role: '',
    avatar: ''
  });
  const [goals, setGoals] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrgId, setCurrentOrgId] = useState(localStorage.getItem('orgId') || null);

  useEffect(() => {
    fetchInitialData();
  }, [token, currentOrgId]);

  const fetchInitialData = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      const orgs = res.data.organizations || [];
      setOrganizations(orgs);

      // If no org selected yet, pick the first one
      let selectedOrg = orgs.find(o => o.id === currentOrgId || o.organization_id === currentOrgId);
      if (!selectedOrg && orgs.length > 0) {
          selectedOrg = orgs[0];
          const newId = selectedOrg.organization_id || selectedOrg.id;
          setCurrentOrgId(newId);
          localStorage.setItem('orgId', newId);
      }

      if (selectedOrg) {
        const targetId = selectedOrg.organization_id || selectedOrg.id;
        const fullName = `${selectedOrg.first_name || ''} ${selectedOrg.last_name || ''}`.trim();
        setProfile({
          name: fullName || selectedOrg.username || 'Team Member',
          role: selectedOrg.role?.charAt(0).toUpperCase() + selectedOrg.role?.slice(1) || ''
        });

        // Fetch Goals for the selected organization
        const goalsRes = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${targetId}/goals/`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        setGoals(goalsRes.data);
      }
    } catch (err) {
      console.error('Sidebar error:', err);
    }
  };

  const handleOrgChange = (id) => {
      setCurrentOrgId(id);
      localStorage.setItem('orgId', id);
      // Trigger a page refresh or event to update other components
      window.dispatchEvent(new Event('storage')); 
  };

  const navItems = [
    { to: '/dashboard', label: 'Your Work', icon: LayoutDashboard, category: 'Planning' },
    { to: '/goals', label: 'All Goals', icon: Target },
    { to: '/tasks', label: 'Sprint Board', icon: ListTodo },
    { to: '/members', label: 'Our Team', icon: Users, category: 'Workspace' },
    { to: `/chat/${currentOrgId}`, label: 'Messenger', icon: MessageSquare, category: 'Communication' },
    { to: '/talent-pool', label: 'Member Pool', icon: Users, roles: ['Owner', 'Admin', 'Manager'] },
    { to: '/organizations', label: 'Organizations', icon: Building2, roles: ['Owner', 'Admin'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(profile.role);
  });

  return (
    <div className="w-72 h-screen bg-white text-gray-700 flex flex-col fixed left-0 top-0 border-r border-gray-200 shadow-[2px_0_15_rgba(0,0,0,0.02)] z-50 overflow-y-auto">
      
      {/* Logo Header */}
      <div className="px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
            G
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-gray-900 brand-font">GoalFlow</div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Execute Together</p>
          </div>
        </div>

        {/* Organization Switcher */}
        <div className="space-y-2">
           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Active Workspace</label>
           <div className="relative group">
              <select 
                value={currentOrgId || ''}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[13px] font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer transition-all pr-10"
              >
                {organizations.map(org => (
                  <option key={org.id || org.organization_id} value={org.id || org.organization_id}>
                    {org.organization_name || org.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronRight size={16} className="rotate-90" />
              </div>
           </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item, index) => (
          <React.Fragment key={item.to}>
            {item.category && (
              <div className="px-4 mt-6 mb-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.category}</p>
              </div>
            )}
            <NavLink 
              to={item.to} 
              className={({ isActive }) => `group flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:bg-gray-50 text-gray-600'}`}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600 transition-colors'} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className={`transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </>
              )}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-6 bg-gray-50/50 mt-auto">
        <div className="space-y-1 mb-6">
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 ${isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm'}`}
          >
            <Settings size={18} /> Settings
          </NavLink>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all duration-300">
            <HelpCircle size={18} /> Help Center
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md uppercase">
            {profile.name.charAt(0)}
            {profile.name.split(' ').length > 1 ? profile.name.split(' ')[1].charAt(0) : ''}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-[13px] text-gray-900 truncate">{profile.name}</p>
            <p className="text-[11px] text-gray-500 font-medium truncate">{profile.role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;