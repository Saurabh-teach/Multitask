import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import NotificationBell from '../../components/layout/NotificationBell';
import toast from 'react-hot-toast';
import { 
  Search, Filter, Clock, CheckCircle2, 
  MoreVertical, Calendar, Flag, Target, 
  ListTodo, Layers, ArrowUpRight, ChevronRight
} from 'lucide-react';

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [goalFilter, setGoalFilter] = useState('all');
  const [goals, setGoals] = useState([]);
  const { token, currentOrgId } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (token && currentOrgId) {
      console.log("AllTasks fetching for org:", currentOrgId);
      fetchTasks();
    }
  }, [token, currentOrgId]);

  const fetchTasks = async () => {
    if (!currentOrgId) {
        setLoading(false);
        return;
    }

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentOrgId)) {
        console.error("Invalid Organization ID format:", currentOrgId);
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const orgsRes = await apiClient.get('my-organizations/');
      const orgsList = orgsRes.data.organizations || [];
      const currentOrg = orgsList.find(o => (o.id || o.organization_id) === currentOrgId);

      if (!currentOrg) {
          console.log("currentOrgId not found in verified organizations list. Waiting for Sidebar sync.");
          setLoading(false);
          return;
      }

      const [taskRes, goalRes] = await Promise.all([
          apiClient.get(`organizations/${currentOrgId}/tasks/`),
          apiClient.get(`organizations/${currentOrgId}/goals/`)
      ]);
      
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      setGoals(Array.isArray(goalRes.data) ? goalRes.data : []);
    } catch (err) {
      console.error("Task Repository Sync Error:", err.response?.data || err.message);
      if (err.response?.status === 404) {
          toast.error("Repository context stale. Re-syncing...");
          localStorage.removeItem('orgId');
          window.dispatchEvent(new Event('storage'));
      } else {
          toast.error("Failed to load repository data");
      }
      setTasks([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'in_review': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'todo': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const taskGoalId = task.goal?.id || task.goal;
    const matchesGoal = goalFilter === 'all' || String(taskGoalId) === String(goalFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesGoal;
  });

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans text-[#172B4D]">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#DFE1E6] shrink-0">
          <div className="px-10 py-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <nav className="flex items-center text-xs text-[#5E6C84] gap-2 mb-1">
                  <span>Workspace</span>
                  <ChevronRight size={12} />
                  <span className="text-[#172B4D] font-bold">All Tasks</span>
                </nav>
                <h1 className="text-2xl font-bold text-[#172B4D] brand-font flex items-center gap-3">
                  <ListTodo size={28} className="text-[#0052CC]" />
                  Task Repository
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <button 
                  onClick={() => navigate('/tasks/create')}
                  className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Create New Task
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by title or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-[#F4F5F7] border-2 border-transparent rounded-xl focus:bg-white focus:border-[#4C9AFF] transition-all outline-none text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-white border border-[#DFE1E6] rounded-xl px-3 py-1.5 shadow-sm">
                <Filter size={16} className="text-[#5E6C84]" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#42526E] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-[#DFE1E6] rounded-xl px-3 py-1.5 shadow-sm">
                <Flag size={16} className="text-[#5E6C84]" />
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#42526E] outline-none cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-[#DFE1E6] rounded-xl px-3 py-1.5 shadow-sm">
                <Target size={16} className="text-[#5E6C84]" />
                <select 
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value)}
                  className="bg-transparent text-sm font-bold text-[#42526E] outline-none cursor-pointer max-w-[150px]"
                >
                  <option value="all">All Goals</option>
                  {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto text-xs font-bold text-[#5E6C84] uppercase tracking-wider bg-slate-100 px-4 py-2 rounded-full">
                {filteredTasks.length} Tasks Found
              </div>
            </div>
          </div>
        </header>

        {/* List Content */}
        <main className="flex-1 overflow-y-auto p-10">
          <div className="bg-white rounded-[2rem] border border-[#DFE1E6] shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">Task ID</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">Title & Objective</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest">Goal Context</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[#5E6C84] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[#5E6C84] font-bold">Synchronizing repository...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <Layers size={48} />
                        <p className="text-xl font-bold">No tasks found matching your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr 
                      key={task.id} 
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="group hover:bg-[#F4F5F7] transition-all cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-[#5E6C84] bg-slate-100 px-2 py-1 rounded">
                          GF-{task.id.substring(0, 4).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{task.title}</span>
                          <span className="text-[11px] text-[#5E6C84] mt-1 line-clamp-1">{task.description || "No description provided"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(task.status)}`}>
                          {task.status === 'done' ? <CheckCircle2 size={12} className="mr-1.5" /> : <Clock size={12} className="mr-1.5" />}
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {task.goal_details ? (
                          <div className="flex items-center gap-2 text-[#403294] bg-[#EAE6FF] px-2 py-1 rounded-lg text-[10px] font-bold uppercase w-fit">
                            <Target size={12} />
                            {task.goal_details.title.substring(0, 20)}...
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">No Parent Goal</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-gray-400 hover:text-[#0052CC] hover:bg-white rounded-lg transition-all">
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AllTasks;
