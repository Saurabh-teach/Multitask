import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Mail, Shield, Code, BarChart3, 
  User, Ghost, MessageSquare, Eye, Send, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  Building, Sparkles
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

const InvitationWizard = () => {
  const [step, setStep] = useState(1);
  const { currentOrgId } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('Your Organization');

  // Fetch org name dynamically
  useEffect(() => {
    const orgId = currentOrgId || localStorage.getItem('orgId');
    if (!orgId) return;
    apiClient.get('my-organizations/')
      .then(res => {
        const orgs = res.data.organizations || [];
        const match = orgs.find(o => (o.id || o.organization_id) === orgId);
        if (match) setOrgName(match.organization_name || match.name || 'Your Organization');
      })
      .catch(() => {});
  }, [currentOrgId]);

  const roles = [
    { id: 'owner', label: 'Owner', icon: <Shield size={20} />, desc: 'Full workspace ownership and billing.', color: 'text-purple-600 bg-purple-50' },
    { id: 'admin', label: 'Admin', icon: <Shield size={20} />, desc: 'Can manage members and all settings.', color: 'text-red-600 bg-red-50' },
    { id: 'developer', label: 'Developer', icon: <Code size={20} />, desc: 'Technical access to goals and tasks.', color: 'text-blue-600 bg-blue-50' },
    { id: 'analyst', label: 'Analyst', icon: <BarChart3 size={20} />, desc: 'Focus on data, reports and strategy.', color: 'text-emerald-600 bg-emerald-50' },
    { id: 'user', label: 'User', icon: <User size={20} />, desc: 'Standard member for daily operations.', color: 'text-indigo-600 bg-indigo-50' },
    { id: 'guest', label: 'Guest', icon: <Ghost size={20} />, desc: 'Limited view for external partners.', color: 'text-amber-600 bg-amber-50' },
  ];

  const handleNext = () => {
    if (step === 1 && (!formData.email || !formData.firstName)) {
      return toast.error("Please fill in the identity details.");
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);

    // Use AuthContext value OR fall back to localStorage
    const orgId = currentOrgId || localStorage.getItem('orgId');

    if (!orgId) {
      toast.error("No active organization found. Please select a workspace first.");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('invitations/', {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        organization: orgId,
        role: formData.role,
        message: formData.message
      });

      if (response.data.warning === 'email_failed') {
        toast.error("Invitation saved, but email delivery failed. Please check SMTP configuration.");
      } else {
        toast.success("Invitation dispatched successfully!");
      }
      setStep(5); // Success state
    } catch (err) {
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail
        || JSON.stringify(err.response?.data)
        || "Failed to send invitation";
      toast.error(errorMsg);
      console.error("Invitation error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-12 px-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-sm ${
            step >= i ? 'bg-[#0052CC] text-white scale-110 shadow-[#0052CC]/20' : 'bg-gray-100 text-gray-400'
          }`}>
            {step > i ? <CheckCircle2 size={18} /> : i}
          </div>
          {i < 4 && <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-700 ${step > i ? 'bg-[#0052CC]' : 'bg-gray-100'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto py-10 px-10 pb-16 flex flex-col items-center">
          
          <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 p-12 relative border border-gray-100 mb-10">
            {/* Background Decorative Gradient */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60" />
            
            {step < 5 && renderStepIndicator()}

            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 text-[#0052CC] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-[#172B4D] brand-font mb-2">Invite New Talent</h2>
                  <p className="text-gray-500">Who would you like to welcome to the workspace?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">First Name</label>
                    <input 
                      type="text" 
                      className="input-premium py-4" 
                      placeholder="e.g. John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                    <input 
                      type="text" 
                      className="input-premium py-4" 
                      placeholder="e.g. Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Professional Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      className="input-premium py-4 pl-12" 
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-[#172B4D] brand-font mb-2">Select Access Role</h2>
                  <p className="text-gray-500">Define the permissions for this new member.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setFormData({...formData, role: r.id})}
                      className={`p-5 rounded-2xl border-2 text-left transition-all group ${
                        formData.role === r.id 
                          ? 'border-[#0052CC] bg-blue-50/50 shadow-lg shadow-blue-500/5' 
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${r.color}`}>
                        {r.icon}
                      </div>
                      <h4 className="font-bold text-[#172B4D] mb-1">{r.label}</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Custom Message */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-[#172B4D] brand-font mb-2">Personalize Invitation</h2>
                  <p className="text-gray-500">Write a custom message to make them feel welcome.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Your Message</label>
                  <textarea 
                    className="input-premium py-4 min-h-[200px] resize-none" 
                    placeholder={`Hi ${formData.firstName || 'there'},\n\nWe would love to have you join our organization as a ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}...`}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                  <p className="text-[10px] text-right text-gray-400 font-bold uppercase tracking-widest">
                    {formData.message.length} / 500 Characters
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {step === 4 && (
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-[#172B4D] brand-font mb-2">Live Invitation Preview</h2>
                  <p className="text-gray-500">This is exactly what {formData.firstName} will see.</p>
                </div>

                {/* The "Invitation Card" Preview */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl max-w-sm mx-auto">
                   <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex items-start justify-between">
                     <div className="text-white font-bold text-sm opacity-80">{orgName}</div>
                     <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                   </div>
                   <div className="px-8 pb-8 -mt-8">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-6 mx-auto">
                        <div className="w-12 h-12 bg-[#0052CC] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                          {formData.firstName[0]?.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-bold text-[#172B4D]">Join {orgName}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          You've been invited to join as a <span className="font-bold text-[#0052CC] uppercase">{formData.role}</span>
                        </p>
                        
                        <div className="py-4 px-5 bg-gray-50 rounded-2xl border border-gray-100 italic text-[11px] text-gray-600 text-left">
                           "{formData.message || 'We would like to invite you to join our organization...'}"
                        </div>

                        <div className="flex gap-2 pt-2">
                           <div className="flex-1 py-2.5 bg-[#0052CC] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Accept</div>
                           <div className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Decline</div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={64} className="animate-bounce-short" />
                </div>
                <h2 className="text-4xl font-bold text-[#172B4D] brand-font">Invitation Sent!</h2>
                <p className="text-gray-500 max-w-xs mx-auto">We've dispatched your personalized invite to <b>{formData.email}</b>. They can join as soon as they accept.</p>
                
                <div className="pt-8 flex flex-col gap-3">
                  <button 
                    onClick={() => { setStep(1); setFormData({ firstName: '', lastName: '', email: '', role: 'user', message: '' }); }}
                    className="btn-primary py-4 w-full"
                  >
                    Invite Another
                  </button>
                  <button 
                    onClick={() => navigate('/members')}
                    className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-[#0052CC] transition-all"
                  >
                    Return to Team List
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            {step < 5 && (
              <div className="flex justify-between items-center mt-12 pt-10 border-t border-gray-50">
                <button 
                  onClick={step === 1 ? () => navigate(-1) : handleBack}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-700 font-bold text-xs uppercase tracking-widest transition-all"
                >
                  <ChevronLeft size={16} /> {step === 1 ? 'Cancel' : 'Previous'}
                </button>

                <button 
                  onClick={step === 4 ? handleSubmit : handleNext}
                  disabled={loading}
                  className="flex items-center gap-3 bg-[#172B4D] text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#0052CC] transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (step === 4 ? 'Confirm & Send' : 'Continue')}
                  {step < 4 ? <ChevronRight size={16} /> : <Send size={16} />}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvitationWizard;
