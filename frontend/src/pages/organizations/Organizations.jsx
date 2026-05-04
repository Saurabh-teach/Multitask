import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronDown, ChevronRight, Building, Users, 
  Calendar, ArrowRight, Target, Plus, Search,
  Activity, BarChart3, MoreVertical, CheckCircle2
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { toast } from 'react-hot-toast';

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [membersCache, setMembersCache] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(res.data.organizations || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationMembers = async (orgId) => {
    if (membersCache[orgId]) return;
    
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembersCache(prev => ({
        ...prev,
        [orgId]: res.data
      }));
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleExpand = (orgId) => {
    if (expandedOrg === orgId) {
      setExpandedOrg(null);
    } else {
      setExpandedOrg(orgId);
      fetchOrganizationMembers(orgId);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-y-auto">
        {/* Topbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <Building className="text-blue-600" size={24} />
               <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Organizations</h1>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search workspace..." 
                   className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                 />
               </div>
               <button 
                onClick={() => navigate('/organizations/create')}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                <Plus size={18} /> New Organization
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="px-10 py-10 max-w-7xl mx-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-4">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 font-bold animate-pulse">Loading Organizations...</p>
             </div>
          ) : organizations.length === 0 ? (
            <div className="card-premium text-center py-24 animate-fade-in">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <Building size={48} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 brand-font mb-4">No Organizations Found</h3>
              <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">You aren't connected to any workspace yet. Create your first organization to start executing your goals.</p>
              <button 
                onClick={() => navigate('/organizations/create')}
                className="btn-primary text-lg px-10 py-4"
              >
                Create My First Organization
              </button>
            </div>
          ) : (
            <div className="card-premium p-0 overflow-hidden animate-fade-in shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                      <th className="py-5 px-8 w-12"></th>
                      <th className="py-5 px-4">Organization</th>
                      <th className="py-5 px-4">Role</th>
                      <th className="py-5 px-4">Members</th>
                      <th className="py-5 px-4">Joined Date</th>
                      <th className="py-5 px-8 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {organizations.map((org, index) => (
                      <React.Fragment key={org.organization_id}>
                        <tr 
                          className={`hover:bg-blue-50/20 transition-all cursor-pointer group ${expandedOrg === org.organization_id ? 'bg-blue-50/40' : ''}`}
                          onClick={() => toggleExpand(org.organization_id)}
                        >
                          <td className="py-6 px-8">
                            {expandedOrg === org.organization_id ? 
                              <ChevronDown size={20} className="text-blue-600 animate-bounce" /> : 
                              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                            }
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                {org.organization_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 text-[15px] block">{org.organization_name}</span>
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Workspace #{index + 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {org.role}
                            </span>
                          </td>
                          <td className="py-6 px-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users size={16} className="text-gray-400" />
                              <span className="font-bold text-sm">{org.member_count} Members</span>
                            </div>
                          </td>
                          <td className="py-6 px-4 text-gray-500 font-medium text-sm">
                             {new Date(org.joined_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                          </td>
                          <td className="py-6 px-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/goals/create?orgId=${org.organization_id}`);
                                  }}
                                  className="bg-indigo-50 text-indigo-600 font-bold text-sm hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-indigo-100"
                                >
                                  <Plus size={14} /> Goal
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dashboard`);
                                  }}
                                  className="text-blue-600 font-bold text-sm hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-blue-100"
                                >
                                  Dashboard <ArrowRight size={14} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                                   <MoreVertical size={18} />
                                </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Area - Employees and Progress */}
                        {expandedOrg === org.organization_id && (
                          <tr className="bg-white">
                            <td colSpan="6" className="p-0">
                              <div className="m-8 border border-blue-100 bg-blue-50/20 rounded-[2rem] p-8 shadow-inner animate-fade-in">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                        <Activity size={20} />
                                      </div>
                                      <h4 className="text-xl font-bold text-gray-900 brand-font">Team Execution Metrics</h4>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/dashboard');
                                      }}
                                      className="text-sm font-bold text-blue-600 flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                                    >
                                       <BarChart3 size={16} /> Advanced Analytics
                                    </button>
                                </div>
                                
                                {loadingMembers ? (
                                  <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-bold text-sm">Fetching team data...</span>
                                  </div>
                                ) : membersCache[org.organization_id]?.members && membersCache[org.organization_id].members.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {membersCache[org.organization_id].members.map(member => (
                                      <div key={member.member_id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                         <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-bold text-lg">
                                               {member.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-bold text-gray-900 truncate">{member.full_name || member.username}</p>
                                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{member.role}</p>
                                            </div>
                                            <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                                               {member.tasks_assigned} TASKS
                                            </div>
                                         </div>

                                         <div className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                               <span>Goal Progress</span>
                                               <span className="text-blue-600">{Math.round(member.completion_rate || 0)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" 
                                                style={{ width: `${member.completion_rate || 0}%` }}
                                              />
                                            </div>
                                         </div>

                                         <div className="mt-6 flex justify-between items-center text-xs text-gray-500 font-bold">
                                            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> {member.tasks_completed} Done</span>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/tasks?member=${member.user_id}`);
                                              }}
                                              className="text-blue-600 hover:underline"
                                            >
                                              View All Tasks
                                            </button>
                                         </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <Target className="text-gray-300 mx-auto mb-4" size={40} />
                                    <p className="text-gray-500 font-bold">No active team members found in this view.</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Organizations;