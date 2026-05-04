import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Lock, Building, ArrowRight, Target } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    role_choice: 'owner'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/register/', formData);
      toast.success("Registration successful! Verify your phone.");
      navigate('/verify-otp', { state: { phone: formData.phone } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_top_right,theme(colors.blue.50),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(30rem_30rem_at_bottom_left,theme(colors.indigo.50),transparent)]" />

      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-fade-in flex flex-col md:flex-row">
        
        {/* Form Section */}
        <div className="flex-1 p-10 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Target size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900 brand-font">GoalFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2 brand-font">Create your account</h2>
          <p className="text-gray-500 mb-8 font-medium">Join 2,000+ teams executing with clarity.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="First Name"
                  className="input-premium pl-12"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="input-premium pl-12"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Username"
                className="input-premium pl-12"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Phone Number (e.g. 9876543210)"
                className="input-premium pl-12"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Work Email"
                className="input-premium pl-12"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="input-premium pl-12"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div className="relative">
              <Building className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <select
                className="input-premium pl-12 appearance-none"
                value={formData.role_choice}
                onChange={(e) => setFormData({...formData, role_choice: e.target.value})}
              >
                <option value="owner">Organization Owner</option>
                <option value="member">Team Member</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-4"
            >
              {loading ? "Creating account..." : "Sign Up for Free"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="text-center mt-8 text-gray-600 font-medium">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-bold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;