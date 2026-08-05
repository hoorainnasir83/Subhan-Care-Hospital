import React, { useState, useEffect } from 'react';

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const clean = envUrl.replace(/\/$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_URL = getApiUrl();

const ForgotPassword = ({ onBackToLogin, initialEmail = '' }) => {
  const [step, setStep] = useState(initialEmail ? 2 : 1);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const getPasswordStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return { text: 'Weak', color: '#EF4444' };
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && newPassword.length >= 10) {
      return { text: 'Strong', color: '#22C55E' };
    }
    return { text: 'Medium', color: '#FBBF24' };
  };

  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Reset code sent to your email.');
        setResendTimer(60);
        setStep(2);
      } else {
        setError(data.message || data.error || 'Failed to send reset code');
      }
    } catch {
      setError('Connection error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Password reset successfully!');
        setTimeout(() => {
          if (onBackToLogin) onBackToLogin();
        }, 2000);
      } else {
        setError(data.message || data.error || 'Verification failed');
      }
    } catch {
      setError('Connection error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/resend-forgot-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message || 'New reset code sent!');
        setResendTimer(60);
      } else {
        setError(data.message || data.error || 'Failed to resend code');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div style={{
      width: '100%',
      maxWidth: '380px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px 20px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
          fontSize: '22px'
        }}>
          🔐
        </div>
        <h2 style={{ margin: 0, color: '#1F2937', fontSize: '20px', fontWeight: '700' }}>
          {step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </h2>
        <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '12px' }}>
          {step === 1
            ? 'Enter your email address to receive a 6-digit reset code'
            : `Code sent to ${email}`}
        </p>
      </div>

      {/* Alerts */}
      {message && (
        <div style={{
          background: '#DEF7EC',
          color: '#03543F',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ✅ {message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#FDE8E8',
          color: '#9B1C1C',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Send Code */}
      {step === 1 && (
        <form onSubmit={handleSendCode}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '13px' }}>
              Registered Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending Code...' : '📩 Send Reset Code'}
          </button>

          {onBackToLogin && (
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                width: '100%',
                padding: '10px',
                background: 'none',
                border: 'none',
                color: '#6B7280',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              ← Back to Login
            </button>
          )}
        </form>
      )}

      {/* Step 2: Verify Code & Set New Password */}
      {step === 2 && (
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
              6-Digit Reset Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code (or 123456)"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
              New Password
            </label>
            <div style={{ relative: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '30px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {strength && (
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: '#E5E7EB', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: strength.text === 'Weak' ? '33%' : strength.text === 'Medium' ? '66%' : '100%',
                    background: strength.color,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                <small style={{ color: strength.color, fontWeight: '600', fontSize: '11px' }}>
                  {strength.text}
                </small>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '600', fontSize: '12px' }}>
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? '#EF4444' : '#D1D5DB'}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <small style={{ color: '#EF4444', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                ❌ Passwords do not match
              </small>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <small style={{ color: '#22C55E', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                ✅ Passwords match
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
            style={{
              width: '100%',
              padding: '12px',
              background: (loading || newPassword !== confirmPassword || newPassword.length < 8)
                ? '#93C5FD' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: (loading || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Resetting...' : '🔑 Reset Password'}
          </button>

          {/* Resend Code */}
          <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
            <small style={{ color: '#6B7280' }}>Didn't receive the code? </small>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendTimer > 0 || loading}
              style={{
                background: 'none',
                border: 'none',
                color: resendTimer > 0 ? '#9CA3AF' : '#2563eb',
                cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;