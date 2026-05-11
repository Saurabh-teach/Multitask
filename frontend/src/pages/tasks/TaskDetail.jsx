import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  ArrowLeft, ListTodo, Calendar, User, 
  Flag, Clock, CheckCircle2, MessageSquare,
  Edit3, X, Save, Shield, Lock, Building, Search,
  Send, Layers, AlignLeft, Hash, UserCheck, UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchTaskDetail();
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/auth/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);
      setEditFormData(res.data);

      const commentRes = await axios.get(`http://127.0.0.1:8000/api/auth/tasks/${id}/comments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(commentRes.data.comments || []);
      
      if (res.data.organization) {
        fetchMembers(res.data.organization);
      }
    } catch (err) {
      toast.error("Failed to load task details");
      navigate('/tasks');
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

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://127.0.0.1:8000/api/auth/tasks/${id}/`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task updated successfully!");
      setIsEditing(false);
      fetchTaskDetail();
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/auth/tasks/${id}/comments/create/`, {
        comment: newComment
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setNewComment('');
      fetchTaskDetail();
    } catch (err) {
      toast.error("Failed to add comment");
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
          <p className="text-gray-500 font-bold">Retrieving task context...</p>
       </div>
    </div>
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
              <div>
                 <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">{task.title}</h1>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ListTodo size={10} /> Task Execution Logic
                 </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsEditing(true)}
                 className="flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-all text-sm border border-blue-100"
               >
                 <Edit3 size={18} /> Edit Task
               </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-10 animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Task Core */}
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                       <ListTodo size={140} />
                    </div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/20 bg-white/10`}>
                             {task.status.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-100">
                             <Flag size={14} /> {task.priority} Priority
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-200 bg-white/5 px-3 py-1 rounded-full">
                             {task.visibility_type === 'organization' ? <Building size={12} /> : <Lock size={12} />}
                             {task.visibility_type === 'organization' ? 'Public' : 'Private'}
                          </div>
                       </div>
                       <h2 className="text-4xl font-bold brand-font mb-6 leading-tight">{task.title}</h2>
                       <p className="text-blue-100/80 text-lg font-medium leading-relaxed">
                          {task.description || "No detailed description provided for this task."}
                       </p>
                    </div>
                 </div>

                 <div className="p-10 bg-gray-50/50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignees</p>
                       <div className="flex -space-x-2">
                          {task.assignee_details?.map((a, i) => (
                             <div key={i} title={a.name} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                {a.name[0]}
                             </div>
                          ))}
                          {(!task.assignee_details || task.assignee_details.length === 0) && <span className="text-xs text-gray-400 font-bold italic">Unassigned</span>}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Date</p>
                       <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                          <Calendar size={14} className="text-gray-400" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'None'}
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimate</p>
                       <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                          <Clock size={14} className="text-gray-400" />
                          {task.estimated_hours || 0} Hours
                       </div>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created By</p>
                       <p className="text-xs font-bold text-gray-600 uppercase tracking-tighter">Strategic Lead</p>
                    </div>
                 </div>

                 {/* Comments Section */}
                 <div className="p-10 space-y-8">
                    <div className="flex items-center gap-3">
                       <MessageSquare className="text-blue-600" size={24} />
                       <h3 className="text-xl font-bold text-gray-900 brand-font">Communication Thread</h3>
                       <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{comments.length}</span>
                    </div>

                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                       {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4 group animate-fade-in">
                             <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0">
                                {comment.user_name?.[0] || 'U'}
                             </div>
                             <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-1">
                                   <p className="font-bold text-gray-900 text-sm">{comment.user_name}</p>
                                   <p className="text-[10px] text-gray-400 font-medium">{new Date(comment.created_at).toLocaleString()}</p>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">{comment.comment}</p>
                             </div>
                          </div>
                       ))}
                       {comments.length === 0 && (
                          <div className="text-center py-10">
                             <p className="text-gray-400 italic text-sm font-medium">No updates shared yet. Be the first to comment.</p>
                          </div>
                       )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                       <div className="flex-1 relative">
                          <input
                             type="text"
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             placeholder="Collaborate on this task..."
                             className="input-premium py-4 pl-6 pr-12 text-sm"
                             onKeyPress={(e) => e.key === 'Enter' && addComment()}
                          />
                          <button onClick={addComment} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 hover:scale-110 transition-transform">
                             <Send size={20} />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Sidebar Actions */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Parent Initiative</h4>
                 <div className="p-5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 flex gap-4 items-center">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                       <Layers size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Roadmap Alignment</p>
                       <p className="font-bold text-gray-900 text-sm">{task.goal_title || 'Strategic Roadmap'}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
                 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Contributors</h4>
                 <div className="space-y-4">
                    {task.assignee_details?.map((a, i) => (
                       <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                             {a.name[0]}
                          </div>
                          <span className="text-xs font-bold text-gray-700">{a.name}</span>
                       </div>
                    ))}
                    {(!task.assignee_details || task.assignee_details.length === 0) && (
                       <p className="text-xs text-gray-400 italic">No team members assigned</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-xl">
                      <Edit3 size={24} />
                   </div>
                   <h2 className="text-2xl font-bold brand-font">Refine Execution Logic</h2>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                   <X size={24} />
                </button>
             </div>

             <form onSubmit={handleUpdateTask} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ListTodo size={14} /> Task Title
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
                          <option value="urgent">Urgent</option>
                       </select>
                    </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <AlignLeft size={14} /> Task Description
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
                         <Clock size={14} /> Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={editFormData.estimated_hours}
                        onChange={(e) => setEditFormData({...editFormData, estimated_hours: e.target.value})}
                        className="input-premium py-4"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Hash size={14} /> Execution Status
                      </label>
                      <select 
                        className="input-premium py-4 appearance-none"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      >
                         <option value="todo">To Do</option>
                         <option value="in_progress">In Progress</option>
                         <option value="in_review">In Review</option>
                         <option value="done">Done</option>
                      </select>
                   </div>
                </div>

                {/* VISIBILITY SECTION */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                   <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Shield size={14} className="text-blue-600" /> Visibility Control
                      </label>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter">
                         {editFormData.visibility_type === 'organization' ? 'Public' : 'Private'}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setEditFormData({...editFormData, visibility_type: 'organization'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editFormData.visibility_type === 'organization' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
                      >
                         <Building size={18} className={`mb-2 ${editFormData.visibility_type === 'organization' ? 'text-blue-600' : 'text-gray-400'}`} />
                         <p className="font-bold text-xs text-gray-900">Entire Organization</p>
                         <p className="text-[9px] text-gray-400 mt-1">Everyone in the workspace can view this task.</p>
                         {editFormData.visibility_type === 'organization' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full shadow-lg shadow-blue-200 animate-pulse" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditFormData({...editFormData, visibility_type: 'specific'})}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${editFormData.visibility_type === 'specific' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
                      >
                         <Lock size={18} className={`mb-2 ${editFormData.visibility_type === 'specific' ? 'text-blue-600' : 'text-gray-400'}`} />
                         <p className="font-bold text-xs text-gray-900">Specific Selection</p>
                         <p className="text-[9px] text-gray-400 mt-1">Only teammates you select can view this task.</p>
                         {editFormData.visibility_type === 'specific' && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full shadow-lg shadow-blue-200 animate-pulse" />}
                      </button>
                   </div>

                   {editFormData.visibility_type === 'specific' && (
                      <div className="space-y-4 animate-fade-in bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                         
                         {/* SELECTED TEAMMATE CHIPS */}
                         {(editFormData.visible_to || []).length > 0 && (
                            <div className="space-y-2">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <UserCheck size={12} className="text-green-500" /> Granted Access
                               </p>
                               <div className="flex flex-wrap gap-2">
                                  {editFormData.visible_to.map(userId => {
                                     const member = members.find(m => m.user_id === userId);
                                     return (
                                        <div key={userId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm animate-slide-up">
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
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                            <input 
                              type="text" 
                              placeholder="Search teammates by name or email..." 
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
                                   className={`flex justify-between items-center p-4 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
                      Cancel
                   </button>
                   <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
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

export default TaskDetail;