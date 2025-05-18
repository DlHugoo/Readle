import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentNavbar from '../../components/StudentNavbar';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:8080';

const StudentBadgeDashboard = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [inProgressBadges, setInProgressBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Get userId from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userID || decoded.id);
      } catch (e) {
        console.error("Failed to decode token", e);
        setError("Authentication error. Please log in again.");
      }
    } else {
      setError("Please log in to view your badges");
    }
  }, []);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch all badges data in parallel
        const [allBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}`, { headers }),
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}/earned`, { headers }),
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}/in-progress`, { headers })
        ]);
        
        setAllBadges(allBadgesRes.data);
        setEarnedBadges(earnedBadgesRes.data);
        setInProgressBadges(inProgressBadgesRes.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching badges:", err);
        setError("Failed to load badges. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  // Helper function to get badge image or fallback
  const getBadgeImage = (badge) => {
    if (badge?.badge?.imageUrl) {
      return badge.badge.imageUrl.startsWith('http') 
        ? badge.badge.imageUrl 
        : `${API_BASE_URL}${badge.badge.imageUrl}`;
    }
    
    // Fallback images based on badge type
    const type = badge?.badge?.badgeType?.toLowerCase() || 'bronze';
    if (type === 'gold') return '/src/assets/gold-badge.png';
    if (type === 'silver') return '/src/assets/silver-badge.png';
    return '/src/assets/bronze-badge.png';
  };

  // Render badge card
  const BadgeCard = ({ badge, earned = false }) => {
    return (
      <div className={`relative flex flex-col items-center p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${earned ? 'bg-blue-50' : 'bg-white'}`}>
        {/* Badge Image */}
        <div className="relative mb-3">
          <img 
            src={getBadgeImage(badge)} 
            alt={badge.badge.name} 
            className={`w-24 h-24 object-contain ${!earned && 'opacity-60 grayscale'}`}
          />
          {earned && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              ✓
            </div>
          )}
        </div>
        
        {/* Badge Info */}
        <h3 className="text-lg font-semibold text-center text-gray-800">{badge.badge.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-3">{badge.badge.description}</p>
        
        {/* Progress Bar for in-progress badges */}
        {!earned && (
          <div className="w-full mt-auto">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${badge.progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{badge.currentProgress}</span>
              <span>{badge.progressPercentage.toFixed(0)}%</span>
              <span>{badge.requiredProgress}</span>
            </div>
          </div>
        )}
        
        {/* Earned Date */}
        {earned && badge.earnedAt && (
          <div className="mt-auto text-xs text-gray-500">
            Earned on {new Date(badge.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudentNavbar />
        <div className="max-w-5xl mx-auto mt-8 mb-8 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            {error.includes('log in') && (
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // Determine which badges to display based on active tab
  const displayBadges = activeTab === 'all' 
    ? allBadges 
    : activeTab === 'earned' 
      ? earnedBadges 
      : inProgressBadges;

  return (
    <>
      <StudentNavbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">My Achievement Badges</h1>
          
          {/* Badge Stats Summary */}
          <div className="flex space-x-4">
            <div className="bg-blue-100 rounded-lg px-4 py-2 text-center">
              <span className="block text-2xl font-bold text-blue-700">{earnedBadges.length}</span>
              <span className="text-sm text-blue-600">Earned</span>
            </div>
            <div className="bg-yellow-100 rounded-lg px-4 py-2 text-center">
              <span className="block text-2xl font-bold text-yellow-700">{inProgressBadges.length}</span>
              <span className="text-sm text-yellow-600">In Progress</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Badges
            </button>
            <button 
              onClick={() => setActiveTab('earned')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'earned' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Earned
            </button>
            <button 
              onClick={() => setActiveTab('inProgress')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'inProgress' 
                  ? 'border-yellow-500 text-yellow-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              In Progress
            </button>
          </nav>
        </div>

        {/* Badge Grid */}
        {displayBadges.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No badges found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'earned' 
                ? "You haven't earned any badges yet. Keep reading to earn your first badge!" 
                : activeTab === 'inProgress' 
                  ? "No badges in progress. Start reading to unlock new achievements!" 
                  : "No badges available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayBadges.map(badge => (
              <BadgeCard 
                key={badge.id} 
                badge={badge} 
                earned={badge.earned || activeTab === 'earned'}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentBadgeDashboard;