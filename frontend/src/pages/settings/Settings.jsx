import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/layout/Sidebar';
import { 
  User, Building2, Shield, Bell, 
  Save, Camera, Globe, Mail, Phone,
  Briefcase, MapPin, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    city: '',
    bio: ''
  });
  const [organization, setOrganization] = useState({
    id: '',
    name: '',
    description: '',
    website: '',
    address: '',
    is_public: true
  });

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/auth/my-organizations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const currentOrg = res.data.organizations?.[0];
      if (currentOrg) {
        setProfile({
          first_name: currentOrg.first_name || '',
          last_name: currentOrg.last_name || '',
          email: currentOrg.email || '',
          phone: currentOrg.phone || '',
          job_title: currentOrg.job_title || '',
          department: currentOrg.department || '',
          city: currentOrg.city || '',
          bio: currentOrg.bio || ''
        });

        // Fetch full org details
        const orgRes = await axios.get(`http://127.0.0.1:8000/api/auth/organizations/${currentOrg.organization_id}/update/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setOrganization(orgRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://127.0.0.1:8000/api/auth/profile/', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleOrgSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://127.0.0.1:8000/api/auth/organizations/${organization.id}/update/`, 
        organization,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Organization updated!");
    } catch (err) {
      toast.error("Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) return (
    <div className="flex h-screen bg-[#f8fafc]">
       <Sidebar />
       <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold">Loading your preferences...</p>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />

      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Settings</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage your account and workspace</p>
            </div>
            <button 
              form={activeTab === 'profile' ? 'profile-form' : 'org-form'}
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5 px-8 text-sm flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto p-10 animate-fade-in">
          <div className="max-w-4xl mx-auto flex gap-10">
            
            {/* Sidebar Tabs */}
            <div className="w-64 shrink-0 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-500 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-slide-up">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                    <div className="flex items-center gap-8 mb-10">
                      <div className="relative group">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-gray-500 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                          <Camera size={16} />
                        </button>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{profile.job_title} • {profile.department}</p>
                      </div>
                    </div>

                    <form id="profile-form" onSubmit={handleProfileSave} className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">First Name</label>
                        <input 
                          type="text" 
                          value={profile.first_name}
                          onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                          className="w-full px-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                        <input 
                          type="text" 
                          value={profile.last_name}
                          onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                          className="w-full px-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="email" 
                            disabled
                            value={profile.email}
                            className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-gray-400 cursor-not-allowed font-medium text-sm" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={profile.phone}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">City / Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={profile.city}
                            onChange={(e) => setProfile({...profile, city: e.target.value})}
                            className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Job Title</label>
                        <div className="relative">
                          <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="text" 
                            value={profile.job_title}
                            onChange={(e) => setProfile({...profile, job_title: e.target.value})}
                            className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Department</label>
                        <input 
                          type="text" 
                          value={profile.department}
                          onChange={(e) => setProfile({...profile, department: e.target.value})}
                          className="w-full px-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                        />
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'organization' && (
                <div className="space-y-8 animate-slide-up">
                   <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-8 brand-font">Organization Details</h3>
                      <form id="org-form" onSubmit={handleOrgSave} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Organization Name</label>
                          <input 
                            type="text" 
                            value={organization.name}
                            onChange={(e) => setOrganization({...organization, name: e.target.value})}
                            className="w-full px-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Website</label>
                          <div className="relative">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="url" 
                              value={organization.website}
                              onChange={(e) => setOrganization({...organization, website: e.target.value})}
                              className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Description</label>
                          <textarea 
                            rows={4}
                            value={organization.description}
                            onChange={(e) => setOrganization({...organization, description: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-3xl focus:bg-white focus:border-blue-500 transition-all outline-none font-medium text-sm resize-none" 
                          />
                        </div>
                      </form>
                   </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 animate-slide-up">
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 brand-font">Security & Privacy</h3>
                    <p className="text-sm text-gray-500 mb-8">Manage your password and security preferences.</p>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm">
                               <Shield size={24} />
                            </div>
                            <div>
                               <p className="font-bold text-gray-900">Change Password</p>
                               <p className="text-[12px] text-gray-500">Last changed 3 months ago</p>
                            </div>
                         </div>
                         <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Update</button>
                      </div>

                      <div className="p-6 border-2 border-dashed border-red-100 rounded-3xl space-y-4">
                         <h4 className="text-red-600 font-bold flex items-center gap-2">
                            <Trash2 size={18} /> Danger Zone
                         </h4>
                         <p className="text-sm text-gray-500">Permanently delete your account and all associated data. This action cannot be undone.</p>
                         <button className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-600 hover:text-white transition-all">Delete Account</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
