import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { 
  Users, Search, UserPlus, Mail, Briefcase, 
  MapPin, CheckCircle2, Plus, ArrowUpRight,
  Building, Layers, Layout, XCircle as XIcon
} from 'lucide-react';

const TalentPool = () => {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
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
      setOrganizations(orgRes.data.organizations || []);
      
      const res = await axios.get('http://127.0.0.1:8000/api/auth/talent-pool/');
      setTalent(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch talent pool");
    } finally {
      setLoading(false);
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
        user_id: selectedUser.id,
        ...assignmentData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Hired & Assigned ${selectedUser.username} successfully!`);
      setShowAssignModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to hire talent");
    } finally {
      setAssignLoading(false);
    }
  };

  const filteredTalent = talent.filter(m => 
    (m.full_name || m.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <nav className="bg-white border-b border-gray-200 shrink-0">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                 <Users size={24} />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Global Talent Pool</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    Discover & Hire Top Professionals
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by skill or name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-[14px] w-80 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                />
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-100">
                {talent.length} Pros Available
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTalent.map(person => (
                <div key={person.id} className="card-premium p-8 hover:scale-[1.02] transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Available Now</span>
                  </div>
                  
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-[2rem] flex items-center justify-center text-gray-500 font-bold text-2xl group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white transition-all shadow-inner">
                      {person.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{person.full_name || person.username}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mt-1">
                        <Briefcase size={14} /> {person.job_title || 'Expert Professional'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-500 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Mail size={16} className="text-emerald-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <MapPin size={16} className="text-emerald-500" />
                      <span>Remote / Worldwide</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleOpenAssignModal(person)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-xl shadow-gray-900/10"
                  >
                    Hire & Assign Work <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white relative">
                 <button 
                   onClick={() => setShowAssignModal(false)}
                   className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-all"
                 >
                   <XIcon size={24} />
                 </button>
                 <h2 className="text-3xl font-bold brand-font mb-2">Hire Resource</h2>
                 <p className="text-emerald-100/80 text-sm font-medium">Add <b>{selectedUser?.full_name || selectedUser?.username}</b> to your workspace</p>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Building size={14} /> Organization Context
                    </label>
                    <select 
                      className="input-premium py-3.5"
                      value={assignmentData.organization_id}
                      onChange={(e) => handleOrgChange(e.target.value)}
                      required
                    >
                       <option value="">Select your organization...</option>
                       {organizations.map(org => (
                         <option key={org.organization_id || org.id} value={org.organization_id || org.id}>
                           {org.organization_name || org.name}
                         </option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Layers size={14} /> Strategic Epic
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
                       <Layout size={14} /> Initial Task
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
                      className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3"
                    >
                       {assignLoading ? "Processing..." : "Confirm Hire & Assign"}
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

export default TalentPool;
