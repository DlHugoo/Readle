import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, BookOpen, Clock, CheckCircle, AlertTriangle, Users, Search, Filter, Award, BarChart, Eye, Download, Sparkles, Star, Heart, Zap, RotateCcw } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import StudentDetailsModal from './StudentDetailsModal';
import axios from "axios";
import { getApiBaseUrl } from "../../utils/apiConfig";
import { useAuth } from "../../contexts/AuthContext";
import { getAccessToken } from "../../api/api";

const API_BASE_URL = getApiBaseUrl();

const ClassroomProgress = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always open by default
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Progress data
  const [progressData, setProgressData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalBooksRead: 0,
    averageReadingTime: 0,
    topPerformers: [],
    studentsNeedingAttention: []
  });
  
  // Filter states
  const [showOnlyClassroomBooks, setShowOnlyClassroomBooks] = useState(false);
  const [filterByLevel, setFilterByLevel] = useState('all');
  const [filterByPerformance, setFilterByPerformance] = useState('all');
  const [filterByActivity, setFilterByActivity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort states
  const [sortBy, setSortBy] = useState('none'); // 'none', 'performance', 'activity'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Open student details modal
  const openStudentModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // Close student details modal
  const closeStudentModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Sort functions
  const handlePerformanceSort = () => {
    if (sortBy === 'performance') {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy('performance');
      setSortOrder('desc'); // Default to highest first
    }
  };

  const handleActivitySort = () => {
    if (sortBy === 'activity') {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy('activity');
      setSortOrder('desc'); // Default to most recent first
    }
  };

  const handleClearSorts = () => {
    setSortBy('none');
    setSortOrder('desc');
  };
  
  // Navigate to visualization dashboard
  const navigateToVisualization = () => {
    navigate(`/classroom-visualization/${classroomId}`);
  };

  // Fetch classroom details and students
  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken();
      
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // Fetch classroom details
        const classroomResponse = await axios.get(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const classroomData = classroomResponse.data;
        setClassroomName(classroomData.name || "Unknown Classroom");
        
        // Fetch student details for each email in studentEmails
        if (classroomData.studentEmails && Array.isArray(classroomData.studentEmails)) {
          const studentPromises = classroomData.studentEmails.map(async (email) => {
            try {
              const userResponse = await axios.get(`/api/users/by-email/${email}`, {
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
          setStudents(studentDetails);
          
          // Fetch progress data for each student
          await fetchProgressForAllStudents(studentDetails, token);
        } else {
          setStudents([]);
        }
        
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response && error.response.status === 404) {
          setError("Classroom not found or you don't have access to it.");
        } else {
          setError("Failed to load data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classroomId]);

  // Fetch progress data for all students
  const fetchProgressForAllStudents = async (studentsList, token) => {
    try {
      const progressPromises = studentsList.map(async (student) => {
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
          
          // Calculate last activity date with improved validation
          let lastActivityDate = null;
          const inProgressBooks = inProgressBooksRes.data;
          const completedBooks = completedBooksRes.data;
          
          // Collect all valid activity dates
          const activityDates = [];
          
          // Add lastReadAt dates from in-progress books
          inProgressBooks.forEach(book => {
            if (book.lastReadAt) {
              const date = new Date(book.lastReadAt);
              if (!isNaN(date.getTime())) { // Validate date
                activityDates.push(date);
              }
            }
          });
          
          // Add endTime dates from completed books
          completedBooks.forEach(book => {
            if (book.endTime) {
              const date = new Date(book.endTime);
              if (!isNaN(date.getTime())) { // Validate date
                activityDates.push(date);
              }
            }
          });
          
          // Find the most recent activity date
          if (activityDates.length > 0) {
            lastActivityDate = new Date(Math.max(...activityDates));
            console.log(`Last activity date for user ${userId}:`, lastActivityDate, `(from ${activityDates.length} activities)`);
          } else {
            console.log(`No valid activity dates found for user ${userId}`);
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
          const predictionAttemptsData = {}; // Add this declaration
          
          await Promise.all(allBooks.map(async (book) => {
            const bookId = book.book.bookID; // Move bookId declaration to the top of the scope
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
            }
            } catch (err) {
              console.error(`Error fetching attempts for book ${bookId}:`, err);
              snakeAttemptsData[bookId] = 0;
              ssaAttemptsData[bookId] = 0;
              predictionAttemptsData[bookId] = undefined;
            }
          }));
          
          // Calculate average comprehension score based on snake game and SSA attempts
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
      
      const studentsWithProgress = await Promise.all(progressPromises);
      setProgressData(studentsWithProgress);
      
      // Calculate summary statistics
      calculateSummaryStats(studentsWithProgress);
      
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setError("Failed to load progress data. Please try again.");
    }
  };
  
  // Add functions to calculate scores based on attempts
  const calculateSnakeGameScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 2);
    return Math.max(score, 0); // Ensure score doesn't go below 0
  };
  
  // Function to calculate SSA score based on attempts
  const calculateSSAScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    const score = 100 - ((attempts - 1) * 25);
    return Math.max(score, 0); // Ensure score doesn't go below 0
  };

  const calculatePredictionScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    return attempts === 1 ? 100 : 0; // 100 points for 1 attempt, 0 for more attempts
  };
  
  // Calculate summary statistics for the dashboard
  const calculateSummaryStats = (studentsWithProgress) => {
    // Total books read (sum of all completed books)
    const totalBooksRead = studentsWithProgress.reduce((total, student) => {
      return total + (student.progressData?.completedCount || 0);
    }, 0);
    
    // Average reading time per student (in seconds)
    const totalReadingTime = studentsWithProgress.reduce((total, student) => {
      return total + (student.progressData?.totalReadingTimeSeconds || 0);
    }, 0);
    const averageReadingTime = studentsWithProgress.length > 0 
      ? Math.round(totalReadingTime / studentsWithProgress.length) 
      : 0;
    
    // Top performers (based on comprehension scores)
    const sortedByScore = [...studentsWithProgress].sort((a, b) => 
      (b.progressData?.avgComprehensionScore || 0) - (a.progressData?.avgComprehensionScore || 0)
    );
    const topPerformers = sortedByScore.slice(0, 3);
    
    // Students needing attention
    const needingAttention = studentsWithProgress.filter(student => 
      student.progressData?.status === 'Needs Attention'
    );
    
    setSummaryStats({
      totalBooksRead,
      averageReadingTime,
      topPerformers,
      studentsNeedingAttention: needingAttention
    });
  };
  
  // Format time function (converts seconds to hours, minutes, and seconds)
  const formatTime = (totalReadingTimeSeconds) => {
    // Debug: Log the input value
    console.log('formatTime input:', totalReadingTimeSeconds, 'type:', typeof totalReadingTimeSeconds);
    
    // Handle the case where totalReadingTimeSeconds might be undefined or null
    if (!totalReadingTimeSeconds || typeof totalReadingTimeSeconds !== 'number' || isNaN(totalReadingTimeSeconds)) {
      console.log('formatTime: Using fallback 0h 0m 0s');
      return '0h 0m 0s';
    }
    
    const totalSeconds = Math.floor(totalReadingTimeSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const result = `${hours}h ${minutes}m ${seconds}s`;
    console.log('formatTime result:', result);
    return result;
  };
  
  // Filter students based on selected filters
// Add this function to fetch classroom books
const [classroomBooks, setClassroomBooks] = useState([]);

// Add this function to fetch classroom books
const fetchClassroomBooks = async () => {
  try {
    const token = getAccessToken();
    const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classroomId}/books`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setClassroomBooks(response.data);
  } catch (error) {
    console.error('Error fetching classroom books:', error);
  }
};

// Add this to your useEffect
useEffect(() => {
  fetchClassroomBooks();
}, [classroomId]);

// Modify the filtering logic
const filteredStudents = progressData.map(student => {
  // Create a deep copy of the student object
  const filteredStudent = {
    ...student,
    progressData: student.progressData ? {
      ...student.progressData,
      completedBooks: [...(student.progressData.completedBooks || [])],
      inProgressBooks: [...(student.progressData.inProgressBooks || [])]
    } : null
  };

  if (filteredStudent.progressData && showOnlyClassroomBooks) {
    // Filter completed books that belong to the current classroom
    const filteredCompletedBooks = filteredStudent.progressData.completedBooks.filter(book => 
      book.book && book.book.classroomId && book.book.classroomId.toString() === classroomId
    );

    // Filter in-progress books that belong to the current classroom
    const filteredInProgressBooks = filteredStudent.progressData.inProgressBooks.filter(book => 
      book.book && book.book.classroomId && book.book.classroomId.toString() === classroomId
    );

    // Get all classroom books for calculations
    const allClassroomBooks = [...filteredCompletedBooks, ...filteredInProgressBooks];

    // Calculate comprehension scores
    let totalScore = 0;
    let totalActivities = 0;

    allClassroomBooks.forEach(book => {
      const bookId = book.book.bookID;
      const snakeAttempts = filteredStudent.progressData.snakeAttemptsData[bookId] || 0;
      const ssaAttempts = filteredStudent.progressData.ssaAttemptsData[bookId] || 0;
      const predictionAttempts = filteredStudent.progressData.predictionAttemptsData[bookId] || 0;

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
    filteredStudent.progressData = {
      ...filteredStudent.progressData,
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
    };
  }

  return filteredStudent;
}).filter(student => {
  // Apply other filters (search, performance, activity)
    if (searchTerm && !`${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
  
    // Performance band filter
    if (filterByPerformance !== 'all') {
      const score = student.progressData?.avgComprehensionScore || 0;
      if (filterByPerformance === 'high' && score < 80) return false;
      if (filterByPerformance === 'medium' && (score < 60 || score >= 80)) return false;
      if (filterByPerformance === 'low' && score >= 60) return false;
    }
  
    // Activity date filter
    if (filterByActivity !== 'all' && student.progressData?.lastActivityDate) {
      const daysSince = Math.floor((new Date() - new Date(student.progressData.lastActivityDate)) / (1000 * 60 * 60 * 24));
      if (filterByActivity === 'recent' && daysSince > 7) return false;
      if (filterByActivity === 'week' && (daysSince <= 7 || daysSince > 30)) return false;
      if (filterByActivity === 'month' && daysSince <= 30) return false;
    }
  
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortBy === 'performance') {
      const scoreA = a.progressData?.avgComprehensionScore || 0;
      const scoreB = b.progressData?.avgComprehensionScore || 0;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    } else if (sortBy === 'activity') {
      const dateA = a.progressData?.lastActivityDate ? new Date(a.progressData.lastActivityDate) : new Date(0);
      const dateB = b.progressData?.lastActivityDate ? new Date(b.progressData.lastActivityDate) : new Date(0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    return 0; // No sorting
  });
  
  // Update the summary stats calculation to use the filtered data
  useEffect(() => {
    calculateSummaryStats(filteredStudents);
  }, [progressData, showOnlyClassroomBooks, filterByPerformance, filterByActivity, searchTerm, sortBy, sortOrder]);
  
  // Add new function to handle CSV export
  const exportToCSV = () => {
    // Create CSV header
    const headers = [
      'Student Name',
      'Email',
      'Books Completed',
      'Books In Progress',
      'Total Reading Time',
      'Average Comprehension Score',
      'Last Activity',
      'Status'
    ].join(',');

    // Create CSV rows from filtered students data
    const csvRows = filteredStudents.map(student => {
      const readingTime = student.progressData?.totalReadingTimeSeconds || 0;
      const formattedTime = formatTime(readingTime);
      const lastActivity = student.progressData?.lastActivityDate 
        ? new Date(student.progressData.lastActivityDate).toLocaleDateString()
        : 'Never';

      return [
        `${student.firstName} ${student.lastName}`,
        student.email,
        student.progressData?.completedCount || 0,
        student.progressData?.inProgressCount || 0,
        formattedTime,
        student.progressData?.avgComprehensionScore || 0,
        lastActivity,
        student.progressData?.status || 'Unknown'
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join('\n');

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${classroomName}_progress_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-20 transition-all duration-150 ease-out ${sidebarOpen ? 'pl-72' : 'pl-0'}`}>
        {/* Navigation Bar - Full Width */}
        <div className="w-full fixed top-0 left-0 right-0 z-40">
          <TeahcerNav />
        </div>
        
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
                className="group p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-150 ease-out"
              >
                <Menu size={20} className="text-blue-600 group-hover:text-blue-700" />
              </button>
              
              {/* Simplified decorative elements */}
              <div className="hidden md:flex items-center space-x-2">
                <Sparkles className="text-yellow-500" size={20} />
                <Star className="text-purple-500" size={16} />
              </div>
            </div>
            
            {/* Professional Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Progress Dashboard</h1>
                    <p className="text-gray-600 text-lg">Monitor and track student learning progress</p>
                  </div>
                  <div className="hidden lg:flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                      <div className="text-sm text-gray-500">Enrolled Students</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{classroomName}</div>
                      <div className="text-sm text-gray-500">Classroom</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={exportToCSV}
              className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 ease-out overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <Download size={22} className="relative z-10" />
              <span className="font-bold text-lg relative z-10">Export CSV</span>
              <Zap size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-200 ease-out" />
            </button>
            
            <button
              onClick={navigateToVisualization}
              className="group relative flex items-center gap-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 ease-out overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <BarChart size={22} className="relative z-10" />
              <span className="font-bold text-lg relative z-10">View Visualizations</span>
              <Zap size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-200 ease-out" />
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
              {/* Enhanced Book Filter Toggle */}
              <div className="mb-8 bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="font-semibold text-gray-700 text-lg">Show books:</span>
                    </div>
                    <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner">
                      <button
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                          !showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-white/50'
                        }`}
                        onClick={() => setShowOnlyClassroomBooks(false)}
                      >
                        All Books (Classroom + OOB)
                      </button>
                      <button
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                          showOnlyClassroomBooks 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
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
              
              {/* Enhanced Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Books Read */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 relative overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                        <BookOpen size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Total Books Read</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{summaryStats.totalBooksRead}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Average Reading Time */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 relative overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                        <Clock size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Avg. Reading Time</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatTime(summaryStats.averageReadingTime)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Top Performers */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 relative overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                        <Award size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Top Performers</h3>
                        <ul className="mt-2">
                          {summaryStats.topPerformers.map((student, index) => (
                            <li key={index} className="text-sm font-medium text-gray-700">
                              {student.firstName} {student.lastName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Students Needing Attention */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 relative overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                        <AlertTriangle size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-gray-500 text-sm font-semibold">Needs Attention</h3>
                        <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                          {summaryStats.studentsNeedingAttention.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Student Progress Table Container */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                {/* Redesigned Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-32 -translate-y-32"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold flex items-center mb-2">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                            <Users size={24} />
                          </div>
                          Student Progress
                        </h2>
                        <p className="text-indigo-100 text-lg">
                          Track and monitor individual student learning progress
                        </p>
                      </div>
                      <div className="hidden md:flex items-center space-x-2">
                        <Star className="text-yellow-300" size={20} />
                        <Heart className="text-pink-300" size={20} />
                        <Sparkles className="text-purple-300" size={20} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Content area */}
                <div className="p-8">
                
                  {/* Enhanced Search and Filter Controls */}
                  <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        />
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePerformanceSort}
                        className={`group px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          sortBy === 'performance' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent shadow-lg' 
                            : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-green-500 hover:shadow-md'
                        }`}
                      >
                        <span className="font-semibold flex items-center gap-2">
                          Sort by Performance 
                          {sortBy === 'performance' && (
                            <span className="group-hover:rotate-180 transition-transform duration-300">
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={handleActivitySort}
                        className={`group px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          sortBy === 'activity' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-lg' 
                            : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-blue-500 hover:shadow-md'
                        }`}
                      >
                        <span className="font-semibold flex items-center gap-2">
                          Sort by Activity 
                          {sortBy === 'activity' && (
                            <span className="group-hover:rotate-180 transition-transform duration-300">
                              {sortOrder === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        onClick={handleClearSorts}
                        className={`group px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          sortBy !== 'none'
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent shadow-lg' 
                            : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-orange-500 hover:shadow-md'
                        }`}
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <RotateCcw size={16} />
                          Clear Sorts
                        </span>
                      </button>
                    </div>
                  </div>
                
                {/* Table */}
                <div className="overflow-x-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-gray-400 mb-4">
                        <Users size={64} className="mx-auto" />
                      </div>
                      <p className="text-gray-500 text-lg">No students enrolled yet.</p>
                      <p className="text-gray-400 mt-2">Share your classroom code or add students manually to get started!</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Books Completed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Books In Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Reading Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Comprehension
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-100 ease-out">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">
                                    {student.firstName?.charAt(0) || '?'}{student.lastName?.charAt(0) || ''}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.progressData?.completedCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.progressData?.inProgressCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.progressData?.lastActivityDate 
                                ? new Date(student.progressData.lastActivityDate).toLocaleDateString()
                                : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(student.progressData?.totalReadingTimeSeconds || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${student.progressData?.avgComprehensionScore || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {student.progressData?.avgComprehensionScore || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${student.progressData?.status === 'On Track' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'}`}
                              >
                                {student.progressData?.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => openStudentModal(student)}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Eye size={16} className="mr-1" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={isModalOpen}
        student={selectedStudent}
        onClose={closeStudentModal}
        formatTime={formatTime}
        calculateSnakeGameScore={calculateSnakeGameScore}
        calculateSSAScore={calculateSSAScore}
        calculatePredictionScore={calculatePredictionScore}
      />
    </div>
  );
};

export default ClassroomProgress;