import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Target, ArrowRight, Mail, Plus, X } from 'lucide-react';

const InviteTeam = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState(['']);
  const [invites, setInvites] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orgId = localStorage.getItem('orgId');
      
      const validEmails = emails.filter(e => e.trim() !== '');
      
      if (validEmails.length > 0) {
        const res = await axios.post('http://127.0.0.1:8000/api/auth/invite-team/', 
          { 
            emails: validEmails,
            organization_id: orgId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Save the generated tokens for display
        setInvites(res.data.tokens || []);
        setShowSuccess(true);
        toast.success("Invitations generated!");
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error("Invitation failed, but your workspace is ready!");
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (token) => {
    const link = `http://localhost:3000/join/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 brand-font mb-2">Team Invites Ready!</h2>
          <p className="text-gray-500 mb-8">Copy these links to test your teammates' join flow.</p>
          
          <div className="space-y-3 mb-10 text-left">
            {emails.filter(e => e.trim() !== '').map((email, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{email}</p>
                  <p className="text-sm font-medium text-gray-600 truncate max-w-[200px]">
                    .../join/{invites[idx]?.token || 'generating...'}
                  </p>
                </div>
                <button 
                  onClick={() => copyToClipboard(invites[idx]?.token)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all"
                >
                  Copy Link
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 text-lg">
            Go to Dashboard <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_top_right,theme(colors.blue.50),transparent)]" />
      
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100 animate-fade-in text-center">
        <div className="flex justify-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Target size={28} />
          </div>
        </div>

        <div className="space-y-2 mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 brand-font">Invite your teammates</h2>
            
            <div className="flex items-center gap-2 my-6">
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="flex-1 h-1.5 bg-blue-600 rounded-full"></div>
            </div>
            
            <p className="text-gray-500 font-medium text-sm">Step 4: GoalFlow is better together. Add your team to get started.</p>
        </div>

        <div className="space-y-3 mb-10">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2 animate-slide-up">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="input-premium pl-12"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                />
              </div>
              {emails.length > 1 && (
                <button 
                  onClick={() => handleRemoveEmail(index)}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          
          <button 
            onClick={handleAddEmail}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl border-2 border-dashed border-blue-200 transition-all"
          >
            <Plus size={16} /> Add another email
          </button>
        </div>

        <div className="flex flex-col gap-3">
            <button
              onClick={handleFinish}
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? "Sending invites..." : "Complete Setup"}
              {!loading && <ArrowRight size={20} />}
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-all mt-2"
            >
              Skip for now
            </button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
             <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Step 4 of 4</p>
        </div>
      </div>
    </div>
  );
};

export default InviteTeam;
