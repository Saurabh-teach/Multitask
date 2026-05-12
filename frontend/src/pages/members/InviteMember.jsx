import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  UserPlus, Mail, Shield, ArrowLeft, 
  CheckCircle2, Send, Zap, Copy, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InviteMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    role: 'user'
  });

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orgRes = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgId = orgRes.data.organizations?.[0]?.organization_id;
      
      const res = await axios.post(`http://127.0.0.1:8000/api/auth/organizations/${orgId}/invite/generate/`, { role: formData.role }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInviteLink(res.data.invite_link);
      toast.success("Sharable link generated!");
    } catch (err) {
      toast.error("Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied to clipboard!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const activeOrgId = localStorage.getItem('orgId');

      if (!activeOrgId) {
        toast.error("Please select an organization first.");
        return;
      }

      await axios.post('http://127.0.0.1:8000/api/auth/invitations/', {
        email: formData.email,
        organization: activeOrgId,
        role: formData.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Invitation sent successfully!");
      setFormData({...formData, email: ''});
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send invitation";
      toast.error(msg);
    } finally {
      setLoading(false);
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
                onClick={() => navigate('/members')}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Expand Your Team</h1>
            </div>
          </div>
        </nav>

        <div className="flex-1 p-10 animate-fade-in">
          <div className="max-w-2xl mx-auto mt-10">
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-12 text-white relative">
                   <div className="absolute top-0 right-0 p-10 opacity-10">
                      <UserPlus size={160} />
                   </div>
                   <div className="relative z-10">
                      <h2 className="text-4xl font-bold brand-font mb-4">Invite Collaborators</h2>
                      <p className="text-blue-100/80 text-lg font-medium max-w-md">Grow your workspace and execute faster by bringing your team together.</p>
                   </div>
                </div>

                <div className="p-12 space-y-12">
                   {/* Share Link Section */}
                   <div className="space-y-4">
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                         <LinkIcon size={14} /> Quick Share Link
                      </label>
                      {!inviteLink ? (
                        <button 
                          onClick={handleGenerateLink}
                          disabled={loading}
                          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap size={18} /> Generate sharable invite link
                        </button>
                      ) : (
                        <div className="flex gap-2">
                           <input 
                             readOnly 
                             value={inviteLink} 
                             className="flex-1 bg-gray-50 border border-gray-100 px-4 py-4 rounded-2xl font-medium text-sm text-gray-600 outline-none" 
                           />
                           <button 
                             onClick={copyToClipboard}
                             className="bg-blue-600 text-white px-6 rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/20"
                           >
                             <Copy size={18} /> Copy
                           </button>
                        </div>
                      )}
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or invite via email</span>
                      <div className="flex-1 h-px bg-gray-100" />
                   </div>

                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <Mail size={14} /> Professional Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="input-premium py-4"
                          placeholder="colleague@company.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <Shield size={14} /> Workspace Access Role
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                           {[
                             { id: 'user', title: 'Regular User', desc: 'Can view and update tasks assigned to them.' },
                             { id: 'admin', title: 'Administrator', desc: 'Full control over settings, members, and all data.' }
                           ].map(role => (
                             <button
                               key={role.id}
                               type="button"
                               onClick={() => setFormData({...formData, role: role.id})}
                               className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${formData.role === role.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-50 hover:border-gray-200'}`}
                             >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.role === role.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                   {formData.role === role.id && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <div>
                                   <p className={`font-bold ${formData.role === role.id ? 'text-blue-600' : 'text-gray-900'}`}>{role.title}</p>
                                   <p className="text-xs text-gray-400 font-medium">{role.desc}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="pt-6">
                         <button
                           type="submit"
                           disabled={loading}
                           className="btn-primary w-full py-5 text-xl shadow-xl shadow-blue-500/20"
                         >
                           {loading ? "Sending Invitation..." : "Send Invitation"}
                           {!loading && <Send size={24} />}
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

export default InviteMember;
