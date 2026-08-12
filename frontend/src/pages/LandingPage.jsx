import React, { useState } from 'react';
import {
  Phone, Search, ChevronDown, Menu, X,
  Activity, ArrowRight, Heart, Shield, Clock, Star
} from 'lucide-react';

const LandingPage = ({ onLoginClick, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [language, setLanguage]             = useState('EN');

  const navLinks = [
    { label: 'Patient Portal', dropdown: ['Book Appointment', 'Diagnostic Reports', 'Medical History', 'Billing'] },
    { label: 'Specialities',   dropdown: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics'] },
    { label: 'Health Library', dropdown: ['Patient Guide', 'Doctor Articles', 'Health Tips', 'Health Calculators'] },
  ];

  const stats = [
    { icon: Heart,   value: '50,000+', label: 'Patients Served' },
    { icon: Shield,  value: '200+',    label: 'Expert Doctors' },
    { icon: Clock,   value: '24/7',    label: 'Emergency Care' },
    { icon: Star,    value: '15+',     label: 'Years of Excellence' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── TOP BAR ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-1.5 px-4 hidden md:block relative z-[60]">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          {/* Top nav links */}
          <div className="flex items-center gap-6 text-[13px] text-gray-600">
            <div className="relative group">
              <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600 py-1 font-medium">
                🌐 {language === 'EN' ? 'English' : 'Urdu (اردو)'} <ChevronDown size={12} />
              </span>
              <div className="absolute left-0 top-full mt-0 w-32 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                <button onClick={() => setLanguage('EN')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">English</button>
                <button onClick={() => setLanguage('UR')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">Urdu (اردو)</button>
              </div>
            </div>
            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
              📍 Islamabad <ChevronDown size={12} />
            </span>
            <a href="#" className="hover:text-blue-600 transition-colors">International Patients</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Home Health</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Academics & Research</a>
            <a href="#" className="hover:text-blue-600 transition-colors">News & Events</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Careers</a>
            <a href="#" className="font-bold text-blue-600 hover:underline">Virtual Tour</a>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center py-3 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-black text-gray-900 tracking-tight">Subhan Care</div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Hospitals Ltd.</div>
              </div>
            </div>

            {/* Nav Links (desktop) */}
            <div className="hidden lg:flex items-center gap-1 ml-4">
              <a href="#" className="px-3 py-2 text-sm font-semibold text-blue-600">Home</a>
              {navLinks.map(link => (
                <div key={link.label} className="relative group">
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                    {link.label} <ChevronDown size={14} />
                  </button>
                  <div className="absolute left-0 top-full mt-0 w-52 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    {link.dropdown.map(item => (
                      <button 
                        key={item} 
                        onClick={() => link.label === 'Health Library' ? onNavigate('health-library') : onLoginClick()}
                        className="w-full text-left block px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center">
                {searchOpen ? (
                  <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 w-52">
                    <Search size={15} className="text-gray-400" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="bg-transparent text-sm outline-none flex-1 text-gray-700"
                    />
                    <button onClick={() => setSearchOpen(false)}><X size={14} className="text-gray-400" /></button>
                  </div>
                ) : (
                  <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors">
                    <Search size={18} />
                  </button>
                )}
              </div>

              {/* Phone */}
              <a href="tel:051-8464646" className="hidden lg:flex items-center gap-1.5 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                <Phone size={16} className="text-blue-600" />
                051-8464646
              </a>

              {/* Contact */}
              <a href="#" className="hidden lg:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Contact Us
              </a>

              {/* LOG IN BUTTON */}
              <button
                onClick={onLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-colors shadow-md shadow-blue-200"
              >
                Log in
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {navLinks.map(link => (
              <div key={link.label}>
                <div className="font-bold text-gray-800 py-2 px-2 border-b border-gray-100">{link.label}</div>
                <div className="pl-4 border-l-2 border-gray-100 ml-2 mb-2 mt-1">
                  {link.dropdown.map(item => (
                    <button 
                      key={item} 
                      onClick={() => link.label === 'Health Library' ? onNavigate('health-library') : onLoginClick()}
                      className="w-full text-left block text-sm font-medium text-gray-600 hover:text-blue-600 py-2"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <a href="#" className="block text-sm font-medium text-gray-700 hover:text-blue-600 py-2 border-b border-gray-50">
              Contact Us
            </a>
            <button onClick={onLoginClick} className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded-full mt-2">
              Log in
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO BANNER ──────────────────────────────────────────────────────── */}
      <div
        className="relative w-full h-[420px] md:h-[520px] bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/hospital-bg.jpg')" }}
      >
        {/* Subtle gradient overlay — just bottom fade like Shifa */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />

        {/* Hero Text */}
        <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-7xl mx-auto">
          <span className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-3">
            {language === 'UR' ? 'خوش آمدید' : 'Welcome to'}
          </span>
          <h1 className={`text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg max-w-2xl ${language === 'UR' ? 'font-urdu' : ''}`}>
            {language === 'UR' ? 'سبحان کیئر' : 'Subhan Care'}<br />
            <span className="text-blue-300">{language === 'UR' ? 'ہسپتال' : 'Hospital'}</span>
          </h1>
          <p className={`text-white/80 text-lg mt-4 font-medium drop-shadow max-w-xl ${language === 'UR' ? 'font-urdu' : ''}`}>
            {language === 'UR' ? 'سب کے لیے ہمدردی کے ساتھ صحت کی دیکھ بھال' : 'Healthcare with Compassion for All'}
          </p>
          <div className="flex gap-3 mt-8">
            <button
              onClick={onLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition-all shadow-lg flex items-center gap-2"
            >
              {language === 'UR' ? 'مریض کا پورٹل' : 'Patient Portal'} <ArrowRight size={16} />
            </button>
            <a href="#"
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white font-bold px-8 py-3.5 rounded-full transition-all border border-white/30"
            >
              {language === 'UR' ? 'ڈاکٹر تلاش کریں' : 'Find a Doctor'}
            </a>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center group cursor-default">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-gray-900">{value}</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PORTALS SECTION ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Choose Your Portal</h2>
          <p className="text-gray-500 text-sm font-medium">Secure access for all hospital stakeholders</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Patient Portal', icon: '🏥', color: 'blue',
              desc: 'Book appointments, view reports & manage your health records online.',
              items: ['Book Appointments', 'View Lab Reports', 'Medical History', 'Billing & Invoices'],
            },
            {
              title: 'Doctor Portal', icon: '🩺', color: 'emerald',
              desc: 'Access your clinical schedule, patient records & consultation notes.',
              items: ['Daily Schedule', 'Patient Records', 'Consultation Notes', 'Prescription History'],
            },
            {
              title: 'Admin Portal', icon: '⚙️', color: 'indigo',
              desc: 'Full system control: staff management, reports, billing & analytics.',
              items: ['Staff Management', 'Revenue Reports', 'System Settings', 'Audit Logs'],
            },
          ].map(portal => (
            <div key={portal.title}
              onClick={onLoginClick}
              className={`group cursor-pointer bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="text-4xl mb-4">{portal.icon}</div>
              <h3 className="text-lg font-black text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{portal.title}</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{portal.desc}</p>
              <ul className="space-y-2">
                {portal.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="mt-6 w-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white font-bold py-3 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2">
                Sign In <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 mt-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-black text-sm">Subhan Care Hospitals</span>
            </div>
            <p className="text-xs leading-relaxed">Healthcare with Compassion for all.<br />Strengthening generations through quality care.</p>
          </div>
          {[
            { heading: 'Patient Portal', links: ['Book Appointment', 'Lab Reports', 'Medical History'] },
            { heading: 'Hospital',       links: ['About Us', 'Specialities', 'Contact Us'] },
            { heading: 'Helpline',       links: ['051-8464646', '24/7 Emergency', 'helpdesk@subhancare.pk'] },
          ].map(col => (
            <div key={col.heading}>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map(l => <li key={l}><a href="#" className="text-xs hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-700 mt-8 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Subhan Care Hospitals Ltd., Pakistan. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
