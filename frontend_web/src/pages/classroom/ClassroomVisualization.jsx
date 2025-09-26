
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeahcerNav from '../../components/TeacherNav';
import ClassroomSidebar from '../../components/ClassroomSidebar';
import { Menu, ArrowLeft, BarChart2, Clock, BookOpen, PieChart, Activity, Sparkles, Star, Heart, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, PieChart as RePieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Add API base URL constant
const API_BASE_URL = 'http://localhost:3000';

const ClassroomVisualization = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always open by default
  const [classroomName, setClassroomName] = useState('');
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOnlyClassroomBooks, setShowOnlyClassroomBooks] = useState(false); // Add filter state
  const [classroomBooks, setClassroomBooks] = useState([]); // Add state for classroom books
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Navigate back to progress dashboard
  const goBackToProgress = () => {
    navigate(-1);
  };
  
  // Fetch classroom details
  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClassroomName(response.data.name);
      } catch (err) {
        console.error('Error fetching classroom details:', err);
        setError('Failed to load classroom details. Please try again later.');
      }
    };
    
    fetchClassroomDetails();
  }, [classroomId]);
  
  // Fetch classroom books
  useEffect(() => {
    const fetchClassroomBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) return;
        
        const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classroomId}/books`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClassroomBooks(response.data);
      } catch (err) {
        console.error('Error fetching classroom books:', err);
        // Don't set error here as it's not critical
      }
    };
    
    fetchClassroomBooks();
  }, [classroomId]);
  
  // Fetch student progress data
  useEffect(() => {
    const fetchStudentProgress = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }
        
        // Get classroom data to get student emails
        const classroomResponse = await axios.get(`${API_BASE_URL}/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const classroomData = classroomResponse.data;
        
        // If no students in classroom, return empty array
        if (!classroomData.studentEmails || !Array.isArray(classroomData.studentEmails) || classroomData.studentEmails.length === 0) {
          setProgressData([]);
          setLoading(false);
          return;
        }
        
        // Fetch student details for each email
        const studentPromises = classroomData.studentEmails.map(async (email) => {
          try {
            const userResponse = await axios.get(`${API_BASE_URL}/api/users/by-email/${email}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return userResponse.data;
          } catch (error) {
            console.error(`Error fetching details for student ${email}:`, error);
            return {
              email: email,
              firstName: email.split('@')[0],
              lastName: "",
              userId: null,
              username: email.split('@')[0]
            };
          }
        });
        
        const studentDetails = await Promise.all(studentPromises);
        
        // Fetch progress data for each student
        const progressPromises = studentDetails.map(async (student) => {
          const userId = student.userId || student.id;
          if (!userId) return { ...student, progressData: null };
          
          try {
            // Fetch all progress data in parallel
            const [completedCountRes, inProgressCountRes, completedBooksRes, inProgressBooksRes] = await Promise.all([
              axios.get(`${API_BASE_URL}/api/progress/completed/count/${userId}`, { 
                headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`${API_BASE_URL}/api/progress/in-progress/count/${userId}`, { 
                headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`${API_BASE_URL}/api/progress/completed/${userId}`, { 
                headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`${API_BASE_URL}/api/progress/in-progress/${userId}`, { 
                headers: { Authorization: `Bearer ${token}` }
              }),
            ]);
            
            // Calculate last activity date
            let lastActivityDate = null;
            const inProgressBooks = inProgressBooksRes.data;
            const completedBooks = completedBooksRes.data;
            
            if (inProgressBooks.length > 0) {
              lastActivityDate = new Date(Math.max(...inProgressBooks.map(book => new Date(book.lastReadAt))));
            } else if (completedBooks.length > 0) {
              lastActivityDate = new Date(Math.max(...completedBooks.map(book => new Date(book.endTime))));
            }
            
            // Calculate total reading time across all books
            const totalReadingTimeMinutes = [...inProgressBooks, ...completedBooks].reduce((total, book) => {
              const minutes = typeof book.totalReadingTimeMinutes === 'number' 
                ? book.totalReadingTimeMinutes 
                : (book.totalReadingTime?.seconds ? Math.floor(book.totalReadingTime.seconds / 60) : 0);
              return total + minutes;
            }, 0);
            
            // Fetch snake game attempts and SSA attempts for all books
            const allBooks = [...completedBooks, ...inProgressBooks];
            const snakeAttemptsData = {};
            const ssaAttemptsData = {};
            const predictionAttemptsData = {};
            
            await Promise.all(allBooks.map(async (book) => {
              const bookId = book.book.bookID;
              try {
                const snakeAttemptsRes = await axios.get(
                  `${API_BASE_URL}/api/snake-attempts/user/${userId}/book/${bookId}/count`, 
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                snakeAttemptsData[bookId] = snakeAttemptsRes.data;
                
                // Fetch SSA attempts for this book
                try {
                  const ssaAttemptsRes = await axios.get(
                    `${API_BASE_URL}/api/ssa-attempts/user/${userId}/book/${bookId}/count`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  ssaAttemptsData[bookId] = ssaAttemptsRes.data;
                } catch (err) {
                  console.error(`Error fetching SSA attempts for book ${bookId}:`, err);
                  ssaAttemptsData[bookId] = 0;
                }

                // Fetch prediction attempts
               // Prediction activity: get checkpoint by book, then latest attempt correctness
              try {
                const predictionCheckpointRes = await axios.get(
                  `${API_BASE_URL}/api/prediction-checkpoints/by-book/${bookId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (predictionCheckpointRes.data && predictionCheckpointRes.data.id) {
                  const checkpointId = predictionCheckpointRes.data.id;
                  if (!isNaN(Number(userId)) && !isNaN(Number(checkpointId))) {
                    const predictionLatestAttemptRes = await axios.get(
                      `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${checkpointId}/latest`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (predictionLatestAttemptRes.data && typeof predictionLatestAttemptRes.data.correct === 'boolean') {
                      // Map correctness to numeric attempts-like representation:
                      // 1 if correct (=> 100 pts), 2 if incorrect (=> 0 pts)
                      predictionAttemptsData[bookId] = predictionLatestAttemptRes.data.correct ? 1 : 2;
                    } else {
                      predictionAttemptsData[bookId] = undefined; // no attempt data
                    }
                  } else {
                    predictionAttemptsData[bookId] = undefined;
                  }
                } else {
                  // No checkpoint configured for this book
                  predictionAttemptsData[bookId] = undefined;
                }
              } catch (err) {
                if (err.response && err.response.status === 404) {
                  predictionAttemptsData[bookId] = undefined;
                } else {
                  console.error(`Error fetching prediction attempts for book ${bookId}:`, err);
                  predictionAttemptsData[bookId] = undefined;
                }
              }} catch (err) {
                console.error(`Error fetching attempts for book ${bookId}:`, err);
                snakeAttemptsData[bookId] = 0;
                ssaAttemptsData[bookId] = 0;
                predictionAttemptsData[bookId] = 0;
              }
            }));
            
            // Calculate average comprehension score
            let totalScore = 0;
            let totalActivities = 0;
            
            // Calculate scores for snake game attempts
            Object.entries(snakeAttemptsData).forEach(([bookId, attempts]) => {
              if (attempts > 0) {
                const score = calculateSnakeGameScore(attempts);
                totalScore += score;
                totalActivities++;
              }
            });
            
            // Calculate scores for SSA attempts
            Object.entries(ssaAttemptsData).forEach(([bookId, attempts]) => {
              if (attempts > 0) {
                const score = calculateSSAScore(attempts);
                totalScore += score;
                totalActivities++;
              }
            });

            // Calculate scores for prediction attempts
            Object.entries(predictionAttemptsData).forEach(([bookId, attempts]) => {
              if (attempts > 0) {
                const score = calculatePredictionScore(attempts);
                totalScore += score;
                totalActivities++;
              }
            });
            
            // Calculate average comprehension score
            const avgComprehensionScore = totalActivities > 0 
              ? Math.round(totalScore / totalActivities) 
              : 0;
            
            // Determine status based on activity and scores
            const daysSinceLastActivity = lastActivityDate 
              ? Math.floor((new Date() - lastActivityDate) / (1000 * 60 * 60 * 24)) 
              : null;
              
            let status = 'On Track';
            if (daysSinceLastActivity === null || daysSinceLastActivity > 14) {
              status = 'Needs Attention';
            } else if (avgComprehensionScore < 70) {
              status = 'Needs Attention';
            }
            
            return {
              ...student,
              progressData: {
                completedCount: completedCountRes.data,
                inProgressCount: inProgressCountRes.data,
                completedBooks: completedBooks,
                inProgressBooks: inProgressBooks,
                lastActivityDate: lastActivityDate,
                totalReadingTimeMinutes: totalReadingTimeMinutes,
                avgComprehensionScore: avgComprehensionScore,
                status: status,
                snakeAttemptsData: snakeAttemptsData,
                ssaAttemptsData: ssaAttemptsData,
                predictionAttemptsData: predictionAttemptsData
              }
            };
          } catch (error) {
            console.error(`Error fetching progress for student ${userId}:`, error);
            return { 
              ...student, 
              progressData: {
                completedCount: 0,
                inProgressCount: 0,
                completedBooks: [],
                inProgressBooks: [],
                lastActivityDate: null,
                totalReadingTimeMinutes: 0,
                avgComprehensionScore: 0,
                status: 'Unknown'
              } 
            };
          }
        });
        
        const processedData = await Promise.all(progressPromises);
        setProgressData(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching student progress:', err);
        setError('Failed to load student progress data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchStudentProgress();
  }, [classroomId]);
  
  // Helper functions for calculating scores
  const calculateSnakeGameScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    
    // Scoring logic: starts at 100, minus 2 points for each additional attempt
    const score = 100 - ((attempts - 1) * 2);
    return Math.max(score, 0); // Ensure score doesn't go below 0
  };
  
  // Function to calculate SSA score based on attempts
  const calculateSSAScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
  
    // Scoring logic: starts at 100, minus 25 points for each additional attempt
    const score = 100 - ((attempts - 1) * 25);
    return Math.max(score, 0); // Ensure score doesn't go below 0
  };

  // Add prediction score calculation function
  const calculatePredictionScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    return attempts === 1 ? 100 : 0; // 100 points for 1 attempt, 0 for more attempts
  };
  
  // Helper function to format time
  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };
  
 // Filter student data based on showOnlyClassroomBooks
  const filteredProgressData = progressData.map(student => {
    if (!student.progressData || !showOnlyClassroomBooks) {
      return student;
    }
    
    // Filter completed books that belong to the current classroom
    const filteredCompletedBooks = student.progressData.completedBooks.filter(book => 
      book.book && book.book.classroomId && book.book.classroomId.toString() === classroomId
    );
    
    // Filter in-progress books that belong to the current classroom
    const filteredInProgressBooks = student.progressData.inProgressBooks.filter(book => 
      book.book && book.book.classroomId && book.book.classroomId.toString() === classroomId
    );
    
    // Get all classroom books for calculations
    const allClassroomBooks = [...filteredCompletedBooks, ...filteredInProgressBooks];
    
    // Calculate comprehension scores
    let totalScore = 0;
    let totalActivities = 0;
    
    allClassroomBooks.forEach(book => {
      const bookId = book.book.bookID;
      const snakeAttempts = student.progressData.snakeAttemptsData[bookId] || 0;
      const ssaAttempts = student.progressData.ssaAttemptsData[bookId] || 0;
      const predictionAttempts = student.progressData.predictionAttemptsData[bookId] || 0;
      
      if (snakeAttempts > 0) {
        totalScore += calculateSnakeGameScore(snakeAttempts);
        totalActivities++;
      }
      
      if (ssaAttempts > 0) {
        totalScore += calculateSSAScore(ssaAttempts);
        totalActivities++;
      }
      
      if (predictionAttempts > 0) {
        totalScore += calculatePredictionScore(predictionAttempts);
        totalActivities++;
      }
    });
    
    // Update the filtered student's progress data
    return {
      ...student,
      progressData: {
        ...student.progressData,
        completedBooks: filteredCompletedBooks,
        inProgressBooks: filteredInProgressBooks,
        completedCount: filteredCompletedBooks.length,
        inProgressCount: filteredInProgressBooks.length,
        totalReadingTimeMinutes: allClassroomBooks.reduce((total, book) => {
          const minutes = typeof book.totalReadingTimeMinutes === 'number'
            ? book.totalReadingTimeMinutes
            : (book.totalReadingTime?.seconds ? Math.floor(book.totalReadingTime.seconds / 60) : 0);
          return total + minutes;
        }, 0),
        avgComprehensionScore: totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0
      }
    };
  });
  
  // Prepare data for charts
  const prepareComprehensionScoreData = () => {
    return filteredProgressData.map(student => ({
      name: `${student.firstName} ${student.lastName}`,
      score: student.progressData?.avgComprehensionScore || 0
    }));
  };
  
  const prepareReadingTimeData = () => {
    return filteredProgressData.map(student => ({
      name: `${student.firstName} ${student.lastName}`,
      minutes: student.progressData?.totalReadingTimeMinutes || 0
    }));
  };
  
  const prepareBooksReadData = () => {
    return filteredProgressData.map(student => ({
      name: `${student.firstName} ${student.lastName}`,
      completed: student.progressData?.completedCount || 0,
      inProgress: student.progressData?.inProgressCount || 0
    }));
  };
  
  const prepareStatusDistributionData = () => {
    const statusCounts = {};
    
    filteredProgressData.forEach(student => {
      const status = student.progressData?.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };
  
  // Prepare reading time trend data
  const prepareReadingTimeTrendData = () => {
    const timeData = filteredProgressData.map(student => {
      const books = [...(student.progressData?.completedBooks || []), ...(student.progressData?.inProgressBooks || [])];
      return books.map(book => ({
        name: `${student.firstName} ${student.lastName}`,
        date: new Date(book.lastReadAt || book.endTime).toLocaleDateString(),
        minutes: book.totalReadingTimeMinutes || Math.floor((book.totalReadingTime?.seconds || 0) / 60)
      }));
    }).flat();

    // Sort by date
    timeData.sort((a, b) => new Date(a.date) - new Date(b.date));
    return timeData;
  };

  // Prepare comprehension vs reading time data
  const prepareComprehensionVsTimeData = () => {
    return filteredProgressData.map(student => ({
      name: `${student.firstName} ${student.lastName}`,
      readingTime: student.progressData?.totalReadingTimeMinutes || 0,
      comprehensionScore: student.progressData?.avgComprehensionScore || 0
    }));
  };

  // Helper function to calculate average score
  const calculateAverageScore = (attemptsData, scoreCalculator) => {
    if (!attemptsData) return 0;
    const scores = Object.values(attemptsData)
      .filter(attempts => attempts > 0)
      .map(attempts => scoreCalculator(attempts));
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    'On Track': '#4CAF50',
    'Needs Attention': '#FF5722',
    'Unknown': '#9E9E9E'
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <TeahcerNav />
      
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-20 transition-all duration-150 ease-out ${sidebarOpen ? 'pl-72' : 'pl-0'}`}>
        {/* Simplified decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/10 rounded-full blur-lg"></div>
        </div>
        
        <div className="px-4 sm:px-8 lg:px-12 py-4 max-w-8xl mx-auto w-full relative z-10">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {/* Sidebar Toggle Button */}
              <button 
                onClick={toggleSidebar}
                className="group p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-200 ease-out"
              >
                <Menu size={20} className="text-blue-600 group-hover:text-blue-700" />
              </button>
              
              {/* Simplified decorative elements */}
              <div className="hidden md:flex items-center space-x-2">
                <Sparkles className="text-yellow-500" size={20} />
                <Star className="text-purple-500" size={16} />
                <Heart className="text-red-400" size={16} />
              </div>
            </div>
            
            {/* Professional Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <BarChart2 size={32} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        Data Visualization
                      </h1>
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="mr-2">Classroom:</span>
                        <span className="font-semibold text-gray-800">{classroomName}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Back Button */}
                  <button
                    onClick={goBackToProgress}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 ease-out shadow-lg hover:shadow-xl"
                  >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
                    <span className="font-semibold">Back to Progress Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Error message */}
          {error && (
            <div className="bg-white/70 backdrop-blur-sm border-2 border-red-200 rounded-xl shadow-lg mb-6 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
              <div className="relative z-10 flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <strong className="font-bold text-red-700">Error: </strong>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Simplified Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-200 border-t-purple-600 mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700">Loading visualization data...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your analytics</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Book Filter Toggle */}
              <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Activity size={16} className="text-white" />
                      </div>
                      <span className="font-semibold text-gray-800">Data Filter:</span>
                    </div>
                    <div className="flex bg-white/50 backdrop-blur-sm rounded-xl p-1 border border-white/50">
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                          !showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-white/50'
                        }`}
                        onClick={() => setShowOnlyClassroomBooks(false)}
                      >
                        All Books (Classroom + OOB)
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                          showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-white/50'
                        }`}
                        onClick={() => setShowOnlyClassroomBooks(true)}
                      >
                        Classroom Books Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Comprehension Scores Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <BarChart2 size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Comprehension Scores</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareComprehensionScoreData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Bar dataKey="score" name="Comprehension Score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comprehension vs Reading Time Scatter Plot */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <Activity size={20} className="text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Comprehension Score vs Reading Time</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="readingTime"
                          name="Reading Time"
                          label={{ value: 'Total Reading Time (minutes)', position: 'bottom' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="comprehensionScore"
                          name="Comprehension Score"
                          label={{ value: 'Comprehension Score', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value, name, props) => [
                            `${value}${name === 'Reading Time' ? ' minutes' : '%'}`,
                            `${props.payload.name} - ${name}`
                          ]}
                        />
                        <Scatter
                          name="Students"
                          data={prepareComprehensionVsTimeData()}
                          fill="#8884d8"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reading Time Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Clock size={20} className="text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Reading Time</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareReadingTimeData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatTime(value), 'Reading Time']} />
                        <Legend />
                        <Bar dataKey="minutes" name="Reading Time (minutes)" fill="#FF5722" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reading Time Trend Line Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-teal-100 p-2 rounded-full mr-3">
                      <Activity size={20} className="text-teal-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Reading Time Trends</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareReadingTimeTrendData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="minutes" 
                          name="Reading Time" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Books Read Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <BookOpen size={20} className="text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Books Read</h2>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareBooksReadData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        stackOffset="none"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, name === 'completed' ? 'Completed Books' : 'Books in Progress']}
                        />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" fill="#4CAF50" stackId="a" />
                        <Bar dataKey="inProgress" name="In Progress" fill="#FFC107" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
  
                {/* Status Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <PieChart size={20} className="text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Student Status Distribution</h2>
                  </div>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={prepareStatusDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareStatusDistributionData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [value, 'Students']} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Student Performance Radar Chart */}
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <Activity size={20} className="text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold">Top 5 Student Performance Overview</h2>
                </div>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      cx="50%" 
                      cy="50%" 
                      outerRadius="80%" 
                      data={filteredProgressData
                        .filter(student => student.progressData)
                        .sort((a, b) => (b.progressData.avgComprehensionScore || 0) - (a.progressData.avgComprehensionScore || 0))
                        .slice(0, 5)
                        .map(student => ({
                          name: `${student.firstName} ${student.lastName}`,
                          comprehension: student.progressData.avgComprehensionScore || 0,
                          booksRead: student.progressData.completedCount || 0,
                          readingTime: Math.min(100, (student.progressData.totalReadingTimeMinutes || 0) / 10),
                          activity: student.progressData.lastActivityDate 
                            ? 100 - Math.min(100, Math.floor((new Date() - new Date(student.progressData.lastActivityDate)) / (1000 * 60 * 60 * 24)) * 5)
                            : 0
                        }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Comprehension" dataKey="comprehension" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Books Read" dataKey="booksRead" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Radar name="Reading Time" dataKey="readingTime" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                      <Radar name="Recent Activity" dataKey="activity" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomVisualization;