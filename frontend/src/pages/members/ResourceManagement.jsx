import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { 
  Users, Search, UserPlus, Mail, Briefcase, 
  Shield, CheckCircle2, XCircle, MoreVertical,
  Activity, ArrowUpRight, Building, Layout, AlertCircle,
  Plus, Calendar, Layers, Flag, Briefcase as TalentIcon,
  XCircle as XIcon
} from 'lucide-react';

const ResourceManagement = () => {
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'talent'
  const [members, setMembers] = useState([]);
  const [talent, setTalent] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrgId, setCurrentOrgId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('member');
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalGoals, setModalGoals] = useState([]);
  const [modalTasks, setModalTasks] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    organization_id: '',
    goal_id: '',
    task_id: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const myOrgs = orgRes.data.organizations || [];
      setOrganizations(myOrgs);
      
      const orgId = myOrgs?.[0]?.organization_id || myOrgs?.[0]?.id;
      if (orgId) {
        setCurrentOrgId(orgId);
        setUserRole(myOrgs[0].role || 'member');
        setAssignmentData(prev => ({ ...prev, organization_id: orgId }));
        fetchTeamMembers(orgId);
      }
      
      fetchTalentPool();
    } catch (err) {
      toast.error("Failed to sync workforce data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers(res.data.members || []);
      setOrganizationName(res.data.organization_name || 'Organization');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTalentPool = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/auth/talent-pool/');
      setTalent(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGoalsForOrg = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/goals/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalGoals(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasksForOrg = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalTasks(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
    if (assignmentData.organization_id) {
      fetchGoalsForOrg(assignmentData.organization_id);
      fetchTasksForOrg(assignmentData.organization_id);
    }
  };

  const handleOrgChange = (orgId) => {
    setAssignmentData({ ...assignmentData, organization_id: orgId, goal_id: '', task_id: '' });
    if (orgId) {
      fetchGoalsForOrg(orgId);
      fetchTasksForOrg(orgId);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignmentData.organization_id) return toast.error("Select an organization");
    
    setAssignLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/auth/quick-assign-task/', {
        user_id: selectedUser.user_id || selectedUser.id,
        ...assignmentData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Allocated ${selectedUser.username} to new workload`);
      setShowAssignModal(false);
      fetchInitialData(); // Refresh all
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to allocate resource");
    } finally {
      setAssignLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      owner: { color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Shield size={12} /> },
      admin: { color: 'bg-red-50 text-red-700 border-red-100', icon: <Shield size={12} /> },
      manager: { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Activity size={12} /> },
      member: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: <Users size={12} /> },
    };
    const style = roles[role?.toLowerCase()] || roles.member;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${style.color}`}>
        {style.icon}
        {role}
      </span>
    );
  };

  const filteredTeam = members.filter(m => 
    (m.full_name || m.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTalent = talent.filter(m => 
    (m.full_name || m.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <nav className="bg-white border-b border-gray-200 shrink-0">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                 <Users size={24} />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Workforce Allocation</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    Manage Team Capacity & Performance
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Find resources..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-[14px] w-80 focus:bg-white focus:border-blue-500 transition-all outline-none"
                />
              </div>
              {['owner', 'admin', 'manager'].includes(userRole?.toLowerCase()) && (
                <button 
                  onClick={() => navigate('/members/invite')}
                  className="btn-primary py-2.5 px-6 text-sm"
                >
                  <UserPlus size={18} /> Invite Talent
                </button>
              )}
            </div>
          </div>

          {/* Single View Info */}
          <div className="px-10 py-2">
             <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Active Organization Members ({members.length})
             </span>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 animate-fade-in">
           {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
           ) : (
             <div className="card-premium p-0 overflow-hidden border-none shadow-xl">
               <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                       <th className="py-5 px-10">Resource</th>
                       <th className="py-5 px-6">{activeTab === 'team' ? 'Current Load' : 'Specialization'}</th>
                       <th className="py-5 px-6">{activeTab === 'team' ? 'Active Projects' : 'Availability'}</th>
                       <th className="py-5 px-10 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTeam.map((person) => (
                      <tr key={person.member_id || person.id} className="group hover:bg-blue-50/20 transition-all">
                        <td className="py-6 px-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-500 group-hover:to-indigo-600 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-white font-bold text-xl shadow-inner transition-all">
                                {person.username?.[0]?.toUpperCase()}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-900 text-[15px]">{person.full_name || person.username}</p>
                                  {getRoleBadge(person.role)}
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium">{person.email}</p>
                             </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                           {activeTab === 'team' ? (
                             <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                   <span>Utilization</span>
                                   <span className="text-blue-600">{person.completion_rate}</span>
                                </div>
                                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500" style={{ width: person.completion_rate }} />
                                </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-[12px] font-bold text-gray-600 uppercase tracking-wide">
                                <Briefcase size={14} className="text-gray-400" />
                                {person.job_title || 'Expert Professional'}
                             </div>
                           )}
                        </td>
                        <td className="py-6 px-6">
                           {activeTab === 'team' ? (
                             <div className="flex flex-wrap gap-2">
                                {person.active_tasks?.length > 0 ? (
                                  person.active_tasks.map((task, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 truncate max-w-[120px]">
                                      {task}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                    <AlertCircle size={12} /> Bench / No Work
                                  </span>
                                )}
                             </div>
                           ) : (
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                <CheckCircle2 size={12} /> Ready to Assign
                             </span>
                           )}
                        </td>
                        <td className="py-6 px-10 text-right">
                           {['owner', 'admin', 'manager'].includes(userRole?.toLowerCase()) && (
                             <button 
                               onClick={() => handleOpenAssignModal(person)}
                               className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-2 ml-auto shadow-sm"
                             >
                                <Plus size={14} /> Assign Work
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
           )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white relative">
                 <button 
                   onClick={() => setShowAssignModal(false)}
                   className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all"
                 >
                   <XIcon size={24} />
                 </button>
                 <h2 className="text-3xl font-bold brand-font mb-2">Resource Allocation</h2>
                 <p className="text-blue-100/80 text-sm font-medium">Assign work to <b>{selectedUser?.full_name || selectedUser?.username}</b></p>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Building size={14} /> Select Organization
                    </label>
                    <select 
                      className="input-premium py-3.5"
                      value={assignmentData.organization_id}
                      onChange={(e) => handleOrgChange(e.target.value)}
                      required
                    >
                       <option value="">Select an organization...</option>
                       {organizations.map(org => (
                         <option key={org.organization_id || org.id} value={org.organization_id || org.id}>
                           {org.organization_name || org.name}
                         </option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Layers size={14} /> Select Strategic Epic (Goal)
                    </label>
                    <select 
                      className="input-premium py-3.5"
                      value={assignmentData.goal_id}
                      onChange={(e) => setAssignmentData({...assignmentData, goal_id: e.target.value})}
                    >
                       <option value="">Any Epic / General</option>
                       {modalGoals.map(g => (
                         <option key={g.id} value={g.id}>{g.title}</option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Layout size={14} /> Select Specific Task
                    </label>
                    <select 
                      className="input-premium py-3.5"
                      value={assignmentData.task_id}
                      onChange={(e) => setAssignmentData({...assignmentData, task_id: e.target.value})}
                    >
                       <option value="">Select a task...</option>
                       {modalTasks
                         .filter(t => !assignmentData.goal_id || t.goal === assignmentData.goal_id)
                         .map(t => (
                         <option key={t.id} value={t.id}>{t.title}</option>
                       ))}
                    </select>
                 </div>

                 <div className="pt-6">
                    <button 
                      type="submit"
                      disabled={assignLoading}
                      className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3"
                    >
                       {assignLoading ? "Processing..." : "Confirm Allocation"}
                       <ArrowUpRight size={20} />
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;
