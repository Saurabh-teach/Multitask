import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import NotificationBell from '../../components/layout/NotificationBell';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { 
  Search, Bell, Clock, CheckCircle2, 
  Target, ListTodo, ArrowUpRight, Trash2,
  Activity, Zap, LayoutDashboard, Filter,
  ChevronRight
} from 'lucide-react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeGoals: 0,
    openTasks: 0,
    completion: 0,
    teamMembers: 0,
    recentGoals: [],
    myTasks: [],
    activityLogs: [],
    role: 'member',
    permissions: []
  });
  const { token, currentOrgId } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      if (currentOrgId) {
        fetchDashboardData();
      } else {
        apiClient.get('my-organizations/').then(res => {
          if (!res.data.organizations?.length) setLoading(false);
        }).catch(() => setLoading(false));
      }
    }
  }, [token, currentOrgId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const orgsRes = await apiClient.get('my-organizations/');
      const organizations = orgsRes.data.organizations || [];
      const currentOrg = organizations.find(o => (o.id || o.organization_id) === currentOrgId);
      
      if (!currentOrg) {
        console.log("Dashboard: currentOrgId not valid. Waiting for Sidebar to correct.");
        setLoading(false);
        return;
      }

      const dashboardRes = await apiClient.get(`organizations/${currentOrgId}/dashboard/`);
      
      if (currentOrg) {
        setUser({
          name: `${currentOrg.first_name} ${currentOrg.last_name}`.trim() || 'Team Member',
          role: currentOrg.role || 'member',
          job_title: currentOrg.job_title || 'Expert'
        });
      }
      
      setStats({ ...dashboardRes.data, role: currentOrg?.role });
    } catch (err) {
      console.error("Dashboard Sync Error:", err.response?.data || err.message);
      if (err.response?.status === 404) {
          toast.error('Workspace context invalid. Please select a valid organization in the sidebar.');
      } else {
          toast.error('Syncing with workspace...');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await apiClient.delete(`goals/${goalId}/delete/`);
      toast.success("Goal removed");
      fetchDashboardData();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans text-[#172B4D]">
      <Sidebar />

      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-[#DFE1E6] sticky top-0 z-40">
          <div className="px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#172B4D]">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-64 pl-10 pr-4 py-2 bg-[#F4F5F7] border-2 border-transparent rounded focus:bg-white focus:border-[#4C9AFF] transition-all outline-none text-sm"
                />
              </div>

              <NotificationBell />
              
              <div className="flex gap-2">
                 <button onClick={() => navigate('/tasks/create')} className="px-4 py-2 text-sm font-medium text-[#42526E] bg-[#EBECF0] rounded hover:bg-[#DFE1E6] transition-all">Add Task</button>
                 <button onClick={() => navigate('/goals/create')} className="px-4 py-2 text-sm font-medium text-white bg-[#0052CC] rounded hover:bg-[#0747A6] transition-all">New Goal</button>
              </div>
            </div>
          </div>
        </header>

        <div className="px-8 py-8 max-w-6xl mx-auto grid grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {loading ? (
              <div className="space-y-6">
                <div className="flex gap-6 border-b border-[#DFE1E6] pb-4">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-24 h-4" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-24" />)}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-8 border-b border-[#DFE1E6]">
                  {['tasks', 'goals'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'}`}
                    >
                      {tab === 'tasks' ? 'My Tasks' : 'Goals'}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0052CC]" />}
                    </button>
                  ))}
                </div>

                {activeTab === 'tasks' ? (
                  <div className="space-y-3">
                    {stats.myTasks.length > 0 ? (
                      <div className="bg-white rounded border border-[#DFE1E6] divide-y divide-[#DFE1E6] shadow-sm">
                        {stats.myTasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => navigate(`/tasks/${task.id}`)} 
                            className="p-4 flex items-center justify-between hover:bg-[#F4F5F7] transition-all cursor-pointer group"
                          >
                             <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${task.status === 'done' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DEEBFF] text-[#0747A6]'}`}>
                                   {task.status === 'done' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                </div>
                                <div>
                                   <h3 className="text-sm font-medium text-[#172B4D] group-hover:text-[#0052CC]">{task.title}</h3>
                                   <div className="flex items-center gap-3 mt-1">
                                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-[#FFEBE6] text-[#BF2600]' : 'bg-[#EBECF0] text-[#42526E]'}`}>
                                        {task.priority}
                                      </span>
                                      <span className="text-[11px] text-[#5E6C84]">
                                        GF-{task.id.substring(0,4).toUpperCase()}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full uppercase ${task.status === 'done' ? 'bg-[#36B37E] text-white' : 'bg-[#FFAB00] text-white'}`}>
                                   {task.status.replace('_', ' ')}
                                </span>
                                <ChevronRight size={16} className="text-[#C1C7D0]" />
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={<CheckCircle2 size={32} />} 
                        title="You're all caught up" 
                        desc="No tasks assigned to you at the moment."
                        action={() => navigate('/tasks/create')}
                        btnText="Create Task"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.myCreatedGoals?.length > 0 ? (
                      stats.myCreatedGoals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} navigate={navigate} />
                      ))
                    ) : (
                      <EmptyState 
                        icon={<Target size={32} />} 
                        title="No goals yet" 
                        desc="Create a goal to start tracking progress."
                        action={() => navigate('/goals/create')}
                        btnText="Create Goal"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white rounded border border-[#DFE1E6] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[#172B4D] mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[#0052CC]" />
                  Recent Activity
                </h3>
                
                <div className="space-y-4">
                   {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />) : (
                     stats.activityLogs?.slice(0, 5).map((log, idx) => (
                       <div key={idx} className="flex gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-[#EBECF0] flex items-center justify-center text-[10px] font-bold shrink-0">
                             {log.user_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                             <p className="text-[#172B4D]">
                                <span className="font-semibold">{log.user_name}</span> {log.action} {log.target_type}
                             </p>
                             <p className="text-[11px] text-[#5E6C84] mt-0.5">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                       </div>
                     )) || <p className="text-xs text-[#5E6C84]">No recent activity</p>
                   )}
                </div>
             </div>

             <div className="bg-[#0747A6] rounded p-6 text-white shadow-md">
                <h4 className="text-sm font-semibold mb-1 opacity-80">Workspace Completion</h4>
                <div className="flex items-end gap-2 mb-4">
                   <span className="text-3xl font-bold">{stats.completion}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white transition-all duration-1000" style={{ width: `${stats.completion}%` }} />
                </div>
                <p className="text-xs opacity-70 mt-3 font-medium">
                   Keep track of your team's overall progress.
                </p>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, desc, action, btnText }) => (
  <div className="bg-white rounded border border-[#DFE1E6] p-12 text-center shadow-sm">
     <div className="text-[#0052CC] mb-4 flex justify-center">
        {icon}
     </div>
     <h3 className="text-lg font-semibold text-[#172B4D] mb-1">{title}</h3>
     <p className="text-[#5E6C84] text-sm mb-6 max-w-xs mx-auto">{desc}</p>
     <button onClick={action} className="bg-[#0052CC] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#0747A6] transition-all">
       {btnText}
     </button>
  </div>
);

const GoalCard = ({ goal, onDelete, navigate }) => (
  <div className="bg-white rounded border border-[#DFE1E6] p-6 shadow-sm hover:border-[#4C9AFF] transition-all cursor-pointer" onClick={() => navigate(`/goals/${goal.id}`)}>
     <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#0052CC] text-white rounded flex items-center justify-center">
              <Target size={20} />
           </div>
           <div>
              <h3 className="text-base font-semibold text-[#172B4D]">{goal.title}</h3>
              <p className="text-[11px] text-[#5E6C84] uppercase font-bold tracking-wider">Goal</p>
           </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
          className="p-1.5 text-[#C1C7D0] hover:text-[#DE350B] hover:bg-[#FFEBE6] rounded transition-all"
        >
          <Trash2 size={16} />
        </button>
     </div>

     <div className="space-y-4">
        <div>
           <div className="flex justify-between text-xs font-medium text-[#42526E] mb-2">
              <span>Progress</span>
              <span>{Math.round(goal.progress)}%</span>
           </div>
           <div className="w-full h-1.5 bg-[#EBECF0] rounded-full overflow-hidden">
              <div className="h-full bg-[#0052CC] transition-all duration-1000" style={{ width: `${goal.progress}%` }} />
           </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-[#F4F5F7]">
           <span className="text-xs text-[#5E6C84] font-medium">{goal.tasks?.length || 0} tasks linked</span>
           <span className="text-[11px] text-[#0052CC] font-semibold flex items-center gap-1">
              Details <ChevronRight size={14} />
           </span>
        </div>
     </div>
  </div>
);

export default Dashboard;