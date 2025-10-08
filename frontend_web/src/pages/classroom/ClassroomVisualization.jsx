
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
import { getApiBaseUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

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
            const totalReadingTimeSeconds = [...inProgressBooks, ...completedBooks].reduce((total, book) => {
              const seconds = typeof book.totalReadingTimeSeconds === 'number' 
                ? book.totalReadingTimeSeconds 
                : (book.totalReadingTime?.seconds ? book.totalReadingTime.seconds : 0);
              return total + seconds;
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
                totalReadingTimeSeconds: totalReadingTimeSeconds,
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
                totalReadingTimeSeconds: 0,
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
  const formatTime = (totalReadingTimeSeconds) => {
    // Handle the case where totalReadingTimeSeconds might be undefined or null
    if (!totalReadingTimeSeconds || typeof totalReadingTimeSeconds !== 'number' || isNaN(totalReadingTimeSeconds)) {
      return '0h 0m 0s';
    }
    
    const totalSeconds = Math.floor(totalReadingTimeSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
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
        totalReadingTimeSeconds: allClassroomBooks.reduce((total, book) => {
          const seconds = typeof book.totalReadingTimeSeconds === 'number'
            ? book.totalReadingTimeSeconds
            : (book.totalReadingTime?.seconds ? book.totalReadingTime.seconds : 0);
          return total + seconds;
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
      seconds: student.progressData?.totalReadingTimeSeconds || 0
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
  
  // Prepare book engagement metrics
  const prepareBookEngagementData = () => {
    const engagementData = [];
    
    // Get all unique books from all students
    const allBooks = new Set();
    filteredProgressData.forEach(student => {
      if (!student.progressData) return;
      const books = [...(student.progressData.completedBooks || []), ...(student.progressData.inProgressBooks || [])];
      books.forEach(book => allBooks.add(book.book.bookID));
    });
    
    // Calculate engagement metrics for each book
    Array.from(allBooks).forEach(bookId => {
      let totalStudents = 0;
      let studentsWithActivities = 0;
      let totalActivities = 0;
      let totalReadingTime = 0;
      let bookTitle = '';
      
      filteredProgressData.forEach(student => {
        if (!student.progressData) return;
        
        const books = [...(student.progressData.completedBooks || []), ...(student.progressData.inProgressBooks || [])];
        const studentBook = books.find(book => book.book.bookID === bookId);
        
        if (studentBook) {
          totalStudents++;
          bookTitle = studentBook.book.title;
          
          const snakeAttempts = student.progressData.snakeAttemptsData[bookId] || 0;
          const ssaAttempts = student.progressData.ssaAttemptsData[bookId] || 0;
          const predictionAttempts = student.progressData.predictionAttemptsData[bookId] || 0;
          
          const studentActivities = snakeAttempts + ssaAttempts + predictionAttempts;
          if (studentActivities > 0) {
            studentsWithActivities++;
            totalActivities += studentActivities;
          }
          
          const readingTime = studentBook.totalReadingTimeSeconds || (studentBook.totalReadingTime?.seconds || 0);
          totalReadingTime += readingTime;
        }
      });
      
      if (totalStudents > 0) {
        engagementData.push({
          bookTitle: bookTitle.length > 20 ? bookTitle.substring(0, 20) + '...' : bookTitle,
          totalStudents: totalStudents,
          studentsWithActivities: studentsWithActivities,
          engagementRate: Math.round((studentsWithActivities / totalStudents) * 100),
          avgActivitiesPerStudent: studentsWithActivities > 0 ? Math.round(totalActivities / studentsWithActivities) : 0,
          avgReadingTime: Math.round(totalReadingTime / totalStudents / 60) // Convert to minutes
        });
      }
    });
    
    return engagementData.sort((a, b) => b.engagementRate - a.engagementRate);
  };

  // Prepare student book usage statistics
  const prepareStudentBookUsageData = () => {
    return filteredProgressData.map(student => {
      if (!student.progressData) {
        return {
          name: `${student.firstName} ${student.lastName}`,
          booksStarted: 0,
          booksCompleted: 0,
          totalReadingTime: 0,
          avgScore: 0
        };
      }
      
      const booksStarted = (student.progressData.completedCount || 0) + (student.progressData.inProgressCount || 0);
      const booksCompleted = student.progressData.completedCount || 0;
      const totalReadingTime = Math.round((student.progressData.totalReadingTimeSeconds || 0) / 60); // Convert to minutes
      const avgScore = student.progressData.avgComprehensionScore || 0;
      
      return {
        name: `${student.firstName} ${student.lastName}`,
        booksStarted: booksStarted,
        booksCompleted: booksCompleted,
        totalReadingTime: totalReadingTime,
        avgScore: avgScore,
        completionRate: booksStarted > 0 ? Math.round((booksCompleted / booksStarted) * 100) : 0
      };
    });
  };

  // Prepare book completion rates by book
  const prepareBookCompletionData = () => {
    const bookData = {};
    
    filteredProgressData.forEach(student => {
      if (!student.progressData) return;
      
      const books = [...(student.progressData.completedBooks || []), ...(student.progressData.inProgressBooks || [])];
      
      books.forEach(book => {
        const bookId = book.book.bookID;
        const bookTitle = book.book.title;
        
        if (!bookData[bookId]) {
          bookData[bookId] = {
            bookTitle: bookTitle,
            totalStudents: 0,
            completedStudents: 0,
            inProgressStudents: 0,
            avgReadingTime: 0,
            totalReadingTime: 0
          };
        }
        
        bookData[bookId].totalStudents++;
        
        // Check if book is completed or in progress
        const isCompleted = student.progressData.completedBooks?.some(completedBook => 
          completedBook.book.bookID === bookId
        );
        
        if (isCompleted) {
          bookData[bookId].completedStudents++;
        } else {
          bookData[bookId].inProgressStudents++;
        }
        
        // Add reading time
        const readingTime = book.totalReadingTimeSeconds || (book.totalReadingTime?.seconds || 0);
        bookData[bookId].totalReadingTime += readingTime;
      });
    });
    
    return Object.values(bookData).map(book => ({
      bookTitle: book.bookTitle.length > 25 ? book.bookTitle.substring(0, 25) + '...' : book.bookTitle,
      completed: book.completedStudents,
      inProgress: book.inProgressStudents,
      completionRate: book.totalStudents > 0 ? Math.round((book.completedStudents / book.totalStudents) * 100) : 0,
      avgReadingTime: book.totalStudents > 0 ? Math.round(book.totalReadingTime / book.totalStudents / 60) : 0 // Convert to minutes
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

  // Enhanced color palette for better readability
  const COLORS = {
    primary: '#3B82F6',      // Blue
    success: '#10B981',      // Green
    warning: '#F59E0B',      // Orange
    danger: '#EF4444',       // Red
    info: '#06B6D4',         // Cyan
    purple: '#8B5CF6',       // Purple
    pink: '#EC4899',         // Pink
    indigo: '#6366F1'        // Indigo
  };
  
  const CHART_COLORS = {
    booksStarted: '#3B82F6',     // Blue
    booksCompleted: '#10B981',   // Green
    inProgress: '#F59E0B',       // Orange
    completed: '#10B981',        // Green
    engagementRate: '#8B5CF6',  // Purple
    comprehension: '#06B6D4',    // Cyan
    readingTime: '#EC4899'       // Pink
  };
  
  const STATUS_COLORS = {
    'On Track': '#10B981',
    'Needs Attention': '#EF4444',
    'Unknown': '#6B7280'
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
          
          {/* Simple Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <BarChart2 size={24} className="text-white" />
                    </div>
                    <div className="absolute -inset-1 border-2 border-blue-200 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Analytics</h3>
                  <p className="text-gray-600 text-center">Preparing your classroom data visualization...</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sticky Data Filter Toggle */}
              <div className="sticky top-20 z-50 mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Activity size={20} className="text-white" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 text-lg">Data Filter</span>
                        <p className="text-sm text-gray-600">Choose which books to include in the analysis</p>
                      </div>
                    </div>
                    <div className="flex bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-white/50 shadow-lg">
                      <button
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-out ${
                          !showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' 
                            : 'text-gray-700 hover:bg-white/60 hover:scale-105'
                        }`}
                        onClick={() => setShowOnlyClassroomBooks(false)}
                      >
                        📚 All Books (Classroom + OOB)
                      </button>
                      <button
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-out ${
                          showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' 
                            : 'text-gray-700 hover:bg-white/60 hover:scale-105'
                        }`}
                        onClick={() => setShowOnlyClassroomBooks(true)}
                      >
                        🏫 Classroom Books Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Comprehension Scores Chart */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <BarChart2 size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Comprehension Scores</h2>
                        <p className="text-sm text-gray-600">Reading comprehension performance by student</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareComprehensionScoreData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value) => [`${value}%`, '🧠 Comprehension Score']} 
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                          <Bar 
                            dataKey="score" 
                            name="Comprehension Score" 
                            fill={CHART_COLORS.comprehension}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.comprehension}
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Student Book Usage Statistics */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <BookOpen size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Student Book Usage</h2>
                        <p className="text-sm text-gray-600">Books started vs completed by each student</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareStudentBookUsageData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value, name) => [
                              name === 'completionRate' ? `${value}%` : value,
                              name === 'booksStarted' ? '📚 Books Started' : 
                              name === 'booksCompleted' ? '✅ Books Completed' : 
                              name === 'totalReadingTime' ? '⏱️ Reading Time (min)' : 
                              name === 'completionRate' ? '📊 Completion Rate' : name
                            ]}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                          <Bar 
                            dataKey="booksStarted" 
                            name="Books Started" 
                            fill={CHART_COLORS.booksStarted}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.booksStarted}
                            strokeWidth={1}
                          />
                          <Bar 
                            dataKey="booksCompleted" 
                            name="Books Completed" 
                            fill={CHART_COLORS.booksCompleted}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.booksCompleted}
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Reading Time Chart */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <Clock size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Reading Time</h2>
                        <p className="text-sm text-gray-600">Total reading time spent by each student</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareReadingTimeData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value) => [formatTime(value), '⏱️ Reading Time']} 
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                          <Bar 
                            dataKey="seconds" 
                            name="Reading Time" 
                            fill={CHART_COLORS.readingTime}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.readingTime}
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Book Engagement Metrics */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <Activity size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Book Engagement Metrics</h2>
                        <p className="text-sm text-gray-600">How actively students engage with each book</p>
                      </div>
                    </div>
                    <div className="h-80">
                      {prepareBookEngagementData().length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen size={32} className="text-purple-500" />
                            </div>
                            <p className="text-gray-600 text-lg font-medium">No engagement data available</p>
                            <p className="text-gray-500 text-sm mt-1">Students need to start reading books to see engagement metrics</p>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={prepareBookEngagementData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis 
                              dataKey="bookTitle" 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              interval={0}
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              axisLine={{ stroke: '#D1D5DB' }}
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fontSize: 12, fill: '#6B7280' }}
                              axisLine={{ stroke: '#D1D5DB' }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                fontSize: '14px'
                              }}
                              formatter={(value, name) => [
                                name === 'engagementRate' ? `${value}%` : value,
                                name === 'engagementRate' ? '🎯 Engagement Rate' : 
                                name === 'avgActivitiesPerStudent' ? '🎮 Avg Activities/Student' : 
                                name === 'avgReadingTime' ? '⏱️ Avg Reading Time (min)' : name
                              ]}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                            />
                            <Bar 
                              dataKey="engagementRate" 
                              name="Engagement Rate (%)" 
                              fill={CHART_COLORS.engagementRate}
                              radius={[4, 4, 0, 0]}
                              stroke={CHART_COLORS.engagementRate}
                              strokeWidth={1}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Books Read Chart */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <BookOpen size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Books Read</h2>
                        <p className="text-sm text-gray-600">Completed vs in-progress books by student</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareBooksReadData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                          stackOffset="none"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'completed') {
                                return [`${value}`, '✅ Completed Books'];
                              } else if (name === 'inProgress') {
                                return [`${value}`, '🔄 Books in Progress'];
                              }
                              return [`${value}`, name];
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                          <Bar 
                            dataKey="completed" 
                            name="Completed" 
                            fill={CHART_COLORS.completed}
                            stackId="a" 
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.completed}
                            strokeWidth={1}
                          />
                          <Bar 
                            dataKey="inProgress" 
                            name="In Progress" 
                            fill={CHART_COLORS.inProgress}
                            stackId="a" 
                            radius={[0, 0, 4, 4]}
                            stroke={CHART_COLORS.inProgress}
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
  
                {/* Status Distribution Pie Chart */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                        <PieChart size={24} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Student Status Distribution</h2>
                        <p className="text-sm text-gray-600">Overview of student progress status</p>
                      </div>
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
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {prepareStatusDistributionData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value, name, props) => [
                              `${value} students`, 
                              '👥 Students'
                            ]} 
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Book Completion Rates */}
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-orange-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Book Completion Rates</h2>
                      <p className="text-sm text-gray-600">How many students completed vs are still reading each book</p>
                    </div>
                  </div>
                  <div className="h-96">
                    {prepareBookCompletionData().length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} className="text-green-500" />
                          </div>
                          <p className="text-gray-600 text-lg font-medium">No completion data available</p>
                          <p className="text-gray-500 text-sm mt-1">Students need to start reading books to see completion rates</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareBookCompletionData()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="bookTitle" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#6B7280' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #E5E7EB',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              fontSize: '14px'
                            }}
                            formatter={(value, name) => [
                              name === 'completionRate' ? `${value}%` : value,
                              name === 'completed' ? '✅ Students Completed' : 
                              name === 'inProgress' ? '🔄 Students In Progress' : 
                              name === 'completionRate' ? '📊 Completion Rate' : 
                              name === 'avgReadingTime' ? '⏱️ Avg Reading Time (min)' : name
                            ]}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                          />
                          <Bar 
                            dataKey="completed" 
                            name="Completed" 
                            fill={CHART_COLORS.completed}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.completed}
                            strokeWidth={1}
                          />
                          <Bar 
                            dataKey="inProgress" 
                            name="In Progress" 
                            fill={CHART_COLORS.inProgress}
                            radius={[4, 4, 0, 0]}
                            stroke={CHART_COLORS.inProgress}
                            strokeWidth={1}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-lg">✓</span>
                      </div>
                      <div className="text-3xl font-bold text-green-700 mb-1">
                        {prepareBookCompletionData().reduce((sum, book) => sum + book.completed, 0)}
                      </div>
                      <div className="text-sm font-medium text-green-600">Total Books Completed</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center border border-orange-200">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-lg">⏳</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-700 mb-1">
                        {prepareBookCompletionData().reduce((sum, book) => sum + book.inProgress, 0)}
                      </div>
                      <div className="text-sm font-medium text-orange-600">Books In Progress</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold text-lg">%</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-700 mb-1">
                        {prepareBookCompletionData().length > 0 
                          ? Math.round(prepareBookCompletionData().reduce((sum, book) => sum + book.completionRate, 0) / prepareBookCompletionData().length)
                          : 0}%
                      </div>
                      <div className="text-sm font-medium text-blue-600">Average Completion Rate</div>
                    </div>
                  </div>
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