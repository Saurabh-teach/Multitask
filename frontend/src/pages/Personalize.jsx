import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Target, ArrowRight, Code, Briefcase, Palette, Users, ShieldCheck, Zap } from 'lucide-react';

const roles = [
  { id: 'Developer', label: 'Developer', icon: Code, color: 'bg-blue-50 text-blue-600' },
  { id: 'Product Manager', label: 'Product Manager', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'Designer', label: 'Designer', icon: Palette, color: 'bg-pink-50 text-pink-600' },
  { id: 'HR', label: 'HR / People', icon: Users, color: 'bg-green-50 text-green-600' },
  { id: 'QA Engineer', label: 'QA Engineer', icon: ShieldCheck, color: 'bg-amber-50 text-amber-600' },
  { id: 'Executive', label: 'Executive', icon: Zap, color: 'bg-purple-50 text-purple-600' },
];

const Personalize = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/auth/personalize-profile/', 
        { job_title: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Profile updated!");
      navigate('/invite-team');
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_bottom_right,theme(colors.indigo.50),transparent)]" />
      
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100 animate-fade-in">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Target size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900 brand-font">GoalFlow</span>
        </div>

        <div className="space-y-2 mb-10">
            <h2 className="text-3xl font-bold text-gray-900 brand-font">What is your role?</h2>
            <p className="text-gray-500 font-medium">We'll tailor your experience based on what you do.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${
                selectedRole === role.id 
                  ? 'border-blue-600 bg-blue-50/30 shadow-md' 
                  : 'border-gray-50 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.color}`}>
                <role.icon size={24} />
              </div>
              <span className="font-bold text-sm text-gray-700">{role.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="btn-primary w-full py-4 text-lg"
        >
          {loading ? "Saving..." : "Continue to Team Setup"}
          {!loading && <ArrowRight size={20} />}
        </button>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Step 3 of 4</p>
        </div>
      </div>
    </div>
  );
};

export default Personalize;
