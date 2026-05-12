import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { 
  LayoutDashboard, ListTodo, Target, Users, 
  Building2, LogOut, Settings, HelpCircle, ChevronRight, MessageSquare, Shield, BarChart3,
  ChevronDown, Inbox
} from 'lucide-react';

const Sidebar = () => {
  const { token, logout, currentOrgId, setCurrentOrgId, permissions } = useContext(AuthContext);
  const [profile, setProfile] = useState({ name: 'Loading...', role: 'Team Member' });
  const [organizations, setOrganizations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token, currentOrgId]);

  const fetchOrganizations = async () => {
    try {
      const res = await apiClient.get('my-organizations/');
      const orgs = res.data.organizations || [];
      setOrganizations(orgs);

      console.log("Organizations loaded in Sidebar:", orgs.map(o => o.id || o.organization_id));
      // Initial validation of stored ID
      const currentId = localStorage.getItem('orgId');
      console.log("Current stored orgId:", currentId);
      
      let selectedOrg = orgs.find(o => (o.id || o.organization_id) === currentId);
      console.log("Found selectedOrg in list?", !!selectedOrg);
      
      if (!selectedOrg) {
          if (orgs.length > 0) {
              const firstOrg = orgs[0];
              const firstId = firstOrg.organization_id || firstOrg.id;
              console.log("CRITICAL: Stale/Empty selection detected. Forcing update to:", firstId);
              setCurrentOrgId(firstId);
              localStorage.setItem('orgId', firstId);
              window.dispatchEvent(new Event('storage'));
              selectedOrg = firstOrg;
          } else {
              console.log("CRITICAL: No organizations available. Clearing orgId.");
              setCurrentOrgId(null);
              localStorage.removeItem('orgId');
              window.dispatchEvent(new Event('storage'));
          }
      }

      if (selectedOrg) {
        updateProfile(selectedOrg);
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    }
  };

  const updateProfile = (org) => {
    const fullName = `${org.first_name || ''} ${org.last_name || ''}`.trim();
    setProfile({
      name: fullName || org.username || 'Team Member',
      role: org.role?.charAt(0).toUpperCase() + org.role?.slice(1) || ''
    });
  };

  useEffect(() => {
    // When currentOrgId changes (manual or storage event), update the profile info
    if (organizations.length > 0 && currentOrgId) {
      const selected = organizations.find(o => (o.id || o.organization_id) === currentOrgId);
      if (selected) {
        updateProfile(selected);
      }
    }
  }, [currentOrgId, organizations]);

  const handleOrgChange = (id) => {
      console.log("Switching to organization:", id);
      setCurrentOrgId(id);
      localStorage.setItem('orgId', id);
      window.dispatchEvent(new Event('storage')); 
  };

  const navItems = [
    { to: '/dashboard', label: 'My Work', icon: LayoutDashboard, category: 'Personal' },
    { to: '/goals', label: 'All Goals', icon: Target },
    { to: '/tasks', label: 'All Tasks', icon: ListTodo },
    { to: '/board', label: 'Sprint Board', icon: BarChart3 },
    { to: '/organizations/mailbox', label: 'Workspace Mailbox', icon: Inbox, category: 'Workspace', permission: 'org_edit' },
    { to: '/members', label: 'Our Team', icon: Users },
    { to: `/chat/${currentOrgId}`, label: 'Messenger', icon: MessageSquare, category: 'Communication' },
    { to: '/talent-pool', label: 'Member Pool', icon: Users, permission: 'member_invite' },
    { to: '/organizations/search', label: 'Discover Workspaces', icon: Building2, category: 'Personal' },
    { to: '/organizations', label: 'Organizations', icon: Building2, permission: 'org_edit' },
    { to: '/permissions', label: 'Work Permissions', icon: Shield, permission: 'member_change_role', category: 'Workspace' },
    { to: '/reports', label: 'Reports', icon: BarChart3, category: 'Workspace' },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.permission) return true;
    return permissions && permissions.includes(item.permission);
  });

  const handleLogout = () => {
    logout();
    localStorage.removeItem('orgId');
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="w-64 h-screen bg-[#FAFBFC] text-[#42526E] flex flex-col fixed left-0 top-0 border-r border-[#DFE1E6] z-50 overflow-y-auto font-sans">
      
      {/* Header */}
      <div className="px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0052CC] rounded flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <span className="text-xl font-semibold text-[#172B4D]">GoalFlow</span>
        </div>

        {/* Org Switcher */}
        <div className="relative group">
          <select 
            value={currentOrgId || ''}
            onChange={(e) => handleOrgChange(e.target.value)}
            className="w-full bg-white border border-[#DFE1E6] rounded px-3 py-2 text-sm font-medium text-[#172B4D] appearance-none focus:border-[#4C9AFF] outline-none cursor-pointer transition-all pr-8"
          >
            {organizations.map(org => (
              <option key={org.id || org.organization_id} value={org.id || org.organization_id}>
                {org.organization_name || org.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5E6C84]" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {filteredItems.map((item, index) => (
          <React.Fragment key={item.to}>
            {item.category && (
              <div className="px-3 mt-6 mb-2">
                <p className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">{item.category}</p>
              </div>
            )}
            <NavLink 
              to={item.to} 
              className={({ isActive }) => `group flex items-center gap-3 px-3 py-2 rounded text-[14px] transition-all ${isActive ? 'bg-[#EBECF0] text-[#0052CC] font-semibold' : 'hover:bg-[#EBECF0] text-[#42526E] hover:text-[#172B4D]'}`}
            >
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-[#DFE1E6] mt-auto">
        <div className="space-y-0.5 mb-4">
          <NavLink 
            to="/settings" 
            className="flex items-center gap-3 px-3 py-2 rounded text-[13px] text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D] transition-all"
          >
            <Settings size={16} /> Settings
          </NavLink>
          <NavLink 
            to="/help" 
            className="flex items-center gap-3 px-3 py-2 rounded text-[13px] text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D] transition-all"
          >
            <HelpCircle size={16} /> Help Center
          </NavLink>
        </div>

        <div className="flex items-center gap-3 p-2 rounded hover:bg-[#EBECF0] transition-all cursor-pointer group">
          <div className="w-9 h-9 bg-[#0052CC] rounded-lg flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-[#172B4D] truncate leading-tight">{profile.name}</p>
            <p className="text-[10px] text-[#5E6C84] truncate">{organizations.find(o => (o.id || o.organization_id) === currentOrgId)?.email || '...'}</p>
            <div className="flex items-center gap-1 mt-0.5">
               <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                 profile.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 
                 profile.role === 'Admin' ? 'bg-red-100 text-red-700' : 
                 'bg-blue-100 text-blue-700'
               }`}>
                 {profile.role}
               </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[#5E6C84] hover:text-[#DE350B] p-2 rounded hover:bg-[#FFEBE6] transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;