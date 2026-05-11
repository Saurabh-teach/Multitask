import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { 
  Plus, Target, Filter, MoreHorizontal, Search, 
  Calendar, User as UserIcon, ArrowRight, TrendingUp, AlertCircle, Trash2,
  Activity, Compass, ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { toast } from 'react-hot-toast';

const Goals = () => {
  const [orgId, setOrgId] = useState(localStorage.getItem('orgId'));
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userRole, setUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleOrgChange = () => {
      setOrgId(localStorage.getItem('orgId'));
    };
    window.addEventListener('storage', handleOrgChange);
    return () => window.removeEventListener('storage', handleOrgChange);
  }, []);

  useEffect(() => {
    if (orgId) {
      fetchGoals();
    }
  }, [orgId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const orgsRes = await apiClient.get('/my-organizations/');
      const currentOrg = orgsRes.data.organizations?.find(o => (o.organization_id || o.id) === orgId);
      
      if (currentOrg) {
        setUserRole(currentOrg.role || 'user');
        setCurrentUserId(currentOrg.user_id);
        const res = await apiClient.get(`/organizations/${orgId}/goals/`);
        setGoals(res.data);
        setFilteredGoals(res.data);
      }
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (e, goalId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    
    try {
      await apiClient.delete(`/goals/${goalId}/delete/`);
      toast.success("Goal deleted");
      fetchGoals();
    } catch (err) {
      toast.error("Operation failed");
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
      not_started: { label: 'To Do', color: 'bg-[#EBECF0] text-[#42526E]' },
      in_progress: { label: 'In Progress', color: 'bg-[#DEEBFF] text-[#0747A6]' },
      at_risk: { label: 'At Risk', color: 'bg-[#FFEBE6] text-[#BF2600]' },
      completed: { label: 'Done', color: 'bg-[#E3FCEF] text-[#006644]' },
    };
    const style = badges[status] || badges.not_started;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${style.color}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans text-[#172B4D]">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#DFE1E6] shrink-0">
          <div className="px-8 py-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-semibold text-[#172B4D]">Goals</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                <input 
                  type="text" 
                  placeholder="Search goals..." 
                  className="pl-10 pr-4 py-2 bg-[#F4F5F7] border-2 border-transparent rounded focus:bg-white focus:border-[#4C9AFF] outline-none text-sm w-64 transition-all"
                />
              </div>
              <button 
                onClick={() => navigate('/goals/create')}
                className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Create Goal
              </button>
            </div>
          </div>

          <div className="px-8 py-2 bg-white flex items-center gap-6">
            <div className="flex items-center gap-1">
              {['all', 'not_started', 'in_progress', 'at_risk', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilter(status)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                    filter === status 
                      ? 'bg-[#EBECF0] text-[#0052CC]' 
                      : 'text-[#5E6C84] hover:bg-[#F4F5F7] hover:text-[#172B4D]'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin" />
               <p className="text-[#5E6C84] text-sm">Loading goals...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="bg-white rounded border border-[#DFE1E6] p-20 text-center flex flex-col items-center shadow-sm">
              <div className="text-[#DFE1E6] mb-6">
                <Target size={48} />
              </div>
              <h3 className="text-lg font-semibold text-[#172B4D] mb-2">No goals found</h3>
              <p className="text-[#5E6C84] text-sm mb-8 max-w-xs mx-auto">Create a goal to start tracking progress across your workspace.</p>
              <button 
                onClick={() => navigate('/goals/create')}
                className="bg-[#0052CC] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#0747A6] transition-all"
              >
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="bg-white rounded border border-[#DFE1E6] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F4F5F7] text-[#5E6C84] text-[11px] font-bold uppercase tracking-wider border-b border-[#DFE1E6]">
                      <th className="py-4 px-6">Goal</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Owner</th>
                      <th className="py-4 px-6">Deadline</th>
                      <th className="py-4 px-6 w-64">Progress</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE1E6]">
                    {filteredGoals.map((goal) => (
                      <tr 
                        key={goal.id} 
                        onClick={() => navigate(`/goals/${goal.id}`)}
                        className="hover:bg-[#F4F5F7] transition-all cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-[#172B4D] group-hover:text-[#0052CC]">{goal.title}</div>
                            <div className="text-xs text-[#5E6C84] truncate max-w-xs mt-0.5">{goal.description || "No description provided."}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(goal.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-[10px]">
                              {(goal.owner_name || 'U')[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-[#172B4D]">{goal.owner_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-[#172B4D]">{goal.due_date ? new Date(goal.due_date).toLocaleDateString() : '--'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-[#5E6C84]">
                               <span>{Math.round(goal.progress)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  goal.progress === 100 ? 'bg-[#36B37E]' : 'bg-[#0052CC]'
                                }`} 
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {(['owner', 'admin'].includes(userRole?.toLowerCase()) || goal.created_by === currentUserId) && (
                              <button 
                                onClick={(e) => handleDeleteGoal(e, goal.id)}
                                className="p-1.5 text-[#C1C7D0] hover:text-[#DE350B] hover:bg-[#FFEBE6] rounded transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <button className="p-1.5 text-[#C1C7D0] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded transition-all">
                              <MoreHorizontal size={16} />
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
        </main>
      </div>
    </div>
  );
};

export default Goals;
