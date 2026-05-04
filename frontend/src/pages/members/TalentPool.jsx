import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Briefcase, Mail, MapPin, Search, ArrowRight } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';

const TalentPool = () => {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTalent();
  }, []);

  const fetchTalent = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/auth/talent-pool/');
      setTalent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-y-auto">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900 brand-font tracking-tight">Global Talent Pool</h1>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-100">
               {talent.length} Available for Hire
            </div>
          </div>
        </nav>

        <div className="p-10 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {talent.map(person => (
                <div key={person.id} className="card-premium p-8 hover:scale-[1.02] transition-all group">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-[2rem] flex items-center justify-center text-gray-500 font-bold text-2xl group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-inner">
                      {person.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{person.full_name || person.username}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mt-1">
                        <Briefcase size={14} /> {person.job_title || 'Expert Professional'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-500 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Mail size={16} className="text-blue-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <MapPin size={16} className="text-blue-500" />
                      <span>Remote / Available</span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group-hover:shadow-xl shadow-gray-900/10">
                    Send Hiring Invitation <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentPool;
