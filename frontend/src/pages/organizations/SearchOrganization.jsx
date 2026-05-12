import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import apiClient from '../../api/client';
import { Search, Building2, Send, ArrowRight, UserPlus, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const SearchOrganization = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.length < 3) return;
    
    setLoading(true);
    try {
      const res = await apiClient.get(`search-organizations/?query=${query}`);
      setResults(res.data);
    } catch (err) {
      toast.error("Failed to search organizations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 ml-72 p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <header className="space-y-2">
            <h1 className="text-4xl font-bold text-[#172B4D] brand-font">Discover Workspaces</h1>
            <p className="text-gray-500 font-medium">Search for an organization by name or workspace email to request access.</p>
          </header>

          <form onSubmit={handleSearch} className="relative group max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Enter organization name or email..."
              className="w-full pl-14 pr-32 py-5 bg-white border border-gray-200 rounded-[1.5rem] shadow-xl shadow-blue-900/5 outline-none focus:border-blue-600 transition-all text-lg font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-[#172B4D] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-blue-600 transition-all"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((org) => (
              <div 
                key={org.id} 
                className="card-premium p-8 flex flex-col justify-between group hover:border-blue-600 transition-all cursor-pointer"
                onClick={() => navigate(`/organizations/${org.id}/join`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    {org.name[0].toUpperCase()}
                  </div>
                  <div className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-1">
                    <Globe size={10} /> Public
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#172B4D]">{org.name}</h3>
                  <p className="text-sm text-gray-400 font-medium truncate">{org.email}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <UserPlus size={14} /> Request to Join
                  </span>
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            ))}

            {!loading && query.length >= 3 && results.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Building2 size={32} />
                </div>
                <p className="text-gray-400 font-medium italic">No workspaces found matching "{query}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOrganization;
