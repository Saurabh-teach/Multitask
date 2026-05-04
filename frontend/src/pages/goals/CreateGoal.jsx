import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  Target, Calendar, Users, AlignLeft, 
  ArrowLeft, Plus, ShieldCheck, Flag, CheckCircle2, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateGoal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlOrgId = queryParams.get('orgId');

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(urlOrgId || '');
  const [createdGoalId, setCreatedGoalId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    due_date: '',
    priority: 'medium',
    status: 'not_started'
  });

  useEffect(() => {
    fetchOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrgId) fetchMembers(selectedOrgId);
  }, [selectedOrgId]);

  const fetchOrgs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgs = res.data.organizations || [];
      setOrganizations(orgs);
      if (!urlOrgId && orgs.length > 0) {
        setSelectedOrgId(orgs[0].organization_id || orgs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      toast.error("Please select an organization first.");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://127.0.0.1:8000/api/auth/organizations/${selectedOrgId}/goals/create/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreatedGoalId(res.data.goal.id);
      toast.success("Strategic epic established!");
    } catch (err) {
      console.error("Creation Error:", err.response?.data);
      let errorMsg = "Failed to establish epic";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) {
          errorMsg = data.error;
        } else if (typeof data === 'object') {
          const firstField = Object.keys(data)[0];
          const firstError = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
          errorMsg = `${firstField}: ${firstError}`;
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-y-auto">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/goals')}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Establish Strategic Epic</h1>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">
               <ShieldCheck size={16} /> Roadmap Alignment
            </div>
          </div>
        </nav>

        <div className="flex-1 p-10 animate-fade-in">
          <div className="max-w-3xl mx-auto">
             {!createdGoalId ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
                   <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white relative">
                      <div className="absolute top-0 right-0 p-10 opacity-10">
                         <Target size={160} />
                      </div>
                      <div className="relative z-10">
                         <h2 className="text-4xl font-bold brand-font mb-4">Set a new milestone</h2>
                         <p className="text-indigo-100/80 text-lg font-medium max-w-md">Define a high-level goal that your team will rally behind. This epic will track multiple underlying tasks.</p>
                      </div>
                   </div>

                   <div className="p-12">
                      <form onSubmit={handleSubmit} className="space-y-8">

                         {/* Organization Selector - shown when user owns multiple orgs */}
                         {organizations.length > 1 && (
                           <div className="space-y-2">
                             <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Building size={14} /> Workspace / Organization <span className="text-red-500">*</span>
                             </label>
                             <select
                               className="input-premium py-4 appearance-none"
                               value={selectedOrgId}
                               onChange={(e) => setSelectedOrgId(e.target.value)}
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
                         )}

                         <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Target size={14} /> Epic Title <span className="text-red-500">*</span>
                           </label>
                           <input
                             type="text"
                             required
                             value={formData.title}
                             onChange={(e) => setFormData({...formData, title: e.target.value})}
                             className="input-premium py-4"
                             placeholder="e.g. Q3 Market Expansion"
                           />
                         </div>

                         <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <AlignLeft size={14} /> Strategic Description
                           </label>
                           <textarea
                             rows="3"
                             value={formData.description}
                             onChange={(e) => setFormData({...formData, description: e.target.value})}
                             className="input-premium py-4"
                             placeholder="Outline the scope and desired outcome..."
                           />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                 <Users size={14} /> Assigned Owner
                              </label>
                              <select 
                                className="input-premium py-4 appearance-none"
                                value={formData.owner}
                                onChange={(e) => setFormData({...formData, owner: e.target.value})}
                              >
                                <option value="">Select an owner...</option>
                                {members.map(m => (
                                  <option key={m.user_id} value={m.user_id}>{m.full_name || m.username}</option>
                                ))}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                 <Calendar size={14} /> Target Due Date
                              </label>
                              <input
                                 type="date"
                                 value={formData.due_date}
                                 onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                 className="input-premium py-4"
                              />
                           </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                 <Flag size={14} /> Priority Level
                              </label>
                              <div className="flex gap-4">
                                 {['low', 'medium', 'high'].map(p => (
                                   <button
                                     key={p}
                                     type="button"
                                     onClick={() => setFormData({...formData, priority: p})}
                                     className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all ${formData.priority === p ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                                   >
                                     {p}
                                   </button>
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                 <ShieldCheck size={14} /> Initial Status
                              </label>
                              <select 
                                className="input-premium py-4 appearance-none"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="at_risk">At Risk</option>
                              </select>
                           </div>
                         </div>

                         <div className="pt-6">
                            <button
                              type="submit"
                              disabled={loading || !selectedOrgId}
                              className="btn-primary w-full py-5 text-xl shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                            >
                              {loading ? "Establishing Epic..." : "Establish Epic"}
                              {!loading && <Plus size={24} />}
                            </button>
                         </div>
                      </form>
                   </div>
                </div>
             ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-emerald-100 overflow-hidden text-center p-20">
                   <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 size={56} />
                   </div>
                   <h2 className="text-4xl font-bold text-gray-900 brand-font mb-4">Epic Successfully Created!</h2>
                   <p className="text-gray-500 text-lg font-medium mb-12 max-w-md mx-auto">Your strategic milestone "{formData.title}" is now active. What would you like to do next?</p>
                   
                   <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={() => navigate(`/tasks/create?goalId=${createdGoalId}`)}
                        className="btn-primary py-4 px-10 text-lg shadow-xl shadow-blue-500/20 flex items-center gap-3"
                      >
                         <Plus size={24} /> Create First Task
                      </button>
                      <button 
                        onClick={() => {
                          setCreatedGoalId(null);
                          setFormData({ title: '', description: '', owner: '', due_date: '', priority: 'medium', status: 'not_started' });
                        }}
                        className="bg-indigo-50 text-indigo-700 font-bold py-4 px-10 rounded-2xl hover:bg-indigo-100 transition-all text-lg"
                      >
                         + Create Another Epic
                      </button>
                      <button 
                        onClick={() => navigate('/goals')}
                        className="bg-gray-100 text-gray-700 font-bold py-4 px-10 rounded-2xl hover:bg-gray-200 transition-all text-lg"
                      >
                         Go to Roadmap
                      </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGoal;