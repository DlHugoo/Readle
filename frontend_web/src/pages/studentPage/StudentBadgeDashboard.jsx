import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAccessToken } from '../../api/api';
import StudentNavbar from '../../components/StudentNavbar';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';

import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

const StudentBadgeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [inProgressBadges, setInProgressBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch badges when userId is available
  useEffect(() => {
    const fetchBadges = async () => {
      if (!user?.userId) {
        console.log("No userId available, skipping fetch");
        return;
      }
      
      console.log("Fetching badges for userId:", user.userId);
      try {
        setLoading(true);
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const axiosOptions = { headers, withCredentials: true, timeout: 10000 };
        
        // First, refresh all badge progress to ensure we have the latest data
        try {
          await axios.post(`${API_BASE_URL}/api/badges/user/${user.userId}/check-all`, {}, axiosOptions);
          console.log("Refreshed badge progress for user:", user.userId);
        } catch (refreshErr) {
          console.warn("Could not refresh badge progress:", refreshErr);
          // Continue with normal fetch even if refresh fails
        }
        
        // Then fetch all available badges
        const allBadgesRes = await axios.get(`${API_BASE_URL}/api/badges`, axiosOptions);
        const availableBadges = allBadgesRes.data || [];
        
        // Then fetch user-specific badge progress
        const [userBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}`, axiosOptions),
          axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/earned`, axiosOptions),
          axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/in-progress`, axiosOptions)
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
  
    if (user?.userId) {
      fetchBadges();
    }
  }, [user?.userId]);

  // Auto-refresh badges every 30 seconds to keep data current
  useEffect(() => {
    if (!user?.userId) return;
    
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing badge data...");
      // Trigger a silent refresh
      const refreshBadges = async () => {
        try {
          const token = getAccessToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          // Refresh badge progress
          await axios.post(`${API_BASE_URL}/api/badges/user/${user.userId}/check-all`, {}, { headers });
          
          // Fetch updated badge data
          const [userBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}`, { headers }),
            axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/earned`, { headers }),
            axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/in-progress`, { headers })
          ]);
          
          const userBadges = userBadgesRes.data || [];
          setEarnedBadges(earnedBadgesRes.data || []);
          setInProgressBadges(inProgressBadgesRes.data || []);
          
          // Update all badges list
          const userBadgeMap = new Map();
          userBadges.forEach(badge => {
            if (badge.badge && badge.badge.id) {
              userBadgeMap.set(badge.badge.id, badge);
            }
          });
          
          setAllBadges(prevBadges => {
            return prevBadges.map(badge => {
              if (userBadgeMap.has(badge.badge.id)) {
                return userBadgeMap.get(badge.badge.id);
              }
              return badge;
            });
          });
          
          console.log("Badge data refreshed successfully");
        } catch (err) {
          console.warn("Failed to refresh badge data:", err);
        }
      };
      
      refreshBadges();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [user?.userId]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!user?.userId || refreshing) return;
    
    setRefreshing(true);
    try {
      const token = getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Refresh badge progress
      await axios.post(`${API_BASE_URL}/api/badges/user/${user.userId}/check-all`, {}, { headers, withCredentials: true });
      
      // Fetch updated badge data
      const [userBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}`, { headers, withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/earned`, { headers, withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/badges/user/${user.userId}/in-progress`, { headers, withCredentials: true })
      ]);
      
      const userBadges = userBadgesRes.data || [];
      setEarnedBadges(earnedBadgesRes.data || []);
      setInProgressBadges(inProgressBadgesRes.data || []);
      
      // Update all badges list
      const userBadgeMap = new Map();
      userBadges.forEach(badge => {
        if (badge.badge && badge.badge.id) {
          userBadgeMap.set(badge.badge.id, badge);
        }
      });
      
      setAllBadges(prevBadges => {
        return prevBadges.map(badge => {
          if (userBadgeMap.has(badge.badge.id)) {
            return userBadgeMap.get(badge.badge.id);
          }
          return badge;
        });
      });
      
      console.log("Badge data manually refreshed successfully");
    } catch (err) {
      console.error("Failed to manually refresh badge data:", err);
    } finally {
      setRefreshing(false);
    }
  };

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
        <div className="relative flex flex-col items-center p-4 rounded-lg shadow-md bg-red-50">
          <p className="text-red-500">Invalid badge data</p>
        </div>
      );
    }
    
    const criteria = badge.badge.achievementCriteria;
    const categoryIcon = getBadgeCategoryIcon(criteria);
    
    return (
      <div className={`relative flex flex-col items-center p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${earned ? 'bg-blue-50' : 'bg-white'}`}>
        <div className="absolute top-2 right-2 text-lg" title={criteria}>
          {categoryIcon}
        </div>
        
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
        
        <h3 className="text-lg font-semibold text-center text-gray-800">{badge.badge.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-3">{badge.badge.description}</p>
        
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
        
        {earned && badge.earnedAt && (
          <div className="mt-auto text-xs text-gray-500">
            Earned on {new Date(badge.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <StudentNavbar />
      <div className="max-w-5xl mx-auto mt-8 mb-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Achievements</h1>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              refreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh Progress'}
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Badges
          </button>
          <button
            onClick={() => setActiveTab('earned')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors mx-2 ${
              activeTab === 'earned' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Earned Badges
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            In Progress
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-center col-span-full">Loading badges...</p>
          ) : error ? (
            <p className="text-center col-span-full text-red-500">{error}</p>
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
              <p className="text-center col-span-full text-gray-500">No badges available yet.</p>
            )
          ) : activeTab === 'earned' ? (
            earnedBadges.length > 0 ? (
              earnedBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} earned />
              ))
            ) : (
              <p className="text-center col-span-full text-gray-500">You haven't earned any badges yet.</p>
            )
          ) : (
            inProgressBadges.length > 0 ? (
              inProgressBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))
            ) : (
              <p className="text-center col-span-full text-gray-500">No badges in progress.</p>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default StudentBadgeDashboard;