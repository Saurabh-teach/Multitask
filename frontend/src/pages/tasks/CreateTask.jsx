import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  ListTodo, Calendar, Users, AlignLeft, 
  ArrowLeft, Plus, ShieldCheck, Flag, Layers,
  Eye, Lock, Shield, Search, X, CheckCircle2, Building, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const CreateTask = () => {
  const navigate = useNavigate();
  const { permissions } = React.useContext(AuthContext);
  const canAssign = permissions.includes('task_assign');
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlGoalId = queryParams.get('goalId');

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: 'task',
    goal: urlGoalId || '',
    assignees: [],
    due_date: '',
    priority: 'medium',
    status: 'todo',
    visibility_type: 'organization',
    visible_to: []
  });

  const [currentOrgId, setCurrentOrgId] = useState(localStorage.getItem('orgId') || null);

  useEffect(() => {
    fetchData();
    
    // Refresh if org changes
    const handleOrgChange = () => {
        const newOrgId = localStorage.getItem('orgId');
        setCurrentOrgId(newOrgId);
    };
    window.addEventListener('storage', handleOrgChange);
    return () => window.removeEventListener('storage', handleOrgChange);
  }, [currentOrgId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const activeOrgId = currentOrgId || localStorage.getItem('orgId');
      
      if (activeOrgId) {
        const [memRes, goalRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/auth/organizations/${activeOrgId}/members/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://127.0.0.1:8000/api/auth/organizations/${activeOrgId}/goals/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setMembers(memRes.data.members || []);
        setGoals(goalRes.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goal) return toast.error("Please select a parent goal");
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const activeOrgId = currentOrgId || localStorage.getItem('orgId');
      
      const payload = {
        ...formData,
        organization: activeOrgId
      };

      await axios.post(`http://127.0.0.1:8000/api/auth/goals/${formData.goal}/tasks/create/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Issue created on board!");
      navigate('/tasks');
    } catch (err) {
      toast.error("Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (userId, role) => {
    if (!canAssign) {
      toast.error("You do not have permission to assign tasks to others in this workspace.", { id: 'perm-denied' });
      return;
    }
    const current = [...formData.assignees];
    if (current.includes(userId)) {
      setFormData({...formData, assignees: current.filter(id => id !== userId)});
    } else {
      setFormData({...formData, assignees: [...current, userId]});
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
                onClick={() => navigate('/tasks')}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Create New Task</h1>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest">
               <Layers size={16} /> Goal Execution
            </div>
          </div>
        </nav>

        <div className="flex-1 p-10 animate-fade-in">
          <div className="max-w-3xl mx-auto">
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative">
                   <div className="absolute top-0 right-0 p-10 opacity-10">
                      <ListTodo size={160} />
                   </div>
                   <div className="relative z-10">
                      <h2 className="text-4xl font-bold brand-font mb-4">Define an actionable item</h2>
                      <p className="text-blue-100/80 text-lg font-medium max-w-md">Break down your strategic goals into specific, manageable tasks for your team.</p>
                   </div>
                </div>

                <div className="p-12">
                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <Layers size={14} /> Parent Strategic Goal <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                          {/* Trigger Button */}
                          <button
                            type="button"
                            onClick={() => setGoalDropdownOpen(prev => !prev)}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all text-left ${
                              formData.goal
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ formData.goal ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400' }`}>
                                <Layers size={15} />
                              </div>
                              <span className={`text-sm font-bold ${ formData.goal ? 'text-blue-900' : 'text-gray-400' }`}>
                                {formData.goal
                                  ? goals.find(g => g.id === formData.goal)?.title || 'Selected'
                                  : 'Select a goal...'}
                              </span>
                            </div>
                            {goalDropdownOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </button>

                          {/* Dropdown List */}
                          {goalDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                              {goals.length === 0 ? (
                                <div className="p-6 text-center">
                                  <p className="text-sm text-gray-400 font-medium">No goals yet. <a href="/goals/create" className="text-blue-600 font-bold">Create one →</a></p>
                                </div>
                              ) : (
                                <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                  {goals.map(g => {
                                    const isSelected = formData.goal === g.id;
                                    const statusColor = {
                                      completed: 'bg-green-100 text-green-700',
                                      in_progress: 'bg-blue-100 text-blue-700',
                                      on_hold: 'bg-amber-100 text-amber-700',
                                      not_started: 'bg-gray-100 text-gray-500',
                                    }[g.status] || 'bg-gray-100 text-gray-500';
                                    return (
                                      <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => {
                                          setFormData({...formData, goal: g.id});
                                          setGoalDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 transition-all text-left ${ isSelected ? 'bg-blue-50' : '' }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400' }`}>
                                            <Layers size={13} />
                                          </div>
                                          <div>
                                            <p className={`text-sm font-bold ${ isSelected ? 'text-blue-700' : 'text-gray-800' }`}>{g.title}</p>
                                            <p className="text-[10px] text-gray-400">{Math.round(g.progress || 0)}% complete</p>
                                          </div>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusColor}`}>
                                          {(g.status || 'active').replace('_', ' ')}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck size={14} /> Task Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                           {['task', 'story', 'bug'].map(type => (
                             <button
                               key={type}
                               type="button"
                               onClick={() => setFormData({...formData, issue_type: type})}
                               className={`py-3 rounded-xl border-2 text-[12px] font-bold uppercase tracking-widest transition-all ${formData.issue_type === type ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                             >
                                {type}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <ListTodo size={14} /> Task Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="input-premium py-4"
                          placeholder="e.g. Implement OAuth2 flow"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <AlignLeft size={14} /> Description & Requirements
                        </label>
                        <textarea
                          rows="6"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm text-gray-700 placeholder:text-gray-300 focus:border-blue-500 focus:outline-none resize-none transition-all bg-gray-50 focus:bg-white"
                          placeholder="Detail the technical requirements, acceptance criteria, and any relevant context..."
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <Users size={14} /> Assigned Contributors
                        </label>
                        <div className="flex flex-wrap gap-3">
                           {members.map(m => (
                             <button
                               key={m.user_id}
                               type="button"
                               onClick={() => toggleAssignee(m.user_id, m.role)}
                               className={`px-4 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all flex items-center gap-2 ${formData.assignees.includes(m.user_id) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                             >
                                {m.full_name}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-tighter ${m.role === 'owner' || m.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                                   {m.role}
                                </span>
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Calendar size={14} /> Target Completion Date
                           </label>
                           <input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                              className="input-premium py-4"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Flag size={14} /> Priority Level
                           </label>
                           <select 
                             className="input-premium py-4 appearance-none"
                             value={formData.priority}
                             onChange={(e) => setFormData({...formData, priority: e.target.value})}
                           >
                             <option value="low">Low</option>
                             <option value="medium">Medium</option>
                             <option value="high">High</option>
                             <option value="urgent">Urgent</option>
                           </select>
                        </div>
                      </div>

                      {/* VISIBILITY SECTION */}
                      <div className="space-y-6 pt-4 border-t border-gray-100">
                         <div className="flex items-center justify-between">
                             <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={14} className="text-blue-600" /> Visibility & Access Control
                             </label>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${formData.visibility_type === 'organization' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {formData.visibility_type === 'organization' ? 'Public' : 'Private'}
                             </span>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, visibility_type: 'organization'})}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.visibility_type === 'organization' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}
                            >
                               <div className="flex items-center gap-3 mb-1">
                                  <Building size={18} className={formData.visibility_type === 'organization' ? 'text-blue-600' : 'text-gray-400'} />
                                  <span className={`font-bold text-sm ${formData.visibility_type === 'organization' ? 'text-blue-900' : 'text-gray-500'}`}>Entire Organization</span>
                               </div>
                               <p className="text-[10px] text-gray-400 font-medium ml-7">Accessible to everyone in the workspace.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormData({...formData, visibility_type: 'specific'})}
                              className={`p-4 rounded-2xl border-2 text-left transition-all ${formData.visibility_type === 'specific' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`}
                            >
                               <div className="flex items-center gap-3 mb-1">
                                  <Lock size={18} className={formData.visibility_type === 'specific' ? 'text-blue-600' : 'text-gray-400'} />
                                  <span className={`font-bold text-sm ${formData.visibility_type === 'specific' ? 'text-blue-900' : 'text-gray-500'}`}>Specific Selection</span>
                               </div>
                               <p className="text-[10px] text-gray-400 font-medium ml-7">Restricted to assignees and chosen teammates.</p>
                            </button>
                         </div>

                         {formData.visibility_type === 'specific' && (
                            <div className="space-y-4 animate-slide-up">
                               <div className="relative">
                                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                  <input
                                    type="text"
                                    className="input-premium py-3 pl-12 text-sm"
                                    placeholder="Search teammates by name or email..."
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
                                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selected ? 'bg-white shadow-sm border border-blue-100' : 'hover:bg-gray-100'}`}
                                        >
                                           <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                 {m.full_name?.[0] || 'U'}
                                              </div>
                                              <div>
                                                 <p className="text-xs font-bold text-gray-900">{m.full_name || m.username}</p>
                                                 <p className="text-[10px] text-gray-400">{m.role}</p>
                                              </div>
                                           </div>
                                           <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'}`}>
                                              {selected && <CheckCircle2 size={12} />}
                                           </div>
                                        </div>
                                     );
                                  })}
                               </div>

                               <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                  <Shield className="text-amber-600 shrink-0" size={18} />
                                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                     <strong>Automatic Access:</strong> Admins, Owners, and all Task Assignees will have guaranteed visibility to this task.
                                  </p>
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="pt-10">
                         <button
                           type="submit"
                           disabled={loading}
                           className="btn-primary w-full py-5 text-xl shadow-xl shadow-blue-500/20"
                         >
                           {loading ? "Creating Task..." : "Create Task"}
                           {!loading && <Plus size={24} />}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;