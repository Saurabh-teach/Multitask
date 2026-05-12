import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import NotificationBell from '../../components/layout/NotificationBell';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, MoreHorizontal,
  Clock, CheckCircle2, AlertCircle, Trash2,
  ChevronDown, MessageSquare, User, Calendar,
  Flag, X, Send, Activity, Target, Settings,
  Menu, Layout, Zap, Share2, Eye, List, LayoutGrid, Columns
} from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [focusColumn, setFocusColumn] = useState(null); // null = no focus
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [isFocusModeOn, setIsFocusModeOn] = useState(false);

  const [goals, setGoals] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [organizations, setOrganizations] = useState([]);

  const navigate = useNavigate();
  const { token, currentOrgId, setCurrentOrgId } = useContext(AuthContext);
  const searchParams = new URLSearchParams(window.location.search);
  const initialMemberId = searchParams.get('member');

  useEffect(() => {
    if (initialMemberId) setMemberFilter(initialMemberId);
  }, [initialMemberId]);

  useEffect(() => {
    if (token && currentOrgId) {
      fetchInitialData();
    }
  }, [token, currentOrgId]);

  const fetchInitialData = async () => {
    try {
      const activeOrgId = currentOrgId;
      console.log("Tasks Board fetching for org:", activeOrgId);

      const orgsRes = await apiClient.get('/my-organizations/');
      const orgsList = orgsRes.data.organizations || [];
      setOrganizations(orgsList);

      if (activeOrgId) {
        const currentOrg = orgsList.find(o => (o.organization_id || o.id) === activeOrgId);

        if (!currentOrg) {
          console.log("activeOrgId not found in verified organizations list. Waiting for Sidebar sync.");
          setLoading(false);
          return;
        }

        setUserRole(currentOrg.role || 'user');
        setCurrentUserId(currentOrg.user_id);

        const [tasksRes, goalsRes, membersRes] = await Promise.all([
          apiClient.get(`/organizations/${activeOrgId}/tasks/`),
          apiClient.get(`/organizations/${activeOrgId}/goals/`),
          apiClient.get(`/organizations/${activeOrgId}/members/`)
        ]);

        setTasks(tasksRes.data || []);
        setGoals(goalsRes.data || []);
        const membersList = membersRes.data?.members || membersRes.data || [];
        setMembers(membersList);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Workspace context lost. Re-syncing...");
        localStorage.removeItem('orgId');
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error("Failed to load board data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await apiClient.patch(`/tasks/${taskId}/update-status/`, { status: newStatus });
      toast.success(`Issue moved to ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'done') triggerConfetti();
      fetchInitialData();
      if (selectedTask?.id === taskId) fetchTaskDetails(taskId);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const triggerConfetti = () => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.8}s`,
      color: ['#0052CC', '#36B37E', '#FFAB00', '#BF2600', '#6554C0'][Math.floor(Math.random() * 5)],
      size: `${6 + Math.random() * 8}px`,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 3000);
  };

  const exportCSV = () => {
    if (!filteredTasks.length) { toast.error('No tasks to export'); return; }
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Due Date', 'Goal'];
    const rows = filteredTasks.map(t => [
      t.id.substring(0, 8),
      `"${t.title}"`,
      t.status,
      t.priority || 'none',
      t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
      `"${t.goal_details?.title || 'None'}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'GoalFlow_Tasks.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Board exported as CSV!');
  };

  const toggleFocusMode = () => {
    setIsFocusModeOn(prev => {
      if (prev) { setFocusColumn(null); return false; }
      return true;
    });
    setShowSettings(false);
    if (!isFocusModeOn) toast('Click a column header to focus it', { icon: '🎯' });
  };

  const canEditStatus = (task) => {
    if (['owner', 'admin'].includes(userRole?.toLowerCase())) return true;
    const assigneeIds = task?.assignees?.map(String) || [];
    return assigneeIds.includes(String(currentUserId));
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await apiClient.delete(`/tasks/${taskId}/soft-delete/`);
      toast.success("Issue deleted");
      setIsDrawerOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const [taskRes, commentRes] = await Promise.all([
        apiClient.get(`/tasks/${taskId}/`),
        apiClient.get(`/tasks/${taskId}/comments/`)
      ]);
      setSelectedTask(taskRes.data);
      setComments(commentRes.data.comments || []);
    } catch (err) {
      toast.error("Failed to load issue details");
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
      await apiClient.post(`/tasks/${selectedTask.id}/comments/create/`, { comment: newComment });
      setNewComment('');
      fetchTaskDetails(selectedTask.id);
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <ChevronDown className="text-red-600 rotate-180" size={16} />;
      case 'high': return <ChevronDown className="text-orange-500 rotate-180" size={16} />;
      case 'medium': return <ChevronDown className="text-blue-500" size={16} />;
      default: return <ChevronDown className="text-gray-400" size={16} />;
    }
  };

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = (task.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const taskGoalId = task.goal?.id || task.goal;
    const matchesGoal = goalFilter === 'all' || String(taskGoalId) === String(goalFilter);
    const taskAssignees = task.assignees || [];
    const matchesMember = memberFilter === 'all' || taskAssignees.map(id => String(id)).includes(String(memberFilter));
    return matchesSearch && matchesGoal && matchesMember;
  });

  const columns = [
    { id: 'backlog', title: 'BACKLOG', color: 'border-l-gray-400' },
    { id: 'todo', title: 'TO DO', color: 'border-l-blue-400' },
    { id: 'in_progress', title: 'IN PROGRESS', color: 'border-l-indigo-500' },
    { id: 'in_review', title: 'IN REVIEW', color: 'border-l-purple-500' },
    { id: 'done', title: 'DONE', color: 'border-l-green-500' }
  ];

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden font-sans text-[#172B4D]">
      <Sidebar />

      {/* 🎉 Confetti Overlay */}
      {confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {confettiPieces.map(p => (
            <div key={p.id} className="absolute top-0 animate-confetti" style={{
              left: p.left,
              animationDelay: p.delay,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#DFE1E6] shrink-0">
          <div className="px-6 py-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <nav className="flex items-center text-sm text-[#5E6C84] gap-2">
                <span>Projects</span>
                <span>/</span>
                <span className="text-[#172B4D] font-medium">Sprint Board</span>
              </nav>
              <div className="flex items-center gap-3 relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full transition-all ${showSettings ? 'bg-[#0052CC] text-white' : 'hover:bg-[#EBECF0] text-[#42526E] hover:text-[#0052CC]'}`}
                >
                  <Settings size={20} className={`transition-transform duration-500 ${showSettings ? 'rotate-180' : ''}`} />
                </button>

                <NotificationBell />

                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className="absolute top-12 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50">
                      <div className="p-3 border-b border-gray-50 mb-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Board Configuration</p>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="px-3 py-3 mb-1">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">View Mode</p>
                        <div className="flex rounded-xl border border-gray-100 overflow-hidden">
                          <button
                            onClick={() => { setViewMode('kanban'); setShowSettings(false); }}
                            className={`flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${viewMode === 'kanban' ? 'bg-[#0052CC] text-white' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            <Columns size={14} /> Kanban
                          </button>
                          <button
                            onClick={() => { setViewMode('list'); setShowSettings(false); }}
                            className={`flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-[#0052CC] text-white' : 'text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            <List size={14} /> List
                          </button>
                        </div>
                      </div>

                      {/* Focus Mode */}
                      <button
                        onClick={toggleFocusMode}
                        className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-between ${isFocusModeOn ? 'bg-amber-50 text-amber-700' : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                      >
                        <span className="flex items-center gap-3"><Eye size={16} /> Focus Mode</span>
                        {isFocusModeOn && <span className="text-[9px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase">ON</span>}
                      </button>

                      {/* Export CSV */}
                      <button
                        onClick={() => { exportCSV(); setShowSettings(false); }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all flex items-center gap-3"
                      >
                        <Share2 size={16} /> Export Board as CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-semibold text-[#172B4D]">Sprint Board</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={16} />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[#F4F5F7] border-2 border-transparent rounded focus:bg-white focus:border-[#4C9AFF] transition-all outline-none text-sm w-64"
                  />
                </div>
                <button
                  onClick={() => navigate('/tasks/create')}
                  className="bg-[#0052CC] hover:bg-[#0747A6] text-white px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
                >
                  <Plus size={18} /> Create Issue
                </button>
              </div>
            </div>

            {/* Power Filters */}
            <div className="flex items-center gap-8 py-2 px-1 border-t border-[#DFE1E6] mt-2">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#5E6C84]" />
                <span className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">Power Filters:</span>
              </div>

              <div className="flex items-center gap-6">
                {/* Organization Filter */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-tighter">Organization</label>
                  <select
                    value={currentOrgId || ''}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setCurrentOrgId(newId);
                      localStorage.setItem('orgId', newId);
                      window.dispatchEvent(new Event('storage'));
                      setLoading(true);
                    }}
                    className="bg-transparent text-sm font-semibold text-[#172B4D] hover:bg-[#EBECF0] px-1 py-0.5 rounded cursor-pointer outline-none border-b-2 border-transparent focus:border-[#4C9AFF]"
                  >
                    {organizations.map(org => (
                      <option key={org.id || org.organization_id} value={org.id || org.organization_id}>
                        {org.organization_name || org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal Filter */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-tighter">Goal Hierarchy</label>
                  <select
                    value={goalFilter}
                    onChange={(e) => setGoalFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-[#172B4D] hover:bg-[#EBECF0] px-1 py-0.5 rounded cursor-pointer outline-none border-b-2 border-transparent focus:border-[#4C9AFF]"
                  >
                    <option value="all">All Goals</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>

                {/* Employee Filter */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold text-[#5E6C84] uppercase tracking-tighter">Employee</label>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-[#172B4D] hover:bg-[#EBECF0] px-1 py-0.5 rounded cursor-pointer outline-none border-b-2 border-transparent focus:border-[#4C9AFF]"
                  >
                    <option value="all">All Employees</option>
                    {members.map(m => (
                      <option key={m.user_id || m.id} value={m.user_id || m.id}>
                        {m.full_name || m.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ml-auto text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">
                Showing {filteredTasks.length} Live Tasks
              </div>
            </div>
          </div>
        </header>

        {/* Board */}
        <main className={`flex-1 overflow-x-auto p-6 min-h-0 bg-[#F4F5F7] ${viewMode === 'kanban' ? 'flex gap-4' : 'flex flex-col'}`}>
          {viewMode === 'list' ? (
            // --- LIST VIEW ---
            <div className="bg-white rounded-2xl border border-[#DFE1E6] shadow-sm overflow-hidden w-full">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6]">
                    {['Status', 'Issue ID', 'Title', 'Priority', 'Goal', 'Due Date'].map(h => (
                      <th key={h} className="py-4 px-6 text-[10px] font-black text-[#5E6C84] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE1E6]">
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan="6" className="py-20 text-center text-[#5E6C84] font-bold">No tasks found</td></tr>
                  ) : filteredTasks.map(task => (
                    <tr key={task.id} onClick={() => openTaskDrawer(task)} className="hover:bg-[#F4F5F7] cursor-pointer transition-all group">
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${task.status === 'done' ? 'bg-green-50 text-green-700' :
                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                            task.status === 'in_review' ? 'bg-purple-50 text-purple-700' :
                              'bg-gray-100 text-gray-600'
                          }`}>{task.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-4 px-6"><span className="text-[11px] font-bold text-[#5E6C84] bg-slate-100 px-2 py-1 rounded">GF-{task.id.substring(0, 4).toUpperCase()}</span></td>
                      <td className="py-4 px-6"><span className="font-semibold text-[#172B4D] group-hover:text-[#0052CC] text-sm transition-colors">{task.title}</span></td>
                      <td className="py-4 px-6"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${task.priority === 'urgent' ? 'bg-red-50 text-red-700' : task.priority === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>{task.priority}</span></td>
                      <td className="py-4 px-6"><span className="text-sm text-[#5E6C84]">{task.goal_details?.title || '—'}</span></td>
                      <td className="py-4 px-6"><span className="text-sm text-[#5E6C84]">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // --- KANBAN VIEW ---
            columns.map(column => {
              const isFocused = focusColumn === column.id;
              const isDimmed = isFocusModeOn && focusColumn && !isFocused;
              return (
                <div key={column.id} className={`w-[280px] shrink-0 flex flex-col bg-[#EBECF0] rounded-lg p-2 max-h-full transition-all duration-300 ${isDimmed ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
                  <div
                    onClick={() => isFocusModeOn && setFocusColumn(isFocused ? null : column.id)}
                    className={`flex items-center justify-between mb-3 px-2 pt-1 ${isFocusModeOn ? 'cursor-pointer' : ''}`}
                  >
                    <h3 className={`text-[11px] font-bold uppercase tracking-wider truncate ${isFocused ? 'text-[#0052CC]' : 'text-[#5E6C84]'}`}>
                      {column.title} <span className="ml-1 opacity-60">{filteredTasks.filter(t => t.status === column.id).length}</span>
                      {isFocusModeOn && <span className="ml-2 text-amber-500">{isFocused ? '🎯' : ''}</span>}
                    </h3>
                    <button className="text-[#5E6C84] hover:text-[#172B4D] p-1 rounded hover:bg-[#DFE1E6]">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredTasks.filter(t => t.status === column.id).map(task => (
                      <div
                        key={task.id}
                        onClick={() => openTaskDrawer(task)}
                        className="bg-white p-3 rounded shadow-sm border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-all cursor-pointer group relative"
                      >
                        {/* Top Row: Key and Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-sm ${task.issue_type === 'bug' ? 'bg-[#E54937]' : 'bg-[#4C9AFF]'} flex items-center justify-center text-[8px] text-white font-bold`}>
                              {task.issue_type?.[0].toUpperCase() || 'T'}
                            </div>
                            <span className="text-[11px] text-[#5E6C84] font-medium">GF-{task.id.substring(0, 3).toUpperCase()}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-[#FFEBE6] text-[#BF2600]' : 'bg-[#DEEBFF] text-[#0747A6]'}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="text-sm font-semibold text-[#172B4D] mb-3 leading-snug group-hover:text-[#0052CC] transition-colors">
                          {task.title}
                        </div>

                        {/* Goal and Meta */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {task.goal_details?.title && (
                            <div className="bg-[#EAE6FF] text-[#403294] text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                              <Target size={10} /> {task.goal_details.title.substring(0, 15)}...
                            </div>
                          )}
                          <span className="text-[10px] text-[#5E6C84] font-medium">BY: {task.creator_name || 'System'}</span>
                        </div>

                        {/* Bottom Row: Assignee and Status */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#F4F5F7]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                              {task.assignee_details?.[0]?.initial || '?'}
                            </div>
                            <span className="text-[11px] text-[#5E6C84] font-medium">{task.assignee_details?.[0]?.name || 'Unassigned'}</span>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {task.due_date && (
                              <span className="text-[10px] text-[#5E6C84] flex items-center gap-1">
                                <Clock size={10} /> {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <select
                              value={task.status}
                              disabled={!canEditStatus(task)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(task.id, e.target.value);
                              }}
                              className={`text-[10px] font-bold text-[#172B4D] bg-white border border-[#DFE1E6] hover:border-[#4C9AFF] px-2 py-1 rounded shadow-sm outline-none transition-all appearance-none ${!canEditStatus(task) ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
                            >
                              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => navigate(`/tasks/create?status=${column.id}`)}
                      className="w-full py-2 hover:bg-[#DFE1E6] rounded transition-all text-[#42526E] text-sm font-medium flex items-center gap-2 px-2"
                    >
                      <Plus size={16} /> Create Issue
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* Issue Details Sidebar/Drawer (Jira Style) */}
        {isDrawerOpen && selectedTask && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-[#091E42]/50" onClick={() => setIsDrawerOpen(false)} />
            <div className="relative w-[600px] bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <Activity size={16} />
                  <span>GF-{selectedTask.id.substring(0, 4).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteTask(selectedTask.id)} className="p-2 text-[#42526E] hover:bg-[#FFEBE6] hover:text-[#BF2600] rounded transition-all">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-[#42526E] hover:bg-[#EBECF0] rounded transition-all">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-medium text-[#172B4D] mb-4">{selectedTask.title}</h2>
                  <div className="flex gap-2">
                    <button className="bg-[#EBECF0] hover:bg-[#DFE1E6] px-3 py-1 rounded text-xs font-bold text-[#42526E] flex items-center gap-2 transition-all">
                      Attach
                    </button>
                    <button className="bg-[#EBECF0] hover:bg-[#DFE1E6] px-3 py-1 rounded text-xs font-bold text-[#42526E] flex items-center gap-2 transition-all">
                      Add child issue
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-[#172B4D]">Description</h3>
                      <div className="text-sm text-[#172B4D] whitespace-pre-wrap min-h-[100px] p-2 hover:bg-[#EBECF0] rounded cursor-pointer transition-all">
                        {selectedTask.description || "Add a description..."}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[#172B4D]">Activity</h3>
                      <form onSubmit={handleAddComment} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {currentUserId ? "U" : "?"}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full border-2 border-[#DFE1E6] rounded px-3 py-2 text-sm focus:border-[#4C9AFF] outline-none transition-all"
                          />
                          {newComment.trim() && (
                            <div className="flex gap-2">
                              <button type="submit" disabled={submittingComment} className="bg-[#0052CC] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#0747A6]">Save</button>
                              <button type="button" onClick={() => setNewComment('')} className="text-[#42526E] px-3 py-1.5 rounded text-sm font-medium hover:bg-[#EBECF0]">Cancel</button>
                            </div>
                          )}
                        </div>
                      </form>

                      <div className="space-y-6 pt-4">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[10px] font-bold text-[#42526E] shrink-0">
                              {c.user_name[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[#172B4D]">{c.user_name}</span>
                                <span className="text-xs text-[#5E6C84]">{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-[#172B4D] leading-relaxed">{c.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84] uppercase">Status</label>
                        <select
                          disabled={!canEditStatus(selectedTask)}
                          onChange={(e) => handleStatusUpdate(selectedTask.id, e.target.value)}
                          value={selectedTask.status}
                          className={`w-full bg-[#EBECF0] hover:bg-[#DFE1E6] text-sm font-bold text-[#42526E] rounded px-3 py-2 uppercase outline-none transition-all ${!canEditStatus(selectedTask) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84] uppercase">Assignee</label>
                        <div className="flex items-center gap-2 p-2 hover:bg-[#EBECF0] rounded cursor-pointer transition-all">
                          <div className="w-6 h-6 rounded-full bg-[#0052CC] flex items-center justify-center text-[10px] font-bold text-white">
                            {selectedTask.assignee_details?.[0]?.initial || '?'}
                          </div>
                          <span className="text-sm text-[#172B4D]">{selectedTask.assignee_details?.[0]?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84] uppercase">Priority</label>
                        <div className="flex items-center gap-2 p-2 hover:bg-[#EBECF0] rounded cursor-pointer transition-all">
                          {getPriorityIcon(selectedTask.priority)}
                          <span className="text-sm text-[#172B4D] capitalize">{selectedTask.priority}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5E6C84] uppercase">Goal</label>
                        <div className="flex items-center gap-2 p-2 hover:bg-[#EBECF0] rounded cursor-pointer transition-all">
                          <Target size={16} className="text-[#0052CC]" />
                          <span className="text-sm text-[#172B4D] truncate">{selectedTask.goal_details?.title || 'None'}</span>
                        </div>
                      </div>
                    </div>
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
