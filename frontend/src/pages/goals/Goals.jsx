import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, Target, Filter, MoreHorizontal, Search, 
  Calendar, User as UserIcon, ArrowRight, TrendingUp, AlertCircle, Trash2
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { toast } from 'react-hot-toast';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userRole, setUserRole] = useState('member');
  const navigate = useNavigate();

  const [currentOrgId, setCurrentOrgId] = useState(localStorage.getItem('orgId') || null);

  useEffect(() => {
    fetchGoals();
    
    // Listen for organization changes in the sidebar
    const handleOrgChange = () => {
        const newOrgId = localStorage.getItem('orgId');
        setCurrentOrgId(newOrgId);
        setLoading(true);
    };
    window.addEventListener('storage', handleOrgChange);
    return () => window.removeEventListener('storage', handleOrgChange);
  }, [currentOrgId]);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const activeOrgId = currentOrgId || localStorage.getItem('orgId');
      
      if (activeOrgId) {
        // Fetch Organization context first for user role
        const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const currentOrg = orgRes.data.organizations?.find(o => (o.organization_id || o.id) === activeOrgId);
        
        if (currentOrg) {
          setUserRole(currentOrg.role || 'member');
          const res = await axios.get(
            `http://127.0.0.1:8000/api/auth/organizations/${activeOrgId}/goals/`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setGoals(res.data);
          setFilteredGoals(res.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (e, goalId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this goal? All associated tasks will be orphaned.")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/auth/goals/${goalId}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err) {
      toast.error("Failed to delete goal");
    }
  };

  const handleFilter = (status) => {
    setFilter(status);
    if (status === 'all') {
      setFilteredGoals(goals);
    } else {
      setFilteredGoals(goals.filter(goal => goal.status === status));
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
      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${style.color}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityTag = (priority) => {
    const tags = {
      high: { color: 'text-red-500', bg: 'bg-red-500' },
      medium: { color: 'text-blue-500', bg: 'bg-blue-500' },
      low: { color: 'text-slate-400', bg: 'bg-slate-400' },
    };
    const style = tags[priority] || tags.medium;
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${style.bg}`} />
        <span className={`text-[11px] font-bold uppercase tracking-widest ${style.color}`}>{priority}</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-72 transition-all duration-300">
        {/* Modern Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full">
          <div className="px-4 md:px-10 py-5 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                 <Target size={24} />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 brand-font tracking-tight truncate">Strategic Goals</h1>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6 flex-1 justify-end min-w-fit">
               <div className="relative group hidden sm:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="w-40 md:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                 />
               </div>
               {['owner', 'admin', 'manager'].includes(userRole?.toLowerCase()) && (
                <button 
                  onClick={() => navigate('/goals/create')}
                  className="btn-primary py-2.5 px-4 md:px-6 text-sm shrink-0 whitespace-nowrap"
                >
                  <Plus size={18} /> <span className="hidden xs:inline">Create New</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 animate-fade-in">
          
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                <div>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Goals</p>
                   <h3 className="text-3xl font-bold text-gray-900 brand-font">{goals.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Target size={24} />
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">On Track</p>
                   <h3 className="text-3xl font-bold text-gray-900 brand-font">{goals.filter(g => g.status === 'in_progress').length}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <TrendingUp size={24} />
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                <div>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">At Risk</p>
                   <h3 className="text-3xl font-bold text-gray-900 brand-font">{goals.filter(g => g.status === 'at_risk').length}</h3>
                </div>
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                   <AlertCircle size={24} />
                </div>
             </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1">
              {['all', 'not_started', 'in_progress', 'at_risk', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilter(status)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    filter === status 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'All Initiatives' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
            
            <button className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-50 px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Filter size={18} /> Advanced Filter
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 font-bold">Synchronizing roadmap...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="card-premium py-24 text-center border-dashed border-2">
              <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 brand-font mb-3">No Goals Found</h3>
              <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Capture your long-term objectives as Goals to start tracking progress effectively across your team.</p>
              <button 
                onClick={() => navigate('/goals/create')}
                className="btn-primary text-lg px-10 py-4"
              >
                Create First Goal
              </button>
            </div>
          ) : (
            <div className="card-premium p-0 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <th className="py-5 px-8 w-12 text-center">Pri</th>
                      <th className="py-5 px-6">Initiative Name</th>
                      <th className="py-5 px-6 w-32">Status</th>
                      <th className="py-5 px-6 w-48 text-center">Accountable</th>
                      <th className="py-5 px-6 w-32 text-center">Due Date</th>
                      <th className="py-5 px-6 w-72">Velocity & Progress</th>
                      <th className="py-5 px-8 w-16 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredGoals.map((goal) => (
                      <tr 
                        key={goal.id} 
                        onClick={() => navigate(`/goals/${goal.id}`)}
                        className="hover:bg-blue-50/20 transition-all cursor-pointer group"
                      >
                        <td className="py-6 px-8 text-center">
                          {getPriorityTag(goal.priority)}
                        </td>
                        <td className="py-6 px-6">
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-[15px]">{goal.title}</div>
                          {goal.description && (
                            <div className="text-[11px] text-gray-400 font-medium truncate mt-1 max-w-md">{goal.description}</div>
                          )}
                        </td>
                        <td className="py-6 px-6">
                          {getStatusBadge(goal.status)}
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] shadow-md">
                              {goal.owner ? (goal.owner.username ? goal.owner.username.substring(0, 2).toUpperCase() : 'U') : '?'}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{goal.owner ? goal.owner.username : 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-6 text-center">
                          <div className="inline-flex items-center gap-2 text-[12px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                            <Calendar size={14} />
                            {goal.due_date ? new Date(goal.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '--'}
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  goal.progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                }`} 
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-[12px] font-bold text-gray-900 w-10 text-right">{Math.round(goal.progress)}%</span>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex justify-end gap-2">
                            {['owner', 'admin'].includes(userRole?.toLowerCase()) && (
                              <button 
                                onClick={(e) => handleDeleteGoal(e, goal.id)}
                                className="text-gray-300 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Epic"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                            <button className="text-gray-300 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
                              <MoreHorizontal size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
