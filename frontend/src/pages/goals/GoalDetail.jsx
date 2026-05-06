import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  ArrowLeft, Target, Calendar, User, 
  Flag, Clock, CheckCircle2, Plus, 
  MoreVertical, Activity, Layers, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GoalDetail = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      toast.error("Failed to load epic details");
      navigate('/goals');
    } finally {
      setLoading(false);
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

  const handleToggleAssignee = async (taskId, userId) => {
    try {
      const token = localStorage.getItem('token');
      // Find the task in local state to get current assignees
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
      fetchGoalDetails(); // Refresh to show changes
    } catch (err) {
      toast.error("Failed to update assignees");
    }
  };

  const [members, setMembers] = useState([]);
  useEffect(() => {
    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const orgId = localStorage.getItem('orgId');
            if (orgId) {
                const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMembers(res.data.members || []);
            }
        } catch (err) { console.error(err); }
    };
    fetchMembers();
  }, []);

  if (loading) return (
    <div className="flex h-screen bg-[#f8fafc]">
       <Sidebar />
       <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">Unpacking epic details...</p>
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
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                       {getStatusBadge(goal.status)}
                       <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-100">
                          <Flag size={14} /> {goal.priority} Priority
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
                          {/* Interactive Employee Management */}
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
                                            handleToggleAssignee(task.id, member.user_id || member.id);
                                         }}
                                         className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                                            isAssigned 
                                               ? 'bg-blue-50 border-blue-200 text-blue-600' 
                                               : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                         }`}
                                      >
                                         {member.full_name || member.username}
                                      </button>
                                   );
                                })}
                                {members.length === 0 && (
                                   <div className="text-[9px] text-gray-300 italic">No team members</div>
                                )}
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
                       <button 
                          onClick={() => navigate(`/tasks/create?goalId=${goalId}`)}
                          className="btn-primary py-3 px-10"
                       >
                          Add Your First Task
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;