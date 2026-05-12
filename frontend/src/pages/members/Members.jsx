import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { 
  Users, Search, UserPlus, Mail,
  Shield, CheckCircle2, XCircle, MoreVertical,
  Activity, ArrowUpRight, Building, Layout, AlertCircle
} from 'lucide-react';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { currentOrgId } = useContext(AuthContext);

  useEffect(() => {
    if (currentOrgId) {
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`organizations/${currentOrgId}/members/`);
      setMembers(res.data.members || []);
      setOrganizationName(res.data.organization_name || 'Organization');
    } catch (err) {
      toast.error("Failed to sync team directory");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Remove this member? All their active tasks will be unassigned.")) return;
    
    try {
      await apiClient.delete(`organizations/members/${memberId}/remove/`);
      toast.success("Member removed from workspace");
      fetchMembers();
    } catch (err) {
      toast.error("Removal failed");
    }
  };

  const filteredMembers = members.filter(member => {
      const fullName = (member.full_name || member.username || '');
      return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (member.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (member.job_title || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRoleBadge = (role) => {
    const roles = {
      owner: { color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Shield size={12} /> },
      admin: { color: 'bg-red-50 text-red-700 border-red-100', icon: <Shield size={12} /> },
      user: { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Users size={12} /> },
    };
    const style = roles[role] || roles.user;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${style.color}`}>
        {style.icon}
        {role}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <nav className="bg-white border-b border-gray-100 shrink-0">
          <div className="px-10 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                 <Users size={24} />
               </div>
               <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Team Directory</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-2">
                    <Building size={12} className="text-gray-300" /> {organizationName}
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative group hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter by name or role..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm w-80 focus:bg-white focus:border-blue-200 outline-none transition-all shadow-sm shadow-gray-100/50"
                />
              </div>
              <button 
                onClick={() => navigate('/members/invite')}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Invite Member
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             {[
               { label: 'Workspace Size', val: members.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
               { label: 'Active Status', val: members.filter(m => m.is_active).length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
               { label: 'Overall Efficiency', val: `${members.length > 0 ? Math.round(members.reduce((acc, m) => acc + parseFloat(m.completion_rate), 0) / members.length) : 0}%`, icon: Layout, color: 'text-indigo-600 bg-indigo-50' },
               { label: 'Peak Velocity', val: '+2.4%', icon: Activity, color: 'text-purple-600 bg-purple-50' }
             ].map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                  <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{m.label}</p>
                     <h3 className="text-3xl font-black text-gray-900 tracking-tight">{m.val}</h3>
                  </div>
                  <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center shadow-lg shadow-current/5 group-hover:scale-110 transition-transform`}>
                     <m.icon size={24} />
                  </div>
               </div>
             ))}
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4">
               <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
               <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Directory...</p>
             </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="py-6 px-12">Member Profile</th>
                    <th className="py-6 px-8">Assignment Status</th>
                    <th className="py-6 px-8">Workload Intensity</th>
                    <th className="py-6 px-8">Efficiency Index</th>
                    <th className="py-6 px-12 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => (
                    <tr key={member.member_id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="py-8 px-12">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            {member.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg tracking-tight">
                              {member.full_name}
                            </p>
                            <div className="flex flex-col gap-1 mt-1">
                               <p className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                                  <Mail size={12} className="text-gray-300" /> {member.email}
                               </p>
                               <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">
                                  {member.job_title || 'Core contributor'}
                               </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-8">
                         {getRoleBadge(member.role)}
                      </td>
                      <td className="py-8 px-8">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                              <Layout size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 tracking-tight">{member.tasks_assigned} Active Tasks</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{member.tasks_completed} Resolved</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-8 px-8">
                         <div className="space-y-3 w-32">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                               <span>Velocity</span>
                               <span className="text-blue-600">{member.completion_rate}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                               <div 
                                 className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000"
                                 style={{ width: member.completion_rate }}
                               />
                            </div>
                         </div>
                      </td>
                      <td className="py-8 px-12 text-right">
                        <div className="flex justify-end items-center gap-4">
                           <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${member.is_active ? 'bg-emerald-500 text-white' : 'bg-red-50 text-red-600'}`}>
                             {member.is_active ? 'Active' : 'Offline'}
                           </span>
                           <button 
                             onClick={() => handleDeleteMember(member.member_id)}
                             className="p-3 text-gray-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100 active:scale-90"
                             title="Restrict Access"
                           >
                             <AlertCircle size={20} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="py-32 text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-200">
                      <Users size={40} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 mb-1">No matches found</h3>
                   <p className="text-gray-400 text-sm font-medium">Refine your search parameters to find team members.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;