import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar';
import { 
  BarChart3, PieChart, TrendingUp, CheckCircle2, 
  Clock, AlertCircle, Calendar, Users, 
  ArrowUpRight, ArrowDownRight, Activity, Target
} from 'lucide-react';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const orgId = localStorage.getItem('orgId');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get(`/organizations/${orgId}/dashboard/`);
                setStats(res.data);
            } catch (err) {
                console.error('Reports sync error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [orgId]);

    const exportToPDF = () => {
        const element = document.getElementById('report-content');
        if (!element) return;
        const opt = {
            margin:       0.5,
            filename:     'GoalFlow_Intelligence_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        toast.loading('Generating PDF...', { id: 'pdf' });
        html2pdf().set(opt).from(element).save().then(() => {
            toast.success('PDF Downloaded!', { id: 'pdf' });
        }).catch((err) => {
            console.error('PDF Error:', err);
            toast.error('Failed to generate PDF', { id: 'pdf' });
        });
    };

    const shareReport = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => toast.success('Report link copied to clipboard!'))
            .catch(() => toast.error('Failed to copy link'));
    };

    const MetricCard = ({ title, value, sub, icon: Icon, color, trend }) => (
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 group">
          <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${color.bg} ${color.text} rounded-2xl flex items-center justify-center shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
              </div>
              {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                   {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                   {Math.abs(trend)}%
                </div>
              )}
          </div>
          <h3 className="text-4xl font-black text-gray-900 tracking-tight">{value}</h3>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">{title}</p>
          <p className="text-[10px] text-gray-300 font-medium mt-1">{sub}</p>
      </div>
    );

    if (loading) return (
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Compiling Workspace Metrics...</p>
        </div>
      </div>
    );

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 ml-72 overflow-y-auto">
                <div className="px-12 py-12 max-w-7xl mx-auto space-y-12">
                    <header className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 text-blue-600 mb-2">
                               <Activity size={20} />
                               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Performance Analytics</span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Intelligence Reports</h1>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={exportToPDF} className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Export PDF</button>
                           <button onClick={shareReport} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">Share Report</button>
                        </div>
                    </header>

                    <div id="report-content" className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <MetricCard 
                          title="Strategic Goals" 
                          value={stats?.activeGoals || 0} 
                          sub="Active high-level initiatives"
                          icon={Target}
                          color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                          trend={12}
                        />
                        <MetricCard 
                          title="Execution Rate" 
                          value={`${stats?.completion || 0}%`} 
                          sub="Task completion velocity"
                          icon={TrendingUp}
                          color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                          trend={5}
                        />
                        <MetricCard 
                          title="Pending Objectives" 
                          value={stats?.openTasks || 0} 
                          sub="Operational items in queue"
                          icon={Clock}
                          color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                        />
                        <MetricCard 
                          title="Resource Capacity" 
                          value={stats?.teamMembers || 0} 
                          sub="Total active contributors"
                          icon={Users}
                          color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                          trend={-2}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                   <PieChart size={24} className="text-blue-600" />
                                   Workspace Velocity
                                </h3>
                                <p className="text-xs text-gray-400 font-medium mb-10">Real-time breakdown of objective completion status.</p>
                                
                                <div className="flex items-end justify-between mb-4">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion Index</span>
                                   <span className="text-2xl font-black text-blue-600">{stats?.completion}%</span>
                                </div>
                                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${stats?.completion || 0}%` }} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-10">
                                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Achieved</p>
                                      <p className="text-lg font-black text-blue-900">{stats?.completion}%</p>
                                   </div>
                                   <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gap</p>
                                      <p className="text-lg font-black text-gray-600">{100 - (stats?.completion || 0)}%</p>
                                   </div>
                                </div>
                            </div>
                            {/* Decorative background shape */}
                            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-50 rounded-full opacity-50 blur-3xl" />
                        </div>

                        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
                           <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-3">
                              <BarChart3 size={24} className="text-emerald-600" />
                              Efficiency Benchmarks
                           </h3>
                           <p className="text-xs text-gray-400 font-medium mb-10">Weekly comparison of team throughput vs. targets.</p>
                           
                           <div className="space-y-6">
                              {[
                                { label: 'Goal Alignment', val: 85, color: 'bg-blue-600' },
                                { label: 'Task Throughput', val: 62, color: 'bg-emerald-600' },
                                { label: 'Collaboration Index', val: 94, color: 'bg-indigo-600' },
                                { label: 'Deadline Compliance', val: 78, color: 'bg-amber-600' },
                              ].map((bar, i) => (
                                <div key={i}>
                                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                      <span className="text-gray-500">{bar.label}</span>
                                      <span className="text-gray-900">{bar.val}%</span>
                                   </div>
                                   <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                      <div className={`h-full ${bar.color} rounded-full transition-all duration-1000 delay-${i*200}`} style={{ width: `${bar.val}%` }} />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
