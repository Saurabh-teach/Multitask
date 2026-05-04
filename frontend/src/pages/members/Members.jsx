import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { 
  Users, Search, UserPlus, Mail, Phone, 
  Shield, CheckCircle2, XCircle, MoreVertical,
  Activity, ArrowUpRight, Building, Layout, AlertCircle
} from 'lucide-react';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orgId = orgRes.data.organizations?.[0]?.organization_id || orgRes.data.organizations?.[0]?.id;
      if (orgId) {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMembers(res.data.members || []);
        setOrganizationName(res.data.organization_name || 'Organization');
      }
    } catch (err) {
      toast.error("Failed to sync team directory");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member from the organization?")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/auth/organization-members/${memberId}/remove/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Member removed");
      fetchMembers();
    } catch (err) {
      toast.error("Failed to remove member");
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
      manager: { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Activity size={12} /> },
      member: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: <Users size={12} /> },
    };
    const style = roles[role] || roles.member;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${style.color}`}>
        {style.icon}
        {role}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Modern Top Navbar */}
        <nav className="bg-white border-b border-gray-200 shrink-0">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                 <Users size={24} />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Team Directory</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Building size={10} /> {organizationName} Workspace
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search members by name, role or title..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-[14px] w-96 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium"
                />
              </div>
              <button 
                onClick={() => navigate('/members/invite')}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                <UserPlus size={18} /> Invite Member
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 animate-fade-in">
          
          {/* Header Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="card-premium flex items-center justify-between p-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Team</p>
                   <h3 className="text-2xl font-bold text-gray-900 brand-font">{members.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   <Users size={24} />
                </div>
             </div>
             <div className="card-premium flex items-center justify-between p-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active</p>
                   <h3 className="text-2xl font-bold text-gray-900 brand-font">{members.filter(m => m.is_active).length}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <CheckCircle2 size={24} />
                </div>
             </div>
             <div className="card-premium flex items-center justify-between p-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Completion</p>
                   <h3 className="text-2xl font-bold text-gray-900 brand-font">
                     {members.length > 0 ? Math.round(members.reduce((acc, m) => acc + parseFloat(m.completion_rate), 0) / members.length) : 0}%
                   </h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <Layout size={24} />
                </div>
             </div>
             <div className="card-premium flex items-center justify-between p-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">New Roles</p>
                   <h3 className="text-2xl font-bold text-gray-900 brand-font">+2</h3>
                </div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                   <ArrowUpRight size={24} />
                </div>
             </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 font-bold">Syncing team directory...</p>
             </div>
          ) : (
            <div className="card-premium p-0 overflow-hidden shadow-xl border-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="py-5 px-10">Member Profile</th>
                    <th className="py-5 px-6">Role & Title</th>
                    <th className="py-5 px-6">Workload</th>
                    <th className="py-5 px-6">Performance</th>
                    <th className="py-5 px-6 text-center">Status</th>
                    <th className="py-5 px-10 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => (
                    <tr key={member.member_id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="py-6 px-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                            {member.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-[15px]">
                              {member.full_name}
                            </p>
                            <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                               <Mail size={12} /> {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                         <div className="space-y-1.5">
                            {getRoleBadge(member.role)}
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{member.job_title || 'Software Engineer'}</p>
                         </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                              <Layout size={16} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-700">{member.tasks_assigned} Tasks</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{member.tasks_completed} Completed</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                         <div className="space-y-2 max-w-[120px]">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                               <span>Efficiency</span>
                               <span className="text-blue-600">{member.completion_rate}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                                 style={{ width: member.completion_rate }}
                               />
                            </div>
                         </div>
                      </td>
                      <td className="py-6 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${member.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-700'}`}>
                          {member.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-6 px-10 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleDeleteMember(member.member_id)}
                             className="p-2.5 text-gray-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100"
                             title="Remove Member"
                           >
                             <AlertCircle size={20} />
                           </button>
                           <button className="p-2.5 text-gray-300 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-gray-200">
                             <MoreVertical size={20} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="py-20 text-center">
                   <Users size={48} className="text-gray-200 mx-auto mb-4" />
                   <p className="text-gray-500 font-bold">No matching team members found.</p>
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