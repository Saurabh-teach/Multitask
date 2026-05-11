import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  Target, Calendar, Users, AlignLeft, 
  ArrowLeft, Plus, ShieldCheck, Flag, CheckCircle2, Building,
  Eye, Lock, Shield, Search, X
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
    status: 'not_started',
    visibility_type: 'organization',
    visible_to: []
  });

  const [searchTerm, setSearchTerm] = useState('');

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
      
      const allMembers = res.data.members || [];
      const currentOrg = organizations.find(o => (o.organization_id || o.id) === orgId);
      const currentUserId = currentOrg?.user_id;

      setMembers(allMembers);

      // Auto-select current user as default owner if not already set
      if (!formData.owner && currentUserId) {
        setFormData(prev => ({ ...prev, owner: currentUserId }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVisibleTo = (userId) => {
    setFormData(prev => {
        const isSelected = prev.visible_to.includes(userId);
        if (isSelected) {
            return { ...prev, visible_to: prev.visible_to.filter(id => id !== userId) };
        } else {
            return { ...prev, visible_to: [...prev.visible_to, userId] };
        }
    });
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
      const payload = {
        ...formData,
        organization: selectedOrgId
      };
      
      const res = await axios.post(
        `http://127.0.0.1:8000/api/auth/organizations/${selectedOrgId}/goals/create/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreatedGoalId(res.data.goal.id);
      toast.success("Strategic goal established!");
    } catch (err) {
      console.error("Creation Error:", err.response?.data);
      let errorMsg = "Failed to establish goal";
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

  const currentOrgData = organizations.find(o => (o.organization_id || o.id) === selectedOrgId);
  const currentUserRole = currentOrgData?.role?.toLowerCase() || 'user';
  
  const filteredSearchMembers = members.filter(m => 
    (m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Establish Strategic Goal</h1>
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
                         <p className="text-indigo-100/80 text-lg font-medium max-w-md">Define a high-level goal that your team will rally behind. This goal will track multiple underlying tasks.</p>
                      </div>
                   </div>

                   <div className="p-12">
                      <form onSubmit={handleSubmit} className="space-y-8">

                         {/* Organization Selector */}
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
                              <Target size={14} /> Goal Title <span className="text-red-500">*</span>
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
                                  <option key={m.user_id} value={m.user_id}>{m.full_name || m.username} ({m.role})</option>
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

                         {/* VISIBILITY SECTION */}
                         <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                   <Shield size={14} className="text-indigo-600" /> Visibility & Access Control
                                </label>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${formData.visibility_type === 'organization' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {formData.visibility_type === 'organization' ? 'Public' : 'Private'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <button
                                 type="button"
                                 onClick={() => setFormData({...formData, visibility_type: 'organization'})}
                                 className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.visibility_type === 'organization' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white'}`}
                               >
                                  <div className="flex items-center gap-3 mb-1">
                                     <Building size={18} className={formData.visibility_type === 'organization' ? 'text-indigo-600' : 'text-gray-400'} />
                                     <span className={`font-bold text-sm ${formData.visibility_type === 'organization' ? 'text-indigo-900' : 'text-gray-500'}`}>Entire Organization</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-medium ml-7">Accessible to everyone in the workspace.</p>
                               </button>

                               <button
                                 type="button"
                                 onClick={() => setFormData({...formData, visibility_type: 'specific'})}
                                 className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.visibility_type === 'specific' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 bg-white'}`}
                               >
                                  <div className="flex items-center gap-3 mb-1">
                                     <Lock size={18} className={formData.visibility_type === 'specific' ? 'text-indigo-600' : 'text-gray-400'} />
                                     <span className={`font-bold text-sm ${formData.visibility_type === 'specific' ? 'text-indigo-900' : 'text-gray-500'}`}>Specific Selection</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-medium ml-7">Restricted to owners and chosen teammates.</p>
                               </button>
                            </div>

                            {formData.visibility_type === 'specific' && (
                               <div className="space-y-4 animate-slide-up">
                                  <div className="relative">
                                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                     <input
                                       type="text"
                                       placeholder="Search teammates by name or email..."
                                       className="input-premium py-3 pl-12 text-sm"
                                       value={searchTerm}
                                       onChange={(e) => setSearchTerm(e.target.value)}
                                       onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                     />
                                  </div>

                                  <div className="bg-gray-50 rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2 border border-gray-100">
                                     {filteredSearchMembers.map(m => {
                                        const selected = formData.visible_to.includes(m.user_id);
                                        return (
                                           <div 
                                             key={m.id}
                                             onClick={() => toggleVisibleTo(m.user_id)}
                                             className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selected ? 'bg-white shadow-sm border border-indigo-100' : 'hover:bg-gray-100'}`}
                                           >
                                              <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {m.full_name?.[0] || 'U'}
                                                 </div>
                                                 <div>
                                                    <p className="text-xs font-bold text-gray-900">{m.full_name || m.username}</p>
                                                    <p className="text-[10px] text-gray-400">{m.role}</p>
                                                 </div>
                                              </div>
                                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200'}`}>
                                                 {selected && <CheckCircle2 size={12} />}
                                              </div>
                                           </div>
                                        );
                                     })}
                                     {filteredSearchMembers.length === 0 && (
                                        <div className="text-center py-6 text-gray-400 text-xs font-medium">No teammates found matching your search.</div>
                                     )}
                                  </div>

                                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                     <Shield className="text-amber-600 shrink-0" size={18} />
                                     <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                        <strong>Admin Oversight Enabled:</strong> Organization Admins and Owners are automatically granted visibility to all initiatives for governance purposes.
                                     </p>
                                  </div>
                               </div>
                            )}
                         </div>

                         <div className="pt-10">
                            <button
                              type="submit"
                              disabled={loading || !selectedOrgId}
                              className="btn-primary w-full py-5 text-xl shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                            >
                              {loading ? "Establishing Goal..." : "Establish Goal"}
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
                   <h2 className="text-4xl font-bold text-gray-900 brand-font mb-4">Goal Successfully Created!</h2>
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
                          setFormData({ title: '', description: '', owner: '', due_date: '', priority: 'medium', status: 'not_started', visibility_type: 'organization', visible_to: [] });
                        }}
                        className="bg-indigo-50 text-indigo-700 font-bold py-4 px-10 rounded-2xl hover:bg-indigo-100 transition-all text-lg"
                      >
                         + Create Another Goal
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