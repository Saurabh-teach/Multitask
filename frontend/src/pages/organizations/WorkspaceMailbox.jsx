import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { 
  Mail, Inbox, CheckCircle2, XCircle, 
  User, Clock, Filter, Search, ArrowLeft,
  ChevronRight, MessageSquare
} from 'lucide-react';

const WorkspaceMailbox = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { currentOrgId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentOrgId) {
      fetchRequests();
    }
  }, [currentOrgId, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/requests/?org_id=${currentOrgId}`);
      // Handle both paginated and non-paginated DRF responses
      const data = res.data.results || res.data;
      const filtered = Array.isArray(data) ? data.filter(r => r.status === activeTab) : [];
      setRequests(filtered);
    } catch (err) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await apiClient.post(`/requests/${id}/${action}/`);
      toast.success(`Request ${action}ed!`);
      fetchRequests();
    } catch (err) {
      toast.error(`Action failed: ${err.response?.data?.error || 'Server error'}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F5F7] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-[#DFE1E6] sticky top-0 z-40">
          <div className="px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/members')}
                className="p-2 text-[#5E6C84] hover:bg-[#EBECF0] rounded transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-xl font-bold text-[#172B4D]">Organization Mailbox</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5E6C84]" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter inquiries..." 
                  className="pl-9 pr-4 py-1.5 bg-[#F4F5F7] border border-[#DFE1E6] rounded focus:bg-white focus:border-[#4C9AFF] transition-all outline-none text-xs w-48"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="px-10 py-8 max-w-5xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-8 border-b border-[#DFE1E6] mb-8">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize relative transition-all ${activeTab === tab ? 'text-[#0052CC]' : 'text-[#5E6C84] hover:text-[#172B4D]'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0052CC]" />}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white rounded border border-[#DFE1E6] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map(req => (
                  <div key={req.id} className="bg-white rounded border border-[#DFE1E6] hover:shadow-md transition-all group overflow-hidden">
                    <div className="p-6 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#DEEBFF] text-[#0747A6] flex items-center justify-center font-bold text-lg">
                          {req.user_name?.[0]?.toUpperCase() || <User size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#172B4D]">{req.user_name || 'Anonymous User'}</h3>
                            <span className="text-xs text-[#5E6C84]">({req.user_email})</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#5E6C84]">
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(req.requested_at).toLocaleString()}</span>
                            <span className="flex items-center gap-1 font-bold text-[#0052CC] bg-[#E3FCEF] px-1.5 py-0.5 rounded uppercase text-[10px]">Requested: {req.requested_role}</span>
                          </div>
                          
                          {req.message && (
                            <div className="mt-4 p-4 bg-[#F4F5F7] rounded-xl border-l-4 border-[#0052CC] shadow-sm">
                              <p className="text-[11px] font-black text-[#5E6C84] uppercase tracking-widest mb-2 flex items-center gap-2">
                                <MessageSquare size={12} /> Inquiry Message
                              </p>
                              <p className="text-sm text-[#172B4D] leading-relaxed">"{req.message}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {activeTab === 'pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(req.id, 'reject')}
                            className="p-2 text-[#DE350B] hover:bg-[#FFEBE6] rounded transition-all flex items-center gap-2 text-xs font-bold uppercase"
                          >
                            <XCircle size={16} /> Decline
                          </button>
                          <button 
                            onClick={() => handleAction(req.id, 'approve')}
                            className="bg-[#0052CC] text-white px-4 py-2 rounded font-bold hover:bg-[#0747A6] transition-all flex items-center gap-2 text-xs uppercase"
                          >
                            <CheckCircle2 size={16} /> Approve Access
                          </button>
                        </div>
                      )}

                      {activeTab !== 'pending' && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${activeTab === 'approved' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#FFEBE6] text-[#BF2600]'}`}>
                          {activeTab}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-[#DFE1E6]">
                  <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox size={32} className="text-[#C1C7D0]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#172B4D]">Your mailbox is clear</h3>
                  <p className="text-[#5E6C84] text-sm mt-1">No pending inquiries for this organization.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMailbox;
