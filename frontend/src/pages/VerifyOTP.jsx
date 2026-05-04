import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, RefreshCw, Smartphone, Target } from 'lucide-react';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (location.state?.phone) {
      setPhone(location.state.phone);
      if (location.state?.dev_otp) {
        setDevOtp(location.state.dev_otp);
        setOtp(location.state.dev_otp); // Auto-fill
      }
    } else {
      navigate('/register');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/verify-otp/', {
        phone: phone,
        otp: otp
      });

      toast.success("Verification successful!");
      localStorage.setItem('token', response.data.token || 'dummy-token');
      navigate('/dashboard');

    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/resend-otp/', { phone });
      toast.success("New OTP sent!");
      setTimer(60);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      toast.error("Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_40rem_at_center,theme(colors.blue.50),transparent)]" />
      
      <div className="w-full max-w-[440px] animate-fade-in">
        <div className="text-center mb-10">
           <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Target size={28} />
            </div>
            <span className="text-3xl font-bold text-gray-900 brand-font tracking-tight">GoalFlow</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 brand-font">Verify your phone</h2>
          <p className="text-gray-500 font-medium flex items-center justify-center gap-2">
            <Smartphone size={16} />
            Code sent to <span className="text-gray-900 font-bold">{phone}</span>
          </p>
        </div>

        {/* Dev Mode OTP Banner */}
        {devOtp && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-6 py-4 mb-2 flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="text-amber-800 font-black text-sm uppercase tracking-widest">Dev Mode — Twilio Not Configured</p>
              <p className="text-amber-700 font-medium text-sm">Your OTP: <span className="text-2xl font-black tracking-widest text-amber-900">{devOtp}</span></p>
            </div>
          </div>
        )}

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 block text-center uppercase tracking-widest">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-5xl tracking-[12px] py-6 border-2 border-gray-100 rounded-3xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono font-bold text-blue-600 placeholder:text-gray-200"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? "Verifying..." : "Confirm & Continue"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            {timer > 0 ? (
              <p className="text-gray-500 font-medium">
                Resend code in <span className="text-blue-600 font-bold">{timer}s</span>
              </p>
            ) : (
              <button 
                onClick={handleResend}
                disabled={resendLoading}
                className="text-blue-600 font-bold hover:underline flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                <RefreshCw size={18} className={resendLoading ? 'animate-spin' : ''} />
                {resendLoading ? "Sending..." : "Resend Verification Code"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
          <ShieldCheck size={16} />
          <span>Verified Secure Session</span>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;