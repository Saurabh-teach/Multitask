import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, ArrowRight, Target } from 'lucide-react';

const SetupWorkspace = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://127.0.0.1:8000/api/auth/setup-workspace/', 
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      localStorage.setItem('orgId', res.data.organization_id);
      toast.success("Workspace ready! Now, let's personalize.");
      navigate('/personalize');
    } catch (err) {
      toast.error(err.response?.data?.error || "Setup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_top_left,theme(colors.blue.50),transparent)]" />
      
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100 animate-fade-in">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Target size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900 brand-font">GoalFlow</span>
        </div>

        <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 brand-font">Name your workspace</h2>
            
            <div className="flex items-center gap-2 my-6">
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full"></div>
            </div>
            
            <p className="text-gray-500 font-medium text-sm">Step 2: This is where your team will collaborate on goals.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Workspace Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="e.g. Acme Engineering or Product Hub"
                className="input-premium pl-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg"
          >
            {loading ? "Setting up..." : "Create Workspace"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Step 2 of 4</p>
        </div>
      </div>
    </div>
  );
};

export default SetupWorkspace;
