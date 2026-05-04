import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, MoreVertical, 
  Clock, CheckCircle2, AlertCircle, Trash2, 
  ChevronDown, MessageSquare, User, Calendar, 
  Flag, X, Send, Activity
} from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterMemberId = queryParams.get('member');

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'in_review', title: 'In Review', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { id: 'testing', title: 'Testing', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center text-[10px] text-white font-bold">B</div>;
      case 'story': return <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center text-[10px] text-white font-bold">S</div>;
      default: return <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-[10px] text-white font-bold">T</div>;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterMemberId]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const orgId = orgRes.data.organizations?.[0]?.organization_id || orgRes.data.organizations?.[0]?.id;
      if (orgId) {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/auth/organizations/${orgId}/tasks/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        let allTasks = res.data || [];
        if (filterMemberId) {
            allTasks = allTasks.filter(t => t.assignees.includes(filterMemberId));
        }
        setTasks(allTasks);
      }
    } catch (err) {
      toast.error("Failed to sync board");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/update-status/`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
      fetchTasks();
      if (selectedTask?.id === taskId) {
          fetchTaskDetails(taskId);
      }
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task forever?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Task deleted");
      setIsDrawerOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const fetchTaskDetails = async (taskId) => {
      try {
          const token = localStorage.getItem('token');
          const [taskRes, commentRes] = await Promise.all([
              axios.get(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/details/`, {
                  headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/comments/`, {
                  headers: { Authorization: `Bearer ${token}` }
              })
          ]);
          setSelectedTask(taskRes.data);
          setComments(commentRes.data.comments || []);
      } catch (err) {
          toast.error("Failed to load details");
      }
  };

  const openTaskDrawer = (task) => {
      setSelectedTask(task);
      setComments([]);
      setIsDrawerOpen(true);
      fetchTaskDetails(task.id);
  };

  const handleAddComment = async (e) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      setSubmittingComment(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post(`http://127.0.0.1:8000/api/auth/tasks/${selectedTask.id}/comments/create/`, 
              { comment: newComment },
              { headers: { Authorization: `Bearer ${token}` } }
          );
          setNewComment('');
          fetchTaskDetails(selectedTask.id);
      } catch (err) {
          toast.error("Failed to post comment");
      } finally {
          setSubmittingComment(false);
      }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-100';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Modern Top Navbar */}
        <nav className="bg-white border-b border-gray-200 shrink-0">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                 <Activity size={24} />
               </div>
               <div>
                  <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Sprint Board</h1>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Development Cycle</p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Find issues..." 
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-[14px] w-80 focus:bg-white focus:border-blue-500 transition-all outline-none"
                />
              </div>
              <button 
                onClick={() => navigate('/tasks/create')}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                <Plus size={18} /> Create Issue
              </button>
            </div>
          </div>
        </nav>

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto p-10">
          <div className="flex gap-8 h-full min-w-max pb-4">
            {columns.map(column => (
              <div key={column.id} className="w-[320px] flex flex-col h-full bg-gray-50/50 rounded-[2rem] p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-6 px-4">
                   <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${column.color.split(' ')[0]}`}></span>
                      <h3 className="font-bold text-gray-900 uppercase tracking-widest text-[11px]">{column.title}</h3>
                      <span className="bg-gray-200/50 text-gray-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        {tasks.filter(t => t.status === column.id).length}
                      </span>
                   </div>
                   <MoreVertical size={16} className="text-gray-400" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                  {tasks.filter(t => t.status === column.id).map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => openTaskDrawer(task)}
                      className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                           {getTypeIcon(task.issue_type)}
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GF-{task.id.substring(0,3).toUpperCase()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 text-[15px] mb-4 leading-snug group-hover:text-blue-600 transition-colors">{task.title}</h4>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex -space-x-2 overflow-hidden">
                            {task.assignee_details?.map((u) => (
                              <div 
                                key={u.id} 
                                title={u.name} 
                                className="w-8 h-8 rounded-xl border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm ring-1 ring-blue-500/10 hover:z-10 transition-all"
                              >
                                 {u.initial}
                              </div>
                            ))}
                            {(!task.assignee_details || task.assignee_details.length === 0) && (
                              <div className="w-8 h-8 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">U</div>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-600 truncate max-w-[120px] bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                            {task.assignee_details?.[0]?.name || 'Unassigned'}
                            {task.assignee_details?.length > 1 && ` +${task.assignee_details.length - 1}`}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                           {task.status === 'done' ? (
                             <div className="flex flex-col items-end gap-0.5">
                               <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                 <CheckCircle2 size={12} /> {task.completion_date || 'COMPLETED'}
                               </div>
                               <div className="text-[9px] text-gray-400 font-bold uppercase pr-1">
                                 Done on {new Date(task.updated_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                               </div>
                             </div>
                           ) : (
                             <div className="flex flex-col items-end gap-1">
                               <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border ${new Date(task.due_date) < new Date() ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                 <Clock size={12} /> {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'NO DUE DATE'}
                               </div>
                               <div className="text-[9px] text-gray-400 font-bold uppercase pr-1">
                                 Assigned: {new Date(task.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                               </div>
                             </div>
                           )}
                           <select 
                             onClick={(e) => e.stopPropagation()}
                             onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                             value={task.status}
                             className="text-[10px] font-bold bg-gray-50 border-none rounded-lg py-1 px-2 focus:ring-0 cursor-pointer"
                           >
                             {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                           </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate(`/tasks/create?status=${column.id}`)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-all text-xs font-bold"
                  >
                    <Plus size={16} /> New Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Detail Drawer */}
        {isDrawerOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
            <div className="relative w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col animate-slide-left">
               <div className="flex items-center justify-between p-8 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                     <span className="text-[12px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                        <Activity size={14} /> GOLF-{selectedTask.id.substring(0, 4).toUpperCase()}
                     </span>
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                        onClick={() => handleDeleteTask(selectedTask.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                     >
                        <Trash2 size={20} />
                     </button>
                     <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                     >
                        <X size={20} />
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-12 space-y-10">
                  <div className="space-y-4">
                     <h2 className="text-3xl font-bold text-gray-900 brand-font leading-tight">{selectedTask.title}</h2>
                     <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                           <select 
                              onChange={(e) => handleStatusUpdate(selectedTask.id, e.target.value)}
                              value={selectedTask.status}
                              className="bg-transparent border-none text-[11px] font-bold text-blue-600 focus:ring-0 py-0"
                           >
                              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                           </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Priority:</span>
                           <span className={`text-[11px] font-bold uppercase tracking-widest ${getPriorityColor(selectedTask.priority).split(' ')[1]}`}>
                              {selectedTask.priority}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} /> Description
                     </h3>
                     <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100">
                        {selectedTask.description || "No description provided."}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <User size={14} /> Assignees
                        </h3>
                        <div className="flex items-center gap-3">
                           {selectedTask.assignee_details?.map(u => (
                              <div key={u.id} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
                                 <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                    {u.name[0].toUpperCase()}
                                 </div>
                                 {u.name}
                              </div>
                           ))}
                           {(!selectedTask.assignee_details || selectedTask.assignee_details.length === 0) && (
                              <span className="text-gray-400 text-xs italic">None assigned</span>
                           )}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={14} /> Due Date
                        </h3>
                        <div className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 inline-block">
                           {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'}) : "No deadline"}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-gray-100">
                     <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} /> Activity & Comments ({comments.length})
                     </h3>
                     
                     <form onSubmit={handleAddComment} className="flex gap-4">
                        <input 
                           type="text" 
                           placeholder="Write a comment..." 
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           className="flex-1 bg-gray-50 border border-transparent rounded-2xl px-6 py-3 text-sm focus:bg-white focus:border-blue-500 transition-all outline-none"
                        />
                        <button 
                           type="submit"
                           disabled={submittingComment || !newComment.trim()}
                           className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                           <Send size={20} />
                        </button>
                     </form>

                     <div className="space-y-6">
                        {comments.map(c => (
                           <div key={c.id} className="flex gap-4 group">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-500 font-bold text-sm shadow-sm shrink-0">
                                 {c.user_name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 space-y-1">
                                 <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">{c.user_name}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm group-hover:bg-white transition-all">
                                    {c.comment}
                                 </p>
                              </div>
                           </div>
                        ))}
                        {comments.length === 0 && (
                           <div className="text-center py-10 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                              <p className="text-gray-400 text-sm font-medium">No activity yet. Start the conversation!</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
