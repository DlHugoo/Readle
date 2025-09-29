import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentNavbar from '../../components/StudentNavbar';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = 'http://localhost:3000';

const StudentBadgeDashboard = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [inProgressBadges, setInProgressBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);
        
        // Use uid from the token (not userId)
        setUserId(decoded.uid);
        
        // If uid is not available in the token, log an error
        if (!decoded.uid) {
          console.error("No uid found in token:", decoded);
          setError("User ID not found in authentication token");
        }
      } catch (e) {
        console.error("Failed to decode token", e);
        setError("Authentication error. Please log in again.");
      }
    } else {
      setError("Please log in to view your badges");
    }
  }, []);

  // Fetch badges when userId is available
  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) {
        console.log("No userId available, skipping fetch");
        return;
      }
      
      console.log("Fetching badges for userId:", userId);
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const axiosOptions = { 
          headers, 
          timeout: 10000 // 10 seconds timeout
        };
        
        // First fetch all available badges
        const allBadgesRes = await axios.get(`${API_BASE_URL}/api/badges`, axiosOptions);
        const availableBadges = allBadgesRes.data || [];
        
        // Then fetch user-specific badge progress
        const [userBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}`, axiosOptions),
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}/earned`, axiosOptions),
          axios.get(`${API_BASE_URL}/api/badges/user/${userId}/in-progress`, axiosOptions)
        ]);
        
        const userBadges = userBadgesRes.data || [];
        setEarnedBadges(earnedBadgesRes.data || []);
        setInProgressBadges(inProgressBadgesRes.data || []);
        
        // Create a map of badge IDs that the user already has progress on
        const userBadgeMap = new Map();
        userBadges.forEach(badge => {
          if (badge.badge && badge.badge.id) {
            userBadgeMap.set(badge.badge.id, badge);
          }
        });
        
        // Create a complete list of all badges, including ones the user hasn't started yet
        const completeBadgesList = availableBadges.map(badge => {
          // If user already has this badge in their progress, use that
          if (userBadgeMap.has(badge.id)) {
            return userBadgeMap.get(badge.id);
          }
          
          // Otherwise create a placeholder badge with 0 progress
          return {
            id: `placeholder-${badge.id}`,
            badge: badge,
            isEarned: false,
            earnedAt: null,
            currentProgress: 0,
            requiredProgress: badge.thresholdValue,
            progressPercentage: 0
          };
        });
        
        setAllBadges(completeBadgesList);
        setError(null);
      } catch (err) {
        console.error("Error fetching badges:", err.response || err);
        let errorMessage = "Failed to load badges. Please try again later.";
        
        if (err.response) {
          errorMessage = `Server error: ${err.response.status} - ${err.response.data.message || err.response.statusText}`;
        } else if (err.request) {
          errorMessage = "No response from server. Please check your connection.";
        } else {
          errorMessage = `Error: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  
    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  const getBadgeImage = (badge) => {
    if (badge && badge.badge && badge.badge.imageUrl) {
      if (badge.badge.imageUrl.startsWith('http')) {
        return badge.badge.imageUrl;
      }
      return `${API_BASE_URL}${badge.badge.imageUrl}`;
    }
    
    const type = badge?.badge?.badgeType?.toLowerCase() || 'bronze';
    if (type === 'gold') return '/src/assets/badges/trophy.png';
    if (type === 'silver') return '/src/assets/badges/medal.png';
    return '/src/assets/badges/medal.png'; // Bronze default
  };

  const getBadgeCategoryIcon = (criteria) => {
    switch(criteria) {
      case 'LOGIN_COUNT':
        return '👋';
      case 'BOOKS_COMPLETED':
        return '📚';
      case 'GENRES_READ':
        return '🔍';
      case 'READING_TIME':
        return '⏱️';
      case 'PAGES_READ':
        return '📄';
      default:
        return '🏆';
    }
  };

  const BadgeCard = ({ badge, earned = false }) => {
    if (!badge || !badge.badge) {
      console.error("Invalid badge data:", badge);
      return (
        <div className="relative flex flex-col items-center p-6 rounded-2xl shadow-lg bg-red-50 border border-red-200">
          <p className="text-red-500 font-medium">Invalid badge data</p>
        </div>
      );
    }
    
    const criteria = badge.badge.achievementCriteria;
    const categoryIcon = getBadgeCategoryIcon(criteria);
    
    return (
      <div className={`relative flex flex-col items-center p-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        earned 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        {/* Category Icon */}
        <div className="absolute top-4 right-4 text-2xl bg-white rounded-full p-2 shadow-md" title={criteria}>
          {categoryIcon}
        </div>
        
        {/* Badge Image */}
        <div className="relative mb-4">
          <img 
            src={getBadgeImage(badge)} 
            alt={badge.badge.name} 
            className={`w-28 h-28 object-contain transition-all duration-300 ${!earned && 'opacity-60 grayscale'}`}
          />
          {earned && (
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg animate-pulse">
              ✓
            </div>
          )}
        </div>
        
        {/* Badge Info */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{badge.badge.name}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{badge.badge.description}</p>
        </div>
        
        {/* Progress Section */}
        {!earned && (
          <div className="w-full mt-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm font-bold text-blue-600">{badge.progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${badge.progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {badge.currentProgress}
              </span>
              <span className="text-gray-400">of</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                {badge.requiredProgress}
              </span>
            </div>
          </div>
        )}
        
        {/* Earned Badge Info */}
        {earned && badge.earnedAt && (
          <div className="mt-auto text-center">
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
              🎉 Earned!
            </div>
            <div className="text-xs text-gray-500">
              Earned on {new Date(badge.earnedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🏆 Achievement Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-6">Celebrate your reading milestones and unlock amazing badges!</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-purple-500">
              <div className="bg-purple-100 rounded-full p-4 mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <span className="text-gray-600 text-xl mb-3 font-medium">Total Badges</span>
              <span className="text-5xl font-bold text-purple-600">{allBadges.length}</span>
              <div className="mt-2 text-sm text-gray-500">Available to earn</div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-green-500">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <span className="text-gray-600 text-xl mb-3 font-medium">Earned Badges</span>
              <span className="text-5xl font-bold text-green-600">{earnedBadges.length}</span>
              <div className="mt-2 text-sm text-gray-500">Congratulations!</div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform hover:scale-105 transition-all duration-300 border-l-4 border-blue-500">
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <span className="text-gray-600 text-xl mb-3 font-medium">In Progress</span>
              <span className="text-5xl font-bold text-blue-600">{inProgressBadges.length}</span>
              <div className="mt-2 text-sm text-gray-500">Keep going!</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-full p-2 flex space-x-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === 'all' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🏆 All Badges
                </button>
                <button
                  onClick={() => setActiveTab('earned')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === 'earned' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✅ Earned Badges
                </button>
                <button
                  onClick={() => setActiveTab('in-progress')}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === 'in-progress' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎯 In Progress
                </button>
              </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-4 text-lg text-gray-600">Loading badges...</span>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
                    <strong className="font-bold">Error: </strong>
                    {error}
                  </div>
                </div>
              ) : activeTab === 'all' ? (
                allBadges.length > 0 ? (
                  allBadges.map((badge) => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge} 
                      earned={earnedBadges.some((eb) => eb.badge?.id === badge.badge?.id)} 
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <p className="text-gray-500 text-xl">No badges available yet.</p>
                    <p className="text-gray-400 mt-2">Check back later for new achievements!</p>
                  </div>
                )
              ) : activeTab === 'earned' ? (
                earnedBadges.length > 0 ? (
                  earnedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} earned />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-500 text-xl">You haven't earned any badges yet.</p>
                    <p className="text-gray-400 mt-2">Keep reading to unlock your first achievement!</p>
                  </div>
                )
              ) : (
                inProgressBadges.length > 0 ? (
                  inProgressBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-500 text-xl">No badges in progress.</p>
                    <p className="text-gray-400 mt-2">Start reading to begin earning badges!</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentBadgeDashboard;
