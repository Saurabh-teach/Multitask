import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Login from './pages/Login';     // ← This line was missing

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

// Your Premium Landing Page
const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '60px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #f97316, #ec4899)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: 'bold'
        }}>G</div>
        <h1 style={{ fontSize: '42px', fontWeight: '800' }}>GoalFlow</h1>
      </div>

      <h1 style={{ fontSize: '4.8rem', lineHeight: '1.05', fontWeight: '900', marginBottom: '24px' }}>
        Goals that<br />
        <span style={{ background: 'linear-gradient(90deg, #f97316, #f43f5e, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          actually get done.
        </span>
      </h1>

      <p style={{ fontSize: '1.5rem', color: '#94a3b8', maxWidth: '620px', marginBottom: '50px' }}>
        The modern platform for teams who want to set clear goals,<br />
        execute powerfully, and track real progress.
      </p>

      <Link 
        to="/register"
        style={{
          background: 'linear-gradient(90deg, #f97316, #fb923c)',
          color: 'white',
          padding: '20px 48px',
          fontSize: '1.4rem',
          fontWeight: '700',
          borderRadius: '9999px',
          textDecoration: 'none',
          boxShadow: '0 20px 40px rgba(249, 115, 22, 0.35)'
        }}
      >
        Get Started Free
      </Link>
    </div>
  );
};

export default App;