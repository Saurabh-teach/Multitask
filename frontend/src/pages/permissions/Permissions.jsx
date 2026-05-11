import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { 
  Shield, Users, CheckCircle2, XCircle, 
  ChevronRight, Lock, Unlock, Settings,
  AlertCircle, Save
} from 'lucide-react';

const Permissions = () => {
  const { token, role: contextRole, refreshPermissions } = React.useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentOrgId, setCurrentOrgId] = useState(localStorage.getItem('orgId'));

  const permissionSchema = [
    { key: 'org_edit', label: 'Edit Organization Profile', category: 'Admin' },
    { key: 'member_invite', label: 'Invite New Members', category: 'Admin' },
    { key: 'member_remove', label: 'Remove Members', category: 'Admin' },
    { key: 'member_change_role', label: 'Change Roles & Permissions', category: 'Admin' },
    { key: 'goal_create', label: 'Create New Strategic Goals', category: 'Goals' },
    { key: 'goal_edit_any', label: 'Edit Any Strategic Goal', category: 'Goals' },
    { key: 'goal_delete_any', label: 'Delete Any Strategic Goal', category: 'Goals' },
    { key: 'task_create', label: 'Create New Tasks', category: 'Tasks' },
    { key: 'task_delete_any', label: 'Delete Any Task', category: 'Tasks' },
    { key: 'task_assign', label: 'Assign Tasks to Others', category: 'Tasks' },
    { key: 'view_logs', label: 'View All Activity Logs', category: 'Data' },
    { key: 'view_analytics', label: 'Access Analytics & Reports', category: 'Data' },
    { key: 'export_data', label: 'Export Workspace Data', category: 'Data' },
    { key: 'chat_manage', label: 'Manage Chat Rooms', category: 'Communication' },
    { key: 'file_upload', label: 'Upload Task Attachments', category: 'Tasks' },
  ];

  // Role-based delegation limits
  const delegatablePermissions = {
    'owner': '__all__',
    'admin': [
        'goal_create', 'goal_edit_any', 'goal_delete_any', 'task_create', 
        'task_delete_any', 'task_assign', 'view_logs', 'view_analytics', 
        'export_data', 'chat_manage', 'file_upload'
    ],
    'user': [
        'task_create', 'task_assign', 'file_upload'
    ]
  };

  const userRole = contextRole?.toLowerCase() || 'user';
  const myAllowedToDelegate = delegatablePermissions[userRole] || [];

  useEffect(() => {
    fetchMembers();

    const handleOrgChange = () => {
      const newOrgId = localStorage.getItem('orgId');
      setCurrentOrgId(newOrgId);
      setLoading(true);
      setSelectedMember(null);
    };

    window.addEventListener('storage', handleOrgChange);
    return () => window.removeEventListener('storage', handleOrgChange);
  }, [currentOrgId]);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const activeOrgId = currentOrgId || localStorage.getItem('orgId');
      if (!activeOrgId) return;

      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${activeOrgId}/members/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data.members || []);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load workspace members");
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedMember) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:8000/api/auth/organizations/${currentOrgId}/members/${selectedMember.id}/update-permissions/`,
        { 
          role: selectedMember.role,
          permissions: selectedMember.permissions 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Permissions synchronized successfully");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Permission sync failed");
    }
  };

  const togglePermission = async (key) => {
    if (!selectedMember) return;
    
    const updatedMember = { ...selectedMember };
    const currentPerms = updatedMember.permissions || {};
    currentPerms[key] = !currentPerms[key];
    updatedMember.permissions = currentPerms;
    
    // Optimistic Update
    setSelectedMember(updatedMember);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:8000/api/auth/organizations/${currentOrgId}/members/${selectedMember.id}/update-permissions/`,
        { permissions: currentPerms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${key.replace('_', ' ')} updated real-time`, { id: 'perm-sync' });
      
      // Sync sidebar immediately if editing self
      if (selectedMember.user_id === localStorage.getItem('userId')) {
         refreshPermissions();
      }

      fetchMembers();
    } catch (err) {
      toast.error("Real-time sync failed");
      fetchMembers(); // Revert on failure
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200 p-8">
           <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
              <div>
                 <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight flex items-center gap-3">
                    <Shield className="text-blue-600" size={28} />
                    Work Permissions
                 </h1>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manual Access Control & Hierarchy</p>
              </div>
           </div>
        </nav>

        <div className="flex-1 overflow-hidden flex max-w-7xl mx-auto w-full p-8 gap-8">
           {/* Members List */}
           <div className="w-1/3 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                 <Users size={18} className="text-gray-400" />
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Workspace Members</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                 {members.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-5 cursor-pointer transition-all flex items-center justify-between group ${selectedMember?.id === member.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedMember?.id === member.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                             {member.full_name[0]}
                          </div>
                          <div>
                             <h4 className={`text-sm font-bold transition-colors ${selectedMember?.id === member.id ? 'text-blue-600' : 'text-gray-900'}`}>{member.full_name}</h4>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{member.role}</span>
                          </div>
                       </div>
                       <ChevronRight size={16} className={`text-gray-300 transition-all ${selectedMember?.id === member.id ? 'translate-x-1 text-blue-500' : 'group-hover:translate-x-1'}`} />
                    </div>
                 ))}
              </div>
           </div>

           {/* Permissions Grid */}
           <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {selectedMember ? (
                 <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                       <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl font-bold text-gray-900">Permissions for {selectedMember.full_name}</h2>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                             Current Role: {selectedMember.role}
                          </div>
                       </div>
                       <p className="text-xs text-gray-500 font-medium">Manually override default role permissions for this user.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                       <div className="grid grid-cols-1 gap-4">
                           {permissionSchema.map(perm => {
                              const isDelegatable = myAllowedToDelegate === '__all__' || myAllowedToDelegate.includes(perm.key);
                              
                              return (
                                 <div 
                                   key={perm.key}
                                   onClick={() => isDelegatable && togglePermission(perm.key)}
                                   className={`p-6 rounded-2xl border transition-all flex items-center justify-between group ${
                                      !isDelegatable ? 'opacity-40 cursor-not-allowed bg-gray-50' : 
                                      selectedMember.permissions?.[perm.key] ? 'border-emerald-200 bg-emerald-50/30 cursor-pointer' : 
                                      'border-gray-100 bg-white hover:border-blue-200 cursor-pointer'
                                   }`}
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className={`p-3 rounded-xl transition-all ${
                                          !isDelegatable ? 'bg-gray-200 text-gray-400' :
                                          selectedMember.permissions?.[perm.key] ? 'bg-emerald-100 text-emerald-600' : 
                                          'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                                       }`}>
                                          {!isDelegatable ? <Lock size={20} /> : (selectedMember.permissions?.[perm.key] ? <Unlock size={20} /> : <Lock size={20} />)}
                                       </div>
                                       <div>
                                          <h4 className="text-[15px] font-bold text-gray-900">{perm.label}</h4>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                             {perm.category} Permission {!isDelegatable && "• RESTRICTED"}
                                          </span>
                                       </div>
                                    </div>
                                    
                                    {isDelegatable && (
                                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedMember.permissions?.[perm.key] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200'}`}>
                                          {selectedMember.permissions?.[perm.key] && <CheckCircle2 size={14} className="text-white" />}
                                       </div>
                                    )}
                                    {!isDelegatable && <div className="text-[10px] font-bold text-gray-400 italic">Level Too High</div>}
                                 </div>
                              );
                           })}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-20 gap-6">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center">
                       <Shield size={48} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a member to manage</h3>
                       <p className="text-gray-500 max-w-sm">Choose a team member from the left to adjust their roles and granular workspace permissions.</p>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Permissions;
