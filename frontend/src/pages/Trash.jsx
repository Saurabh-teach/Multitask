import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar';
import { Trash2, RotateCcw, AlertCircle, Clock } from 'lucide-react';

const Trash = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const orgId = localStorage.getItem('orgId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchTrash();
    }, [orgId]);

    const fetchTrash = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/trash/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (err) {
            toast.error('Failed to load trash');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (taskId) => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/auth/tasks/${taskId}/restore/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Task restored');
            fetchTrash();
        } catch (err) {
            toast.error('Failed to restore task');
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar />
            <div className="flex-1 ml-72 overflow-y-auto">
                <div className="px-10 py-10 max-w-7xl mx-auto space-y-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                           <Trash2 className="text-red-500" size={32} />
                           Trash Bin
                        </h1>
                        <p className="text-gray-500 mt-2">Recover tasks that were recently deleted.</p>
                    </div>

                    {loading ? (
                        <div className="text-center py-20">Loading trash...</div>
                    ) : tasks.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50">
                                {tasks.map(task => (
                                    <div key={task.id} className="px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{task.title}</h3>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mt-1">Deleted {new Date(task.updated_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRestore(task.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                                        >
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100">
                            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Trash is empty</h3>
                            <p className="text-gray-500">Deleted tasks will appear here for recovery.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Trash;
