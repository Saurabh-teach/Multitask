import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        password2: '',
        role_choice: 'owner'
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error when typing
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authAPI.register(formData);
            
            setMessage(response.data.message);

            // Move to OTP Screen
            setTimeout(() => {
                navigate('/verify-otp', { 
                    state: { 
                        phone: formData.phone,
                        role_choice: formData.role_choice 
                    } 
                });
            }, 1200);

        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong. Please try again.");
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
                maxWidth: '480px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#232f3e' }}>
                    Create Your Account
                </h2>

                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        name="first_name" 
                        placeholder="First Name" 
                        onChange={handleChange} 
                        required 
                        style={inputStyle}
                    />
                    <input 
                        type="text" 
                        name="last_name" 
                        placeholder="Last Name" 
                        onChange={handleChange} 
                        required 
                        style={inputStyle}
                    />
                    <input 
    type="text" 
    name="username" 
    placeholder="Choose Username (e.g. saurabh101)" 
    onChange={handleChange} 
    required 
    style={inputStyle}
/>
                    <input 
                        type="tel" 
                        name="phone" 
                        placeholder="Phone Number (e.g. 9876543210)" 
                        onChange={handleChange} 
                        required 
                        style={inputStyle}
                    />
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Email (optional)" 
                        onChange={handleChange} 
                        style={inputStyle}
                    />

                    <select 
                        name="role_choice" 
                        onChange={handleChange} 
                        value={formData.role_choice}
                        style={inputStyle}
                    >
                        <option value="owner">I am starting a new team (Owner)</option>
                        <option value="member">I am joining an existing team (Employee)</option>
                    </select>

                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Create Password" 
                        onChange={handleChange} 
                        required 
                        style={inputStyle}
                    />
                    <input 
                        type="password" 
                        name="password2" 
                        placeholder="Confirm Password" 
                        onChange={handleChange} 
                        required 
                        style={inputStyle}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#FF9900',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        {loading ? "Creating Account..." : "Continue"}
                    </button>
                </form>

                {message && <p style={{ color: 'green', textAlign: 'center', marginTop: '15px' }}>{message}</p>}
                {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px' }}>{error}</p>}

                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                    Already have an account? <a href="/login" style={{ color: '#0066c0' }}>Sign in</a>
                </p>
            </div>
        </div>
    );
};

// Common Input Style
const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px'
};

export default Register;