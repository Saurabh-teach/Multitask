import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Send, ChevronRight, 
  MessageSquare, Shield, Code, BarChart3, 
  User, Ghost, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

const JoinOrganization = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requestedRole: 'user',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrgDetails();
  }, [orgId]);

  const fetchOrgDetails = async () => {
    try {
      // Assuming a public endpoint or a list
      const res = await apiClient.get(`/organizations/`);
      const target = res.data.find(o => (o.id || o.organization_id) === orgId);
      setOrg(target);
    } catch (err) {
      toast.error("Could not find organization");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/join-requests/', {
        organization: orgId,
        requested_role: formData.requestedRole,
        message: formData.message
      });
      setStep(3); // Success state
    } catch (err) {
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (!org && step < 3) return <div className="h-screen flex items-center justify-center animate-pulse text-gray-400">Locating Organization...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-[#172B4D] p-12 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full transition-all">
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <Building2 size={40} className="text-[#172B4D]" />
             </div>
             <h1 className="text-3xl font-bold brand-font">{org?.name || 'Organization'}</h1>
             <p className="text-blue-200/60 text-sm font-medium tracking-wide">REQUEST TO JOIN WORKSPACE</p>
          </div>
        </div>

        <div className="p-12 space-y-8">
           {step === 1 && (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Your Target Role</label>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'user', label: 'Member', icon: <User size={16} /> },
                        { id: 'developer', label: 'Developer', icon: <Code size={16} /> },
                        { id: 'analyst', label: 'Analyst', icon: <BarChart3 size={16} /> },
                        { id: 'guest', label: 'Guest', icon: <Ghost size={16} /> },
                      ].map(role => (
                        <button
                          key={role.id}
                          onClick={() => setFormData({...formData, requestedRole: role.id})}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                            formData.requestedRole === role.id ? 'border-[#0052CC] bg-blue-50 text-[#0052CC]' : 'border-gray-50 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {role.icon} {role.label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2 pt-4">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Why do you want to join?</label>
                   <textarea 
                     className="input-premium py-4 min-h-[150px] resize-none"
                     placeholder="Tell the admin about your mission..."
                     value={formData.message}
                     onChange={(e) => setFormData({...formData, message: e.target.value})}
                   />
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-5 bg-[#0052CC] text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 group"
                >
                  Review Request <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center">
                   <h2 className="text-2xl font-bold text-[#172B4D]">Confirm Inquiry</h2>
                   <p className="text-gray-500 text-sm">Your request will be sent to the workspace admins.</p>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                   <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desired Role</span>
                      <span className="text-sm font-bold text-[#0052CC] uppercase">{formData.requestedRole}</span>
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Message</span>
                      <p className="text-sm text-[#42526E] leading-relaxed italic">"{formData.message || 'No message provided.'}"</p>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Edit</button>
                   <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="flex-[2] py-4 bg-[#172B4D] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2"
                   >
                     {loading ? 'Sending...' : 'Dispatch Request'} <Send size={16} />
                   </button>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={64} className="animate-bounce-short" />
                </div>
                <h2 className="text-4xl font-bold text-[#172B4D] brand-font">Request Sent!</h2>
                <p className="text-gray-500 max-w-xs mx-auto">The admins of <b>{org?.name}</b> have been notified. You will receive an alert once they review your inquiry.</p>
                
                <div className="pt-8">
                  <button onClick={() => navigate('/dashboard')} className="btn-primary py-4 px-12">Return Home</button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default JoinOrganization;
