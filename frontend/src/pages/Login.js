import React, { useState } from 'react';
import { authAPI } from '../services/api';

const Login = () => {
    const [step, setStep] = useState(1); 
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        otp: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registeredPhone, setRegisteredPhone] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Step 1: Username + Password
    const handleCredentials = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authAPI.login({
                username: formData.username,
                password: formData.password
            });

            setRegisteredPhone(response.data.user.phone);
            setMessage("Password correct! OTP sent to your phone.");
            
            // Move to OTP step
            setTimeout(() => {
                setStep(2);
            }, 800);

        } catch (err) {
            setError(err.response?.data?.error || "Invalid username or password");
        }
        setLoading(false);
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            setMessage("Login Successful!");
            alert("🎉 Login Successful! Welcome to GoalFlow");
            // TODO: Redirect to dashboard later
        } catch (err) {
            setError("Invalid OTP");
        }
        setLoading(false);
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
                maxWidth: '420px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Sign In</h2>

                {step === 1 && (
                    <form onSubmit={handleCredentials}>
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="Username" 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', padding: '12px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Password" 
                            onChange={handleChange} 
                            required 
                            style={{ width: '100%', padding: '12px', margin: '10px 0', borderRadius: '6px', border: '1px solid #ccc' }}
                        />

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#FF9900',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginTop: '15px'
                            }}
                        >
                            {loading ? "Checking..." : "Continue"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                            We sent a 6-digit OTP to <strong>+91 {registeredPhone}</strong>
                        </p>
                        <input 
                            type="text" 
                            name="otp" 
                            placeholder="Enter 6-digit OTP" 
                            onChange={handleChange} 
                            maxLength={6}
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                margin: '10px 0', 
                                borderRadius: '8px', 
                                border: '2px solid #ddd',
                                fontSize: '22px',
                                textAlign: 'center',
                                letterSpacing: '8px'
                            }}
                            required 
                        />

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#FF9900',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginTop: '15px'
                            }}
                        >
                            {loading ? "Verifying..." : "Verify OTP & Login"}
                        </button>
                    </form>
                )}

                {message && <p style={{ textAlign: 'center', marginTop: '15px', color: 'green' }}>{message}</p>}
                {error && <p style={{ textAlign: 'center', marginTop: '15px', color: 'red' }}>{error}</p>}

                <p style={{ textAlign: 'center', marginTop: '25px' }}>
                    Don't have an account? <a href="/register" style={{ color: '#0066c0' }}>Sign Up</a>
                </p>
            </div>
        </div>
    );
};

export default Login;