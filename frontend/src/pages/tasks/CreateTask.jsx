import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  ListTodo, Calendar, Users, AlignLeft, 
  ArrowLeft, Plus, ShieldCheck, Flag, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlGoalId = queryParams.get('goalId');

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issue_type: 'task',
    goal: urlGoalId || '',
    assignees: [],
    due_date: '',
    priority: 'medium',
    status: 'todo'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgId = orgRes.data.organizations?.[0]?.organization_id || orgRes.data.organizations?.[0]?.id;
      
      if (orgId) {
        const [memRes, goalRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/members/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/goals/`, {
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
    if (!formData.goal) return toast.error("Please select a parent epic");
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/auth/goals/${formData.goal}/tasks/create/`, formData, {
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

  const toggleAssignee = (userId) => {
    const current = [...formData.assignees];
    if (current.includes(userId)) {
      setFormData({...formData, assignees: current.filter(id => id !== userId)});
    } else {
      setFormData({...formData, assignees: [...current, userId]});
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Create New Issue</h1>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest">
               <Layers size={16} /> Sprint Execution
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
                           <Layers size={14} /> Parent Strategic Epic <span className="text-red-500">*</span>
                        </label>
                        <select 
                          required
                          className="input-premium py-4 appearance-none"
                          value={formData.goal}
                          onChange={(e) => setFormData({...formData, goal: e.target.value})}
                        >
                          <option value="">Select an epic...</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <ShieldCheck size={14} /> Issue Type <span className="text-red-500">*</span>
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
                           <ListTodo size={14} /> Issue Title <span className="text-red-500">*</span>
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
                          rows="3"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="input-premium py-4"
                          placeholder="Detail the technical requirements and acceptance criteria..."
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
                               onClick={() => toggleAssignee(m.user_id)}
                               className={`px-4 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all ${formData.assignees.includes(m.user_id) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                             >
                                {m.full_name}
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

                      <div className="pt-6">
                         <button
                           type="submit"
                           disabled={loading}
                           className="btn-primary w-full py-5 text-xl shadow-xl shadow-blue-500/20"
                         >
                           {loading ? "Creating Issue..." : "Create Issue"}
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