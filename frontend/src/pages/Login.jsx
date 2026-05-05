import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Target, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', formData);
      const { phone, dev_otp, token, step } = response.data;
      
      if (step === 'dashboard' && token) {
        toast.success("Welcome back!");
        // Commit session first
        login(token);
        // Small delay to ensure state propagates
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
        return;
      }

      if (dev_otp) {
        toast.success(`Dev Mode: Your OTP is ${dev_otp}`, { duration: 10000, icon: '🔑' });
      } else {
        toast.success("OTP sent to your phone!");
      }
      navigate('/verify-otp', { state: { phone, dev_otp } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_top_left,theme(colors.blue.50),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(30rem_30rem_at_bottom_right,theme(colors.indigo.50),transparent)]" />

      <div className="w-full max-w-[440px] animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Target size={28} />
            </div>
            <span className="text-3xl font-bold text-gray-900 brand-font tracking-tight">GoalFlow</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 brand-font">Welcome back</h2>
          <p className="text-gray-500 font-medium">Continue your journey to execution excellence.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="input-premium pl-12"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <Link to="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-premium pl-12"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" id="remember" />
              <label htmlFor="remember" className="text-sm text-gray-600 font-medium cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? "Authenticating..." : "Login to Workspace"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-600 font-medium">
              New to GoalFlow? <Link to="/register" className="text-blue-600 hover:underline font-bold">Create an account</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
          <ShieldCheck size={16} />
          <span>Secure, enterprise-grade authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;