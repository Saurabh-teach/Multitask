import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  ArrowLeft, Target, Calendar, User, 
  Flag, Clock, CheckCircle2, Plus, 
  MoreVertical, Activity, Layers, MessageSquare,
  Edit3, X, Save, Shield, Lock, Building, Search, AlignLeft,
  UserCheck, UserPlus, Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GoalDetail = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchGoalDetails();
  }, [goalId]);

  const fetchGoalDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/goals/${goalId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoal(res.data);
      setEditFormData(res.data);
      
      if (res.data.organization) {
        fetchMembers(res.data.organization);
      }
    } catch (err) {
      console.error('Goal detail error:', err);
      if (err.response?.status === 404 || err.response?.status === 400) {
          localStorage.removeItem('orgId');
          toast.error("Invalid Workspace Context. Re-syncing...");
          navigate('/dashboard');
      } else {
          toast.error("Failed to load goal details");
          navigate('/goals');
      }
    } finally {
      setLoading(false);
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
        console.error('Member fetch error:', err); 
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://127.0.0.1:8000/api/auth/goals/${goalId}/`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Strategic Goal Updated!");
      setIsEditing(false);
      fetchGoalDetails();
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: { label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-100' },
      at_risk: { label: 'At Risk', color: 'bg-red-50 text-red-700 border-red-100' },
      completed: { label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    };
    const style = badges[status] || badges.not_started;
    return (
      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border ${style.color}`}>
        {style.label}
      </span>
    );
  };

  const handleToggleAssignee = async (taskId, userId, role) => {
    try {
      const token = localStorage.getItem('token');
      const task = goal.tasks.find(t => t.id === taskId);
      const currentAssignees = task.assignees || [];
      const isAssigned = currentAssignees.includes(userId);
      
      let newAssignees;
      if (isAssigned) {
        newAssignees = currentAssignees.filter(id => id !== userId);
      } else {
        newAssignees = [...currentAssignees, userId];
      }

      await axios.patch(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/update-status/`, 
        { assignees: newAssignees },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(isAssigned ? "Member removed" : "Member assigned");
      fetchGoalDetails();
    } catch (err) {
      toast.error("Failed to update assignees");
    }
  };

  const toggleVisibleTo = (userId) => {
    setEditFormData(prev => {
        const isSelected = (prev.visible_to || []).includes(userId);
        if (isSelected) {
            return { ...prev, visible_to: prev.visible_to.filter(id => id !== userId) };
        } else {
            return { ...prev, visible_to: [...(prev.visible_to || []), userId] };
        }
    });
  };

  if (loading) return (
    <div className="flex h-screen bg-[#f8fafc]">
       <Sidebar />
       <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">Unpacking goal details...</p>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-y-auto">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/goals')}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                 <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Goal Roadmap</h1>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Layers size={10} /> Strategic Objective Tracking
                 </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => navigate(`/tasks/create?goalId=${goalId}`)}
                 className="btn-primary py-2.5 px-6 text-sm"
               >
                 <Plus size={18} /> Add Task to Goal
               </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-10 animate-fade-in space-y-10">
           {/* Header Card */}
           <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Target size={160} />
                 </div>
                 
                 {/* Action Overlay */}
                 <div className="absolute top-8 right-8 z-20">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-xs border border-white/20 backdrop-blur-sm"
                    >
                      <Edit3 size={14} /> Edit Goal
                    </button>
                 </div>

                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                       {getStatusBadge(goal.status)}
                       <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-100">
                          <Flag size={14} /> {goal.priority} Priority
                       </div>
                       <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-200 bg-white/10 px-3 py-1 rounded-full">
                          {goal.visibility_type === 'organization' ? <Building size={12} /> : <Lock size={12} />}
                          {goal.visibility_type === 'organization' ? 'Organization Wide' : 'Private Goal'}
                       </div>
                    </div>
                    <h2 className="text-5xl font-bold brand-font mb-6 leading-tight max-w-2xl">{goal.title}</h2>
                    <p className="text-indigo-100/80 text-xl font-medium max-w-2xl leading-relaxed">
                       {goal.description || "Strategic goal focused on high-impact organizational growth and development."}
                    </p>
                 </div>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8 bg-gray-50/50">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal Owner</p>
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                          {goal.owner_name?.[0] || 'U'}
                       </div>
                       <span className="font-bold text-gray-900">{goal.owner_name || 'Unassigned'}</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Deadline</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                       <Calendar size={16} className="text-gray-400" />
                       {goal.due_date ? new Date(goal.due_date).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'}) : 'No date set'}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks Overview</p>
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                       <Activity size={16} className="text-gray-400" />
                       {goal.tasks?.length || 0} Total Actions
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Goal Velocity</p>
                       <span className="text-xl font-bold text-indigo-600">{Math.round(goal.progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 shadow-lg" 
                         style={{ width: `${goal.progress}%` }}
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Tasks List Section */}
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-bold text-gray-900 brand-font flex items-center gap-3">
                    <Layers size={24} className="text-blue-600" />
                    Actionable Tasks
                 </h3>
                 <div className="text-sm font-bold text-gray-400 bg-white px-4 py-2 rounded-xl border border-gray-100">
                    Showing {goal.tasks?.length || 0} Tasks
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {goal.tasks?.length > 0 ? goal.tasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between group"
                    >
                       <div className="flex items-center gap-6">
                          <div className={`p-3 rounded-2xl ${task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'} group-hover:scale-110 transition-transform`}>
                             {task.status === 'done' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{task.title}</h4>
                             <div className="flex items-center gap-4 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                    task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 
                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                   {task.status.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${task.priority === 'urgent' ? 'text-red-500 font-black' : 'text-gray-400'}`}>
                                   {task.priority} priority
                                </span>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-12">
                          <div className="hidden md:flex flex-col items-end">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Manage Contributors</p>
                             <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
                                {members.map(member => {
                                   const isAssigned = task.assignees?.includes(member.user_id || member.id);
                                   return (
                                       <button
                                          key={member.user_id || member.id}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             handleToggleAssignee(task.id, member.user_id || member.id, member.role);
                                          }}
                                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                                             isAssigned 
                                                ? 'bg-blue-600 border-blue-700 text-white ring-2 ring-blue-100' 
                                                : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                                          }`}
                                       >
                                          {isAssigned && <CheckCircle2 size={10} className="text-white" />}
                                          {member.full_name || member.username}
                                          <span className={`text-[7px] px-1 py-0.5 rounded uppercase ${
                                             isAssigned ? 'bg-blue-500 text-blue-100' : 
                                             (member.role === 'owner' || member.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400')
                                          }`}>
                                             {member.role}
                                          </span>
                                       </button>
                                   );
                                })}
                             </div>
                          </div>

                          <div className="text-right min-w-[100px]">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                             <p className="text-sm font-bold text-gray-700">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '--'}</p>
                          </div>
                          
                          <button className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                             <MoreVertical size={20} />
                          </button>
                       </div>
                    </div>
                 )) : (
                    <div className="bg-white py-20 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-center space-y-6">
                       <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <Layers size={40} />
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-gray-900 brand-font">No tasks linked to this goal</h4>
                          <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">Break down this strategic objective into actionable tasks for your team.</p>
                       </div>
                       <button onClick={() => navigate(`/tasks/create?goalId=${goalId}`)} className="btn-primary py-3 px-10">Add Your First Task</button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Edit Goal Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up">
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-xl">
                      <Edit3 size={24} />
                   </div>
                   <h2 className="text-2xl font-bold brand-font">Edit Strategic Goal</h2>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                   <X size={24} />
                </button>
             </div>

             <form onSubmit={handleUpdateGoal} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Target size={14} /> Goal Title
                       </label>
                       <input
                         type="text"
                         value={editFormData.title}
                         onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                         className="input-premium py-4"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Flag size={14} /> Priority
                       </label>
                       <select 
                         className="input-premium py-4 appearance-none"
                         value={editFormData.priority}
                         onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                       >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                       </select>
                    </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <AlignLeft size={14} /> Strategic Description
                   </label>
                   <textarea
                     rows="3"
                     value={editFormData.description}
                     onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                     className="input-premium py-4"
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Hash size={14} /> Current Status
                      </label>
                      <select 
                         className="input-premium py-4 appearance-none"
                         value={editFormData.status}
                         onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      >
                         <option value="not_started">To Do</option>
                         <option value="in_progress">In Progress</option>
                         <option value="at_risk">At Risk</option>
                         <option value="completed">Completed</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Calendar size={14} /> Due Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.due_date}
                        onChange={(e) => setEditFormData({...editFormData, due_date: e.target.value})}
                        className="input-premium py-4"
                      />
                   </div>
                </div>

                {/* VISIBILITY SECTION IN EDIT */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                   <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Shield size={14} className="text-indigo-600" /> Visibility Control
                      </label>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-tighter">
                         {editFormData.visibility_type === 'organization' ? 'Public Mode' : 'Restricted Mode'}
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setEditFormData({...editFormData, visibility_type: 'organization'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editFormData.visibility_type === 'organization' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-200'}`}
                      >
                         <Building size={18} className={`mb-2 ${editFormData.visibility_type === 'organization' ? 'text-indigo-600' : 'text-gray-400'}`} />
                         <p className="font-bold text-xs text-gray-900">Organization Wide</p>
                         <p className="text-[9px] text-gray-400 mt-1">Everyone in Deccan Digital can see this goal.</p>
                         {editFormData.visibility_type === 'organization' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 animate-pulse" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({...editFormData, visibility_type: 'specific'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editFormData.visibility_type === 'specific' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-indigo-200'}`}
                      >
                         <Lock size={18} className={`mb-2 ${editFormData.visibility_type === 'specific' ? 'text-indigo-600' : 'text-gray-400'}`} />
                         <p className="font-bold text-xs text-gray-900">Private Selection</p>
                         <p className="text-[9px] text-gray-400 mt-1">Only selected teammates can see this goal.</p>
                         {editFormData.visibility_type === 'specific' && <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200 animate-pulse" />}
                      </button>
                   </div>

                   {editFormData.visibility_type === 'specific' && (
                      <div className="space-y-4 animate-fade-in bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                         
                         {/* SELECTED TEAMMATE CHIPS - THE STRONG DYNAMICS */}
                         {(editFormData.visible_to || []).length > 0 && (
                            <div className="space-y-2">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <UserCheck size={12} className="text-green-500" /> Granted Access
                               </p>
                               <div className="flex flex-wrap gap-2">
                                  {editFormData.visible_to.map(userId => {
                                     const member = members.find(m => m.user_id === userId);
                                     return (
                                        <div key={userId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm animate-slide-up">
                                           <span className="text-xs font-bold text-gray-700">{member?.full_name || 'User'}</span>
                                           <button 
                                             type="button"
                                             onClick={() => toggleVisibleTo(userId)}
                                             className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-md transition-colors"
                                           >
                                              <X size={12} />
                                           </button>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         )}

                         <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input 
                              type="text" 
                              placeholder="Find teammates to grant access..." 
                              className="input-premium py-4 pl-12 pr-24 text-sm bg-white" 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                               {members.length} Total Teammates
                            </div>
                         </div>

                         <div className="bg-white rounded-2xl border border-gray-100 max-h-48 overflow-y-auto divide-y divide-gray-50 shadow-inner">
                            {members.filter(m => {
                               const term = searchTerm.toLowerCase().trim();
                               return (
                                 m.full_name?.toLowerCase().includes(term) || 
                                 m.username?.toLowerCase().includes(term) ||
                                 m.email?.toLowerCase().includes(term)
                               );
                            }).map(m => {
                               const isSelected = (editFormData.visible_to || []).includes(m.user_id);
                               return (
                                 <div 
                                   key={m.user_id} 
                                   onClick={() => toggleVisibleTo(m.user_id)}
                                   className={`flex justify-between items-center p-4 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                          {m.full_name?.[0] || m.username?.[0]}
                                       </div>
                                       <div>
                                          <p className="text-xs font-bold text-gray-900">{m.full_name || m.username}</p>
                                          <p className="text-[9px] text-gray-400 font-medium">{m.role.toUpperCase()}</p>
                                       </div>
                                    </div>
                                    {isSelected ? (
                                       <div className="p-1 bg-green-500 text-white rounded-full">
                                          <CheckCircle2 size={12} />
                                       </div>
                                    ) : (
                                       <div className="p-1 text-gray-300">
                                          <UserPlus size={16} />
                                       </div>
                                    )}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                   )}
                </div>

                <div className="pt-6 flex gap-4">
                   <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">
                      Discard
                   </button>
                   <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                      <Save size={20} /> Save Changes
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDetail;