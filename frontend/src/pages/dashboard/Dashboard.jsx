import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { 
  Search, Bell, Clock, CheckCircle2, 
  TrendingUp, ArrowUpRight, Target, ListTodo, Users, Zap
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeGoals: 0,
    openTasks: 0,
    completion: 0,
    teamMembers: 0,
    recentGoals: [],
    myTasks: [],
    role: 'member'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) {
        setLoading(false);
        return navigate('/login');
      }

      // 1. Fetch User Profile for Role/Name
      const profileRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      const currentOrg = profileRes.data.organizations?.[0];
      const orgId = currentOrg?.id || currentOrg?.organization_id;
      
      // Determine user details from first org membership
      if (currentOrg) {
         setUser({
            name: `${currentOrg.first_name} ${currentOrg.last_name}`.trim() || 'Team Member',
            role: currentOrg.role || 'member',
            job_title: currentOrg.job_title || 'Expert'
         });
      }

      if (orgId) {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/auth/organizations/${orgId}/dashboard/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats({ ...res.data, role: currentOrg.role });
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-y-auto">
        {/* Modern Topbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">
                {stats.role === 'owner' ? 'Strategic Overview' : 'Mission Control'}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">
                {stats.role === 'owner' ? 'Your Work' : `Welcome back, ${user?.name?.split(' ')[0] || 'Member'}`}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search goals, tasks..." 
                  className="w-80 pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-[14px] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2.5 rounded-xl transition-all relative">
                  <Bell size={20} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                  SS
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="px-10 py-10 max-w-7xl mx-auto space-y-10">
          
          {loading ? (
             <div className="flex flex-col items-center justify-center h-96 gap-4">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 font-bold animate-pulse">Synchronizing workspace...</p>
             </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                <div className="card-premium group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target size={64} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                    {stats.role === 'owner' ? 'Active Epics' : 'My Active Work'}
                  </p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-gray-900 brand-font">
                        {stats.role === 'owner' ? stats.activeGoals : stats.myTasks.filter(t => t.status !== 'done').length}
                    </h3>
                    <span className="text-blue-600 font-bold text-sm mb-1 flex items-center"><Zap size={14} className="fill-blue-600" /> {stats.role === 'owner' ? 'Strategic' : 'Personal'}</span>
                  </div>
                </div>

                <div className="card-premium group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ListTodo size={64} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Open Tasks</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-gray-900 brand-font">{stats.openTasks}</h3>
                    <span className="text-indigo-600 font-bold text-sm mb-1 flex items-center"><Clock size={14} /> On schedule</span>
                  </div>
                </div>

                <div className="card-premium group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={64} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Efficiency</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-gray-900 brand-font">{stats.completion}%</h3>
                    <span className="text-emerald-600 font-bold text-sm mb-1 flex items-center"><ArrowUpRight size={14} /> +2.4%</span>
                  </div>
                </div>

                <div className="card-premium group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={64} className="text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Team Size</p>
                  <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-bold text-gray-900 brand-font">{stats.teamMembers || 1}</h3>
                    <span className="text-purple-600 font-bold text-sm mb-1">Collaborators</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Section (Tasks) */}
                <div className="lg:col-span-2 space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 brand-font">Your Assignments</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Tasks specifically assigned to your account</p>
                      </div>
                      <button onClick={() => navigate('/tasks')} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">View Sprint Board</button>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                      {stats.myTasks.length > 0 ? stats.myTasks.map(task => (
                        <div key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} className="px-8 py-5 flex items-center justify-between hover:bg-blue-50/30 cursor-pointer transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'} transition-all`}>
                               {task.status === 'done' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                            </div>
                            <div>
                              <p className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{task.title}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${task.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {task.priority}
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">Updated 2h ago</span>
                              </div>
                            </div>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                              <Clock size={14} /> 
                              {new Date(task.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="px-8 py-20 text-center space-y-4">
                           <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                             <CheckCircle2 size={32} />
                           </div>
                           <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                           <p className="text-gray-500 max-w-xs mx-auto">You have no pending tasks assigned to you. Time to take on a new challenge?</p>
                           <button onClick={() => navigate('/tasks')} className="btn-primary py-3 px-8 text-sm">Create New Task</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (Side Widgets) */}
                <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  
                  {/* Recent Epics */}
                  <div className="card-premium">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900 brand-font">Strategic Epics</h3>
                      <button onClick={() => navigate('/goals')} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all">
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                    
                    <div className="space-y-5">
                      {stats.recentGoals.length > 0 ? stats.recentGoals.map(goal => (
                        <div key={goal.id} onClick={() => navigate(`/goals/${goal.id}`)} className="group cursor-pointer">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[13px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate pr-4">{goal.title}</span>
                            <span className="text-[11px] font-bold text-gray-400">{Math.round(goal.progress)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" 
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10">
                          <p className="text-sm text-gray-400 font-medium">No strategic epics active.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Log Teaser */}
                  <div className="card-premium bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl shadow-blue-500/20">
                     <div className="flex items-center gap-3 mb-4">
                       <Zap size={20} className="fill-white" />
                       <h3 className="text-lg font-bold brand-font">Recent Velocity</h3>
                     </div>
                     <p className="text-sm text-blue-50/80 mb-6 font-medium leading-relaxed">Your team's execution speed is up by 15% this week. Keep hitting those milestones!</p>
                     <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-gray-300 overflow-hidden">
                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white/20 flex items-center justify-center text-[10px] font-bold">+2</div>
                     </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;