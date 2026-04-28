import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [phone, setPhone] = useState('');
    const [roleChoice, setRoleChoice] = useState('owner');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);

    // Get phone from Register page
    useEffect(() => {
        if (location.state?.phone) {
            setPhone(location.state.phone);
            setRoleChoice(location.state.role_choice || 'owner');
        } else {
            navigate('/register'); // Redirect if no phone
        }
    }, [location, navigate]);

    // Timer for Resend OTP
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(t => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authAPI.verifyOTP({
                phone: phone,
                otp: otp,
                role_choice: roleChoice
            });

            setMessage("Verification Successful!");
            
            setTimeout(() => {
                alert("Registration Completed! Welcome to GoalFlow 🎉");
                navigate('/dashboard'); // Later we will create dashboard
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.error || "Invalid OTP. Please try again.");
        }
        setLoading(false);
    };

    const handleResend = () => {
        setTimer(60);
        setError('');
        setMessage('New OTP sent!');
        // Later we will call register API again for resend
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f4f4f4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px 30px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '460px',
                textAlign: 'center'
            }}>
                <h2>Verify Your Phone</h2>
                <p style={{ color: '#555', marginBottom: '30px' }}>
                    We sent a 6-digit code to <strong>+91 {phone}</strong>
                </p>

                <form onSubmit={handleVerify}>
                    <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        style={{
                            fontSize: '28px',
                            textAlign: 'center',
                            padding: '12px',
                            width: '100%',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            letterSpacing: '8px'
                        }}
                        required
                    />

                    <button 
                        type="submit" 
                        disabled={loading || otp.length !== 6}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '17px',
                            fontWeight: 'bold',
                            backgroundColor: '#FF9900',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            marginTop: '20px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                {message && <p style={{ color: 'green', marginTop: '20px' }}>{message}</p>}
                {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

                <div style={{ marginTop: '25px' }}>
                    {timer > 0 ? (
                        <p>Resend OTP in {timer} seconds</p>
                    ) : (
                        <button onClick={handleResend} style={{ color: '#0066c0', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Resend OTP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;