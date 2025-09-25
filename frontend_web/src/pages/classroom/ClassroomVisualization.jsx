
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeahcerNav from '../../components/TeacherNav';
import ClassroomSidebar from '../../components/ClassroomSidebar';
import { Menu, ArrowLeft, BarChart2, Clock, BookOpen, PieChart, Activity } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-gray-50">
      <TeahcerNav />
      
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`pt-[72px] transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-6">
          {/* Header with toggle sidebar button and back button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 p-2 rounded-md hover:bg-gray-200"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{classroomName} - Data Visualization</h1>
            </div>
            <button
              onClick={goBackToProgress}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Progress Dashboard
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Book Filter Toggle */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Show books:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        !showOnlyClassroomBooks 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setShowOnlyClassroomBooks(false)}
                    >
                      All Books (Classroom + OOB)
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        showOnlyClassroomBooks 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setShowOnlyClassroomBooks(true)}
                    >
                      Classroom Books Only
                    </button>
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