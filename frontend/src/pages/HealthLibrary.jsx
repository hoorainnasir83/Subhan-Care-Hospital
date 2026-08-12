import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, FileText, HeartPulse, Calculator, 
  ChevronRight, Activity, Info, Scale, Ruler, Users, Coffee
} from 'lucide-react';

const HealthLibrary = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('guide');
  const [activeGuide, setActiveGuide] = useState(null);

  // Calculator State
  const [calcTab, setCalcTab] = useState('bmi');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [calcResult, setCalcResult] = useState(null);

  const calculateBMI = (e) => {
    e.preventDefault();
    if (!height || !weight) return;
    const hMeters = parseFloat(height) / 100;
    const wKg = parseFloat(weight);
    const bmi = wKg / (hMeters * hMeters);
    
    let status = 'Normal';
    let color = 'text-green-600 bg-green-50 border-green-200';
    if (bmi < 18.5) { status = 'Underweight'; color = 'text-yellow-600 bg-yellow-50 border-yellow-200'; }
    else if (bmi >= 25 && bmi < 30) { status = 'Overweight'; color = 'text-orange-600 bg-orange-50 border-orange-200'; }
    else if (bmi >= 30) { status = 'Obese'; color = 'text-red-600 bg-red-50 border-red-200'; }

    setCalcResult({
      title: 'Your BMI is',
      value: bmi.toFixed(1),
      status,
      color,
      message: 'Body Mass Index is a simple calculation using a person\'s height and weight.'
    });
  };

  const calculateBMR = (e) => {
    e.preventDefault();
    if (!height || !weight || !age) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);
    
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    setCalcResult({
      title: 'Your BMR is',
      value: bmr.toFixed(0),
      status: 'Calories/Day',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      message: 'Basal Metabolic Rate is the number of calories required to keep your body functioning at rest.'
    });
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'guide':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Hospital Admission Process', desc: 'Step-by-step guide to inpatient admission, required documents, and what to expect on your first day.', fullText: 'When you arrive for your admission, please proceed directly to the main reception. You will need your original CNIC, doctor\'s admission slip, and any relevant previous medical records or lab reports. The admission desk will verify your details and assign you a room based on your doctor\'s recommendations. An initial deposit may be required unless you are covered by an approved panel insurance.' },
              { title: 'Visiting Hours & Guidelines', desc: 'Current visiting schedules for general wards and ICUs, including infection control rules.', fullText: 'General Ward visiting hours are from 4:00 PM to 8:00 PM daily. ICU/CCU visiting is strictly limited to 10 minutes per attendant between 5:00 PM and 6:00 PM. Children under 12 are not permitted in patient areas to prevent infection risks. All visitors must sanitize their hands upon entry and exit.' },
              { title: 'Insurance & Billing', desc: 'Information about accepted insurance panels, claim processing, and payment methods.', fullText: 'We accept all major health insurance panels including State Life, Jubilee, and EFU. Please present your active insurance card at the time of admission. If your treatment is not fully covered, the remaining balance must be cleared at discharge. We accept Cash, Credit/Debit cards, and major digital wallets.' },
              { title: 'Emergency Services', desc: 'When to visit the ER, triage process, and emergency contact numbers.', fullText: 'Our Emergency Room (ER) is open 24/7. Patients are seen based on the severity of their condition (Triage system), not on a first-come, first-served basis. Critical life-threatening cases are always prioritized. For immediate ambulance assistance, please dial 051-8464646 extension 1.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Info className="text-blue-600 h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                <button 
                  onClick={() => setActiveGuide(item)}
                  className="mt-4 text-sm font-semibold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Read More <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        );
      case 'articles':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Understanding Hypertension', author: 'Dr. Sarah Ahmed', tag: 'Cardiology' },
              { title: 'Managing Type 2 Diabetes', author: 'Dr. Ali Raza', tag: 'Endocrinology' },
              { title: 'Benefits of Daily Exercise', author: 'Dr. Fatima Noor', tag: 'Wellness' },
              { title: 'Childhood Vaccinations', author: 'Dr. Omar Farooq', tag: 'Pediatrics' },
              { title: 'Healthy Diet for the Heart', author: 'Dr. Sarah Ahmed', tag: 'Cardiology' },
              { title: 'Mental Health in 2026', author: 'Dr. Zoya Khan', tag: 'Psychiatry' }
            ].map((article, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-32 bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <FileText className="text-gray-300 group-hover:text-blue-200 h-12 w-12" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{article.tag}</span>
                  <h3 className="text-md font-bold text-gray-800 mt-1 mb-2 leading-tight">{article.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Users size={14} /> {article.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'tips':
        return (
          <div className="space-y-4">
            {[
              { title: 'Stay Hydrated', desc: 'Drink at least 8 glasses of water a day to maintain optimal body function.', icon: Coffee, color: 'text-blue-500' },
              { title: 'Adequate Sleep', desc: 'Aim for 7-9 hours of quality sleep per night to support mental and physical health.', icon: Activity, color: 'text-indigo-500' },
              { title: 'Regular Movement', desc: 'Take short walking breaks every hour if you have a desk job.', icon: HeartPulse, color: 'text-red-500' },
              { title: 'Mindful Eating', desc: 'Include a portion of vegetables or fruits in every meal.', icon: Scale, color: 'text-green-500' }
            ].map((tip, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-full bg-gray-50 ${tip.color}`}>
                  <tip.icon size={24} />
                </div>
                <div>
                  <h3 className="text-md font-bold text-gray-800">{tip.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'calculators':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 mb-6">
                <button onClick={() => { setCalcTab('bmi'); setCalcResult(null); }} className={`flex-1 py-2 text-sm font-bold rounded-md ${calcTab === 'bmi' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>BMI Calculator</button>
                <button onClick={() => { setCalcTab('bmr'); setCalcResult(null); }} className={`flex-1 py-2 text-sm font-bold rounded-md ${calcTab === 'bmr' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>BMR Calculator</button>
              </div>

              <form onSubmit={calcTab === 'bmi' ? calculateBMI : calculateBMR} className="space-y-4">
                {calcTab === 'bmr' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 border">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                )}
                {calcTab === 'bmr' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                    <input type="number" required value={age} onChange={(e) => setAge(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 border" placeholder="e.g. 30" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Ruler size={16} className="text-gray-400" /></div>
                    <input type="number" required value={height} onChange={(e) => setHeight(e.target.value)} className="w-full pl-10 border-gray-300 rounded-lg shadow-sm px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 border" placeholder="e.g. 175" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Scale size={16} className="text-gray-400" /></div>
                    <input type="number" required value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full pl-10 border-gray-300 rounded-lg shadow-sm px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500 border" placeholder="e.g. 70" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-2">
                  Calculate
                </button>
              </form>
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-8 flex items-center justify-center bg-white">
              {calcResult ? (
                <div className={`w-full max-w-sm rounded-xl p-6 border text-center ${calcResult.color}`}>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">{calcResult.title}</h4>
                  <div className="text-5xl font-black mb-2">{calcResult.value}</div>
                  <div className="text-lg font-bold mb-4">{calcResult.status}</div>
                  <p className="text-sm opacity-90">{calcResult.message}</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Enter your details and click calculate to see your results here.</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Activity className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Health Library</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-row lg:flex-col gap-2 overflow-x-auto">
              {[
                { id: 'guide', icon: BookOpen, label: 'Patient Guide' },
                { id: 'articles', icon: FileText, label: 'Doctor Articles' },
                { id: 'tips', icon: HeartPulse, label: 'Health Tips' },
                { id: 'calculators', icon: Calculator, label: 'Health Calculators' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setActiveGuide(null); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap lg:whitespace-normal ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700 font-bold' 
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-gray-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Explore resources, tools, and information to manage your health better.
              </p>
            </div>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Guide Modal */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Info className="text-blue-600 h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">{activeGuide.title}</h3>
                </div>
                <button onClick={() => setActiveGuide(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {activeGuide.fullText}
              </p>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setActiveGuide(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthLibrary;
