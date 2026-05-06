import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Target, Loader2, CheckCircle2, ArrowRight, X } from 'lucide-react';

const JoinWorkspace = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    handleJoin();
  }, [token]);

  const handleJoin = async () => {
    try {
      const activeToken = localStorage.getItem('token');
      if (!activeToken) {
          // If not logged in, take them to signup but remember the invite
          localStorage.setItem('pendingInvite', token);
          navigate('/register');
          return;
      }

      const res = await axios.post(`http://127.0.0.1:8000/api/auth/join-workspace/${token}/`, 
        {},
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );
      
      localStorage.setItem('orgId', res.data.organization_id);
      setStatus('success');
      toast.success(res.data.message);
    } catch (err) {
      setStatus('error');
      toast.error(err.response?.data?.error || "Invalid or expired invitation link.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100 animate-fade-in">
        <div className="flex justify-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Target size={28} />
          </div>
        </div>

        {status === 'verifying' && (
          <div className="space-y-4">
             <Loader2 size={40} className="mx-auto text-blue-600 animate-spin" />
             <h2 className="text-2xl font-bold text-gray-900 brand-font">Verifying your invite...</h2>
             <p className="text-gray-500 font-medium">Please wait while we set up your workspace access.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
             <CheckCircle2 size={60} className="mx-auto text-green-500" />
             <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 brand-font">Welcome to the Team!</h2>
                <p className="text-gray-500 font-medium">You've successfully joined the workspace. Ready to get started?</p>
             </div>
             <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full py-4 text-lg"
             >
                Enter Dashboard <ArrowRight size={20} />
             </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
             <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <X size={40} />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 brand-font">Invite Expired</h2>
                <p className="text-gray-500 font-medium">This invitation link is no longer valid. Please ask your admin for a new one.</p>
             </div>
             <button 
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-4 text-lg"
             >
                Back to Login
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinWorkspace;
