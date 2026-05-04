import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  Building, Globe, MapPin, AlignLeft, 
  ArrowLeft, CheckCircle2, Target, Plus,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateOrganization = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/auth/organizations/create/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Workspace created successfully!");
      navigate('/organizations');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to establish workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-y-auto">
        {/* Modern Top Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/organizations')}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">New Workspace</h1>
            </div>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-widest">
               <ShieldCheck size={16} /> Secure Configuration
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 p-10 animate-fade-in">
          <div className="max-w-3xl mx-auto">
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Target size={160} />
                   </div>
                   <div className="relative z-10">
                      <h2 className="text-4xl font-bold brand-font mb-4">Establish your team</h2>
                      <p className="text-blue-100/80 text-lg font-medium max-w-md">Define your organization's presence and start collaborating on strategic milestones today.</p>
                   </div>
                </div>

                <div className="p-12">
                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <Building size={14} /> Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="input-premium py-4"
                          placeholder="e.g. Acme Corporation"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <AlignLeft size={14} /> Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows="3"
                          className="input-premium py-4"
                          placeholder="Briefly describe your organization's mission..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <MapPin size={14} /> Headquarters City
                           </label>
                           <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              className="input-premium py-4"
                              placeholder="e.g. San Francisco"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              <Globe size={14} /> Corporate Website
                           </label>
                           <input
                              type="url"
                              name="website"
                              value={formData.website}
                              onChange={handleChange}
                              className="input-premium py-4"
                              placeholder="https://acme.inc"
                           />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                           <MapPin size={14} /> Operational Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          rows="2"
                          className="input-premium py-4"
                          placeholder="Full street address..."
                        />
                      </div>

                      <div className="pt-6">
                         <button
                           type="submit"
                           disabled={loading}
                           className="btn-primary w-full py-5 text-xl shadow-xl shadow-blue-500/20"
                         >
                           {loading ? "Establishing Workspace..." : "Create Workspace"}
                           {!loading && <Plus size={24} />}
                         </button>
                      </div>
                   </form>
                </div>
             </div>

             <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                   <div className="p-2 bg-white rounded-lg"><CheckCircle2 size={16} className="text-blue-600" /></div>
                   No Credit Card Required
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                   <div className="p-2 bg-white rounded-lg"><CheckCircle2 size={16} className="text-blue-600" /></div>
                   Unlimited Team Members
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                   <div className="p-2 bg-white rounded-lg"><CheckCircle2 size={16} className="text-blue-600" /></div>
                   Enterprise Encryption
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganization;