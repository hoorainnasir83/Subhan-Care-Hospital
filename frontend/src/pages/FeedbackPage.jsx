import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Star, MessageSquare, Clock, User, Stethoscope, Plus } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';

const FeedbackPage = () => {
  const { token, user } = useContext(AppContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchFeedback = async () => {
    try {
      const query = user.role === 'Doctor' ? `?doctorId=${user.id || user.doctorId}` : '';
      const res = await fetch(`${API_URL}/feedback${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setFeedbacks(json.data);

      if (user.role === 'Doctor') {
        const statsRes = await fetch(`${API_URL}/feedback/doctor/${user.id || user.doctorId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsJson = await statsRes.json();
        if (statsJson.success) setStats(statsJson.data);
      } else if (user.role === 'Patient') {
        // Fetch doctors list so patient can select who to rate
        const docRes = await fetch(`${API_URL}/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const docJson = await docRes.json();
        if (docJson.success) setDoctorsList(docJson.data);
      }
    } catch (err) {
      console.error('Failed to load feedback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [token, user.role, user.id, user.doctorId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={28} /> 
            {user.role === 'Doctor' ? 'My Patient Feedback' : 'Patient Feedback'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review patient ratings and comments from past appointments.
          </p>
        </div>
        
        {user.role === 'Patient' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Give Feedback
          </button>
        )}
      </div>

      {/* Select Doctor Dialog logic handles right inside the modal wrapper now */}
      {isModalOpen && user.role === 'Patient' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select a Doctor to Rate:</label>
          <div className="flex gap-2">
            <select 
              className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-gray-700"
              onChange={(e) => {
                const doc = doctorsList.find(d => d.id === e.target.value);
                setSelectedDoctor(doc);
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Choose Doctor --</option>
              {doctorsList.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedDoctor && isModalOpen && (
        <FeedbackModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDoctor(null);
            fetchFeedback(); // Refresh the list after giving feedback
          }} 
          doctor={selectedDoctor} 
        />
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {stats.avgRating} <Star className="fill-amber-400 text-amber-400" size={32} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Average Rating</p>
            <p className="text-sm text-gray-400 mt-1">Based on {stats.totalReviews} reviews</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats.distribution?.[star] || 0;
                const percentage = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 flex items-center gap-1 font-medium">{star} <Star size={12} className="fill-amber-400 text-amber-400"/></span>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-8 text-right text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {feedbacks.length === 0 ? (
           <div className="text-center py-16 text-gray-400">
             <MessageSquare size={48} className="mx-auto mb-4 opacity-40" />
             <p className="text-lg font-medium">No feedback available yet.</p>
           </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {feedbacks.map(f => (
              <div key={f._id || f.id} className="p-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} className={star <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {f.patientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {user.role !== 'Doctor' && (
                      <span className="flex items-center gap-1.5"><Stethoscope size={13}/> {f.doctorName}</span>
                    )}
                    <span className="flex items-center gap-1.5"><Clock size={13}/> {new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {f.comment && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-800 italic">
                    "{f.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
