import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000';

const StudentProgressModal = ({
  isOpen,
  onClose,
  selectedStudent,
  progressLoading,
  progressError,
  progressStats,
  completedBooks,
  inProgressBooks,
  snakeGameAttempts,
  ssaAttempts,
  predictionAttempts
}) => {
  const [activeView, setActiveView] = useState('progress');
  const [badges, setBadges] = useState({ all: [], earned: [], inProgress: [] });
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState(null);
  const [activeBadgeTab, setActiveBadgeTab] = useState('all');

  useEffect(() => {
    if (isOpen && selectedStudent && activeView === 'badges') {
      fetchBadges();
    }
  }, [isOpen, selectedStudent, activeView]);

  const fetchBadges = async () => {
    if (!selectedStudent?.id) return;
    
    setBadgesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const axiosOptions = { headers, timeout: 10000 };

      const [allBadgesRes, userBadgesRes, earnedBadgesRes, inProgressBadgesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/badges`, axiosOptions),
        axios.get(`${API_BASE_URL}/api/badges/user/${selectedStudent.id}`, axiosOptions),
        axios.get(`${API_BASE_URL}/api/badges/user/${selectedStudent.id}/earned`, axiosOptions),
        axios.get(`${API_BASE_URL}/api/badges/user/${selectedStudent.id}/in-progress`, axiosOptions)
      ]);

      const availableBadges = allBadgesRes.data || [];
      const userBadges = userBadgesRes.data || [];
      
      const userBadgeMap = new Map();
      userBadges.forEach(badge => {
        if (badge.badge && badge.badge.id) {
          userBadgeMap.set(badge.badge.id, badge);
        }
      });

      const completeBadgesList = availableBadges.map(badge => {
        if (userBadgeMap.has(badge.id)) {
          return userBadgeMap.get(badge.id);
        }
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

      setBadges({
        all: completeBadgesList,
        earned: earnedBadgesRes.data || [],
        inProgress: inProgressBadgesRes.data || []
      });
      setBadgesError(null);
    } catch (err) {
      console.error("Error fetching badges:", err);
      setBadgesError("Failed to load badges. Please try again later.");
    } finally {
      setBadgesLoading(false);
    }
  };

  const calculateAverageScores = () => {
    const allBooks = [...completedBooks, ...inProgressBooks];
    let snakeTotal = 0, snakeCount = 0;
    let ssaTotal = 0, ssaCount = 0;
    let predictionTotal = 0, predictionCount = 0;

    allBooks.forEach(book => {
      const bookId = book.book.bookID;
      if (snakeGameAttempts && snakeGameAttempts[bookId] > 0) {
        snakeTotal += calculateSnakeGameScore(snakeGameAttempts[bookId]);
        snakeCount++;
      }
      if (ssaAttempts && ssaAttempts[bookId] > 0) {
        ssaTotal += calculateSSAScore(ssaAttempts[bookId]);
        ssaCount++;
      }
      if (predictionAttempts && predictionAttempts[bookId] > 0) {
        predictionTotal += calculatePredictionScore(predictionAttempts[bookId]);
        predictionCount++;
      }
    });

    return {
      snakeGame: snakeCount > 0 ? Math.round(snakeTotal / snakeCount) : 0,
      ssa: ssaCount > 0 ? Math.round(ssaTotal / ssaCount) : 0,
      prediction: predictionCount > 0 ? Math.round(predictionTotal / predictionCount) : 0
    };
  };

  // Helper function to format reading time
  const formatDuration = (minutes, fallbackDuration) => {
    let mins = minutes;
    if (typeof mins !== 'number' || isNaN(mins)) {
      if (typeof fallbackDuration === 'object' && fallbackDuration !== null && 'seconds' in fallbackDuration) {
        mins = Math.floor(fallbackDuration.seconds / 60);
      } else if (typeof fallbackDuration === 'number') {
        mins = Math.floor(fallbackDuration / 60);
      } else {
        mins = 0;
      }
    }
    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Functions to calculate scores based on attempts
  const calculateSnakeGameScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 2);
    return Math.max(score, 0);
  };

  const calculateSSAScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 25);
    return Math.max(score, 0);
  };

  const calculatePredictionScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    return attempts === 1 ? 100 : 0; // 100 points for 1 attempt, 0 for more attempts
  };

  const getBadgeImage = (badge) => {
    if (badge?.badge?.imageUrl) {
      return badge.badge.imageUrl.startsWith('http') 
        ? badge.badge.imageUrl 
        : `${API_BASE_URL}${badge.badge.imageUrl}`;
    }
    const type = badge?.badge?.badgeType?.toLowerCase() || 'bronze';
    return type === 'gold' ? '/src/assets/badges/trophy.png' : '/src/assets/badges/medal.png';
  };

  const BadgeCard = ({ badge, earned = false }) => {
    if (!badge?.badge) return null;

    return (
      <div className={`relative flex flex-col items-center p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${earned ? 'bg-blue-50' : 'bg-white'}`}>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedStudent?.firstName || ''} {selectedStudent?.lastName || ''}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('progress')}
                className={`px-3 py-1 rounded-md ${activeView === 'progress' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Progress
              </button>
              <button
                onClick={() => setActiveView('badges')}
                className={`px-3 py-1 rounded-md ${activeView === 'badges' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Badges
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {activeView === 'progress' ? (
            // Progress View
            progressLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : progressError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{progressError}</span>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <span className="text-gray-500 text-lg mb-2">Completed Books</span>
                    <span className="text-4xl font-bold text-blue-600">{progressStats.completedCount}</span>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <span className="text-gray-500 text-lg mb-2">Books in Progress</span>
                    <span className="text-4xl font-bold text-yellow-500">{progressStats.inProgressCount}</span>
                  </div>
                </div>

                {/* Add Average Activity Scores */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-700">Average Activity Scores</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Snake Game Average */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-semibold">🐍 Snake Game</span>
                        <span className="text-2xl font-bold text-green-600">{calculateAverageScores().snakeGame}</span>
                      </div>
                    </div>
                    {/* SSA Average */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-semibold">🧩 Sequencing</span>
                        <span className="text-2xl font-bold text-blue-600">{calculateAverageScores().ssa}</span>
                      </div>
                    </div>
                    {/* Prediction Average */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-semibold">🔮 Prediction</span>
                        <span className="text-2xl font-bold text-purple-600">{calculateAverageScores().prediction}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Books in Progress */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-700">Books in Progress</h2>
                  <ul>
                    {inProgressBooks.length === 0 && (
                      <li className="text-gray-400 italic">No books in progress.</li>
                    )}
                    {inProgressBooks.map((book) => (
                      <li key={`in-progress-${book.id}`} className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center">
                            {book.book.imageURL ? (
                              <img 
                                src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                alt={book.book.title}
                                className="w-16 h-20 object-cover rounded mr-4"
                                title={book.book.title}
                              />
                            ) : (
                              <div className="w-16 h-20 bg-gray-200 rounded mr-4 flex items-center justify-center">
                                <span className="text-gray-400">No Image</span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-800">{book.book.title}</h3>
                              <div className="text-sm text-gray-500 mt-1">
                                Last read: {book.lastReadAt ? new Date(book.lastReadAt).toLocaleDateString() : 'Never'}<br />
                                Page {book.lastPageRead} of {book.book.pageIds ? book.book.pageIds.length : 1} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                                {snakeGameAttempts && snakeGameAttempts[book.book.bookID] > 0 && (
                                  <div className="mt-1 text-green-600">
                                    <span role="img" aria-label="snake">🐍</span> Snake Game Score: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])} points
                                  </div>
                                )}
                                {ssaAttempts && ssaAttempts[book.book.bookID] > 0 && (
                                  <div className="mt-1 text-blue-600">
                                    <span role="img" aria-label="puzzle">🧩</span> Sequencing Score: {calculateSSAScore(ssaAttempts[book.book.bookID])} points
                                  </div>
                                )}
                                {predictionAttempts && typeof predictionAttempts[book.book.bookID] === 'number' && predictionAttempts[book.book.bookID] > 0 && (
                                  <div className="mt-1 text-purple-600">
                                    <span role="img" aria-label="crystal-ball">🔮</span> Prediction Score: {calculatePredictionScore(predictionAttempts[book.book.bookID])} points
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-full md:w-1/2 mt-2 md:mt-0">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-500 h-3 rounded-full"
                                style={{ width: `${book.book.pageIds && book.lastPageRead ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 text-right">
                              {book.book.pageIds ? Math.round((book.lastPageRead / book.book.pageIds.length) * 100) : 0}% complete
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Completed Books */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-700">Completed Books</h2>
                  <ul>
                    {completedBooks.length === 0 && (
                      <li className="text-gray-400 italic">No completed books yet.</li>
                    )}
                    {completedBooks.map((book) => (
                      <li key={`completed-${book.id}`} className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center">
                            {book.book.imageURL ? (
                              <img 
                                src={book.book.imageURL.startsWith('http') ? book.book.imageURL : `${API_BASE_URL}${book.book.imageURL}`} 
                                alt={book.book.title}
                                className="w-16 h-20 object-cover rounded mr-4"
                                title={book.book.title}
                              />
                            ) : (
                              <div className="w-16 h-20 bg-gray-200 rounded mr-4 flex items-center justify-center">
                                <span className="text-gray-400">No Image</span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-800">{book.book.title}</h3>
                              <div className="text-sm text-gray-500 mt-1">
                                Completed on: {book.endTime ? new Date(book.endTime).toLocaleDateString() : 'Unknown'}<br />
                                Total pages: {book.book.pageIds ? book.book.pageIds.length : 1} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <div className="text-sm text-gray-600">Reading Progress: 100%</div>
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                              <div className="bg-green-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                            {snakeGameAttempts && snakeGameAttempts[book.book.bookID] > 0 && (
                              <div className="mt-2 text-green-600 text-sm">
                                <span role="img" aria-label="snake">🐍</span> Snake Game Score: {calculateSnakeGameScore(snakeGameAttempts[book.book.bookID])} points
                              </div>
                            )}
                            {ssaAttempts && ssaAttempts[book.book.bookID] > 0 && (
                              <div className="mt-1 text-blue-600 text-sm">
                                <span role="img" aria-label="puzzle">🧩</span> Sequencing Score: {calculateSSAScore(ssaAttempts[book.book.bookID])} points
                              </div>
                            )}
                            {predictionAttempts && typeof predictionAttempts[book.book.bookID] === 'number' && predictionAttempts[book.book.bookID] > 0 && (
                              <div className="mt-1 text-purple-600 text-sm">
                                <span role="img" aria-label="crystal-ball">🔮</span> Prediction Score: {calculatePredictionScore(predictionAttempts[book.book.bookID])} points
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )
          ) : (
            // Badges View
            <div>
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => setActiveBadgeTab('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeBadgeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All Badges
                </button>
                <button
                  onClick={() => setActiveBadgeTab('earned')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors mx-2 ${
                    activeBadgeTab === 'earned' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Earned Badges
                </button>
                <button
                  onClick={() => setActiveBadgeTab('in-progress')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeBadgeTab === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  In Progress
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {badgesLoading ? (
                  <p className="text-center col-span-full">Loading badges...</p>
                ) : badgesError ? (
                  <p className="text-center col-span-full text-red-500">{badgesError}</p>
                ) : activeBadgeTab === 'all' ? (
                  badges.all.length > 0 ? (
                    badges.all.map((badge) => (
                      <BadgeCard 
                        key={badge.id} 
                        badge={badge} 
                        earned={badges.earned.some((eb) => eb.badge?.id === badge.badge?.id)} 
                      />
                    ))
                  ) : (
                    <p className="text-center col-span-full text-gray-500">No badges available yet.</p>
                  )
                ) : activeBadgeTab === 'earned' ? (
                  badges.earned.length > 0 ? (
                    badges.earned.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} earned />
                    ))
                  ) : (
                    <p className="text-center col-span-full text-gray-500">No badges earned yet.</p>
                  )
                ) : (
                  badges.inProgress.length > 0 ? (
                    badges.inProgress.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))
                  ) : (
                    <p className="text-center col-span-full text-gray-500">No badges in progress.</p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgressModal;