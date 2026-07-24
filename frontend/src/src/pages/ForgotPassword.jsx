import React, { useState, useEffect } from 'react';

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
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
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setResendTimer(60);
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch (err) {
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
      const response = await fetch('http://localhost:5000/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setTimeout(() => onBackToLogin(), 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        setResendTimer(60);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            fontSize: '28px'
          }}>
            🔐
          </div>
          <h2 style={{ color: '#1F2937', margin: '0 0 5px', fontSize: '24px', fontWeight: '700' }}>
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>
            {step === 1
              ? 'Enter your email to receive a reset code'
              : `Code sent to ${email}`}
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '25px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: step >= s ? '#2563eb' : '#E5E7EB',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            borderLeft: '4px solid #EF4444',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{
            background: '#DCFCE7',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            borderLeft: '4px solid #22C55E',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {/* STEP 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@subhancare.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '📧 Sending...' : '📧 Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                width: '100%',
                padding: '13px',
                background: 'transparent',
                color: '#2563eb',
                border: '2px solid #2563eb',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              ← Back to Login
            </button>
          </form>
        )}

        {/* STEP 2: Code + Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            {/* Code Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                6-Digit Reset Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '20px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
              <small style={{ color: '#6B7280', fontSize: '12px' }}>
                Check your email inbox
              </small>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: '#E5E7EB',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: strength.text === 'Weak' ? '33%' : strength.text === 'Medium' ? '66%' : '100%',
                      background: strength.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                  <small style={{ color: strength.color, fontWeight: '600', fontSize: '12px' }}>
                    {strength.text}
                  </small>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '600',
                fontSize: '14px'
              }}>
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
                  padding: '12px 16px',
                  border: `2px solid ${confirmPassword && newPassword !== confirmPassword ? '#EF4444' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <small style={{ color: '#EF4444', fontSize: '12px' }}>
                  ❌ Passwords do not match
                </small>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <small style={{ color: '#22C55E', fontSize: '12px' }}>
                  ✅ Passwords match
                </small>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
              style={{
                width: '100%',
                padding: '13px',
                background: (loading || newPassword !== confirmPassword || newPassword.length < 8)
                  ? '#93C5FD' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: (loading || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {loading ? 'Resetting...' : '🔑 Reset Password'}
            </button>

            {/* Resend Code */}
            <div style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #E5E7EB' }}>
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
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;