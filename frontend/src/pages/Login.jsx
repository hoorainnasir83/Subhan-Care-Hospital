import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import ForgotPassword from './ForgotPassword';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle,
  ArrowRight, Phone, ShieldCheck, Stethoscope,
  UserCircle2, Activity, Info, ChevronLeft, CheckCircle2
} from 'lucide-react';

const PORTALS = [
  {
    id:    'admin',
    label: 'Admin Portal',
    icon:  ShieldCheck,
    step1Label: 'Email Address',
    step1Placeholder: 'Enter your admin email',
    step1Icon: Mail,
    step1Type: 'email',
    info:  'Contact IT department for access issues.',
  },
  {
    id:    'doctor',
    label: 'Doctor Portal',
    icon:  Stethoscope,
    step1Label: 'Email Address',
    step1Placeholder: 'Enter your doctor email',
    step1Icon: Mail,
    step1Type: 'email',
    info:  'Credentials issued by HR. Contact admin for resets.',
  },
  {
    id:    'patient',
    label: 'Patient Portal',
    icon:  UserCircle2,
    step1Label: 'Patient ID / Email',
    step1Placeholder: 'Enter your Patient ID or email',
    step1Icon: UserCircle2,
    step1Type: 'email',
    info:  'New patients can register at reception or call our helpline.',
  },
];

const StepBar = ({ current, total }) => (
  <div className="flex gap-1.5 mt-2 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
          i < current ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      />
    ))}
  </div>
);

const Login = ({ onBack }) => {
  const { login } = useContext(AppContext);

  const [portalId,       setPortalId]       = useState(null);
  const [step,           setStep]           = useState(1);
  const [identifier,     setIdentifier]     = useState('');
  const [password,       setPassword]       = useState('');
  const [showPassword,   setShowPassword]   = useState(false);
  const [error,          setError]          = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [showForgot,     setShowForgot]     = useState(false); // ✅ NEW

  const portal = PORTALS.find(p => p.id === portalId);
  const IdIcon = portal ? portal.step1Icon : Mail;

  const selectPortal = (id) => {
    setPortalId(id);
    setStep(1);
    setIdentifier('');
    setPassword('');
    setError('');
    setSuccessMessage('');
    setShowForgot(false);
  };

  const goBack = () => {
    if (showForgot) { setShowForgot(false); setError(''); setSuccessMessage(''); return; }
    if (step === 2) { setStep(1); setPassword(''); setError(''); return; }
    if (step === 1 && portalId) { setPortalId(null); setIdentifier(''); setError(''); return; }
    if (onBack) onBack();
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Please enter your email or Patient ID.'); return; }
    setError('');
    setStep(2);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter your password.'); return; }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await login(identifier, password);
      if (!result.success) setError(result.error || 'Invalid credentials. Please try again.');
    } catch {
      setError('Cannot connect to the authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Show ForgotPassword Component
  if (showForgot) {
    return (
      <ForgotPassword
        onBackToLogin={() => {
          setShowForgot(false);
          setSuccessMessage('✅ Password reset! Please login with new password.');
          setStep(1);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/hospital-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[420px] mx-4 my-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Logo Header */}
          <div className="flex flex-col items-center pt-8 pb-4 px-8 border-b border-gray-100">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg mb-2">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <p className="text-[13px] font-bold text-gray-700 tracking-tight">Subhan Care Hospitals Ltd.</p>
          </div>

          <div className="px-8 pb-8 pt-5">

            {/* PORTAL SELECTOR */}
            {!portalId && (
              <>
                <h2 className="text-xl font-black text-blue-600 text-center mb-1">Select Your Portal</h2>
                <p className="text-[12px] text-gray-400 text-center mb-6">Choose your portal to continue</p>

                {successMessage && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold px-4 py-3 rounded-xl mb-4">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    {successMessage}
                  </div>
                )}

                <div className="space-y-3">
                  {PORTALS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPortal(p.id)}
                        className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group text-left"
                      >
                        <div className="h-10 w-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{p.label}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{p.info}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>

                <p className="text-center mt-6 text-[12px] text-gray-400">
                  🎧 Need help? Call{' '}
                  <a href="tel:051-8464646" className="text-blue-600 font-bold hover:underline">051-8464646</a>
                </p>

                {onBack && (
                  <button
                    onClick={onBack}
                    className="mt-4 w-full text-[12px] text-gray-400 hover:text-blue-600 text-center transition-colors"
                  >
                    ← Back to website
                  </button>
                )}
              </>
            )}

            {/* STEP 1: Enter Email */}
            {portalId && step === 1 && (
              <>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">STEP 1 OF 2</p>
                <h2 className="text-2xl font-black text-gray-900 mt-0.5">Welcome back</h2>
                <StepBar current={1} total={2} />

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold px-4 py-3 rounded-xl mb-4">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-600 mb-1.5">
                      {portal.step1Label}
                    </label>
                    <div className="relative">
                      <IdIcon className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={portal.step1Type}
                        value={identifier}
                        onChange={e => { setIdentifier(e.target.value); setError(''); }}
                        placeholder={portal.step1Placeholder}
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200 text-sm"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-600 leading-relaxed">{portal.info}</p>
                </div>

                <p className="text-center mt-5 text-[12px] text-gray-400">
                  🎧 Need help? Call{' '}
                  <a href="tel:051-8464646" className="text-blue-600 font-bold hover:underline">051-8464646</a>
                </p>
                <button
                  onClick={goBack}
                  className="mt-3 w-full text-[12px] text-gray-400 hover:text-blue-600 text-center transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" /> Back to portal selection
                </button>
              </>
            )}

            {/* STEP 2: Enter Password */}
            {portalId && step === 2 && (
              <>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">STEP 2 OF 2</p>
                <h2 className="text-2xl font-black text-gray-900 mt-0.5">Enter Password</h2>
                <StepBar current={2} total={2} />

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 mb-4">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 font-medium flex-1 truncate">{identifier}</span>
                  <button
                    onClick={goBack}
                    className="text-[11px] text-blue-600 font-bold hover:underline flex-shrink-0"
                  >
                    Change
                  </button>
                </div>

                {successMessage && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-semibold px-4 py-3 rounded-xl mb-4">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold px-4 py-3 rounded-xl mb-4">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep2} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Password</label>
                      {/* ✅ Forgot Password Link */}
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] text-blue-600 font-bold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Enter your password"
                        autoFocus
                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-gray-50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200 text-sm"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Sign In to {portal.label} <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-1.5 mt-5 text-[11px] text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-300" />
                  Protected by 256-bit SSL Encryption
                </div>

                <p className="text-center mt-3 text-[12px] text-gray-400">
                  🎧 Need help? Call{' '}
                  <a href="tel:051-8464646" className="text-blue-600 font-bold hover:underline">051-8464646</a>
                </p>
              </>
            )}

          </div>

          {/* App Download Strip */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-800">Get the Subhan Care app</p>
                <p className="text-[11px] text-gray-400">Access your health records on the go.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a href="#"
                className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="text-lg">🤖</span>
                <div>
                  <div className="text-[9px] text-gray-400 leading-none">Get it on</div>
                  <div className="text-[12px] font-bold text-gray-800 leading-tight">Google Play</div>
                </div>
              </a>
              <a href="#"
                className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className="text-lg">🍎</span>
                <div>
                  <div className="text-[9px] text-gray-400 leading-none">Download on the</div>
                  <div className="text-[12px] font-bold text-gray-800 leading-tight">App Store</div>
                </div>
              </a>
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-white/50 mt-4">
          © {new Date().getFullYear()} Subhan Care Hospitals Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;