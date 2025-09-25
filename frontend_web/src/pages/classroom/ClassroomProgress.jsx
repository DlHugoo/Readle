import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, BookOpen, Clock, CheckCircle, AlertTriangle, Users, Search, Filter, Award, BarChart, Eye, Download } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import StudentDetailsModal from './StudentDetailsModal';
import axios from "axios";

const API_BASE_URL = 'http://localhost:3000';

const ClassroomProgress = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  // Navigate to visualization dashboard
  const navigateToVisualization = () => {
    navigate(`/classroom-visualization/${classroomId}`);
  };

  // Fetch classroom details and students
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
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
    
    // Average reading time per student (in minutes)
    const totalReadingTime = studentsWithProgress.reduce((total, student) => {
      return total + (student.progressData?.totalReadingTimeMinutes || 0);
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
  
  // Format time function (converts minutes to hours and minutes)
  const formatTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Filter students based on selected filters
// Add this function to fetch classroom books
const [classroomBooks, setClassroomBooks] = useState([]);

// Add this function to fetch classroom books
const fetchClassroomBooks = async () => {
  try {
    const token = localStorage.getItem('token');
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
      totalReadingTimeMinutes: allClassroomBooks.reduce((total, book) => {
        const minutes = typeof book.totalReadingTimeMinutes === 'number'
          ? book.totalReadingTimeMinutes
          : (book.totalReadingTime?.seconds ? Math.floor(book.totalReadingTime.seconds / 60) : 0);
        return total + minutes;
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
  });
  
  // Update the summary stats calculation to use the filtered data
  useEffect(() => {
    calculateSummaryStats(filteredStudents);
  }, [progressData, showOnlyClassroomBooks, filterByPerformance, filterByActivity, searchTerm]);
  
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
      const readingTime = student.progressData?.totalReadingTimeMinutes || 0;
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
    <div className="min-h-screen bg-gray-50">
      <TeahcerNav />
      
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`pt-[72px] transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-6">
          {/* Header with toggle sidebar button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 p-2 rounded-md hover:bg-gray-200"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{classroomName} - Progress Dashboard</h1>
            </div>
            
            <div className="flex gap-2">
              {/* Add Export CSV Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                Export CSV
              </button>
              
              <button
                onClick={navigateToVisualization}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <BarChart size={18} />
                View Visualizations
              </button>
            </div>
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
              
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Books Read */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <BookOpen size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm">Total Books Read</h3>
                      <p className="text-3xl font-bold text-blue-600">{summaryStats.totalBooksRead}</p>
                    </div>
                  </div>
                </div>
                
                {/* Average Reading Time */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <Clock size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm">Avg. Reading Time</h3>
                      <p className="text-3xl font-bold text-green-600">{formatTime(summaryStats.averageReadingTime)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Top Performers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start">
                    <div className="bg-yellow-100 p-3 rounded-full mr-4">
                      <Award size={24} className="text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm">Top Performers</h3>
                      <ul className="mt-2">
                        {summaryStats.topPerformers.map((student, index) => (
                          <li key={index} className="text-sm">
                            {student.firstName} {student.lastName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Students Needing Attention */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <AlertTriangle size={24} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm">Needs Attention</h3>
                      <p className="text-3xl font-bold text-red-600">
                        {summaryStats.studentsNeedingAttention.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Student Progress Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">Student Progress</h2>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex items-center bg-white rounded-md px-3 py-2 border">
                      <Search size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    {/* Performance Filter */}
                    <div className="flex items-center bg-white rounded-md px-3 py-2 border">
                      <Filter size={18} className="text-gray-400 mr-2" />
                      <select
                        className="outline-none text-sm bg-transparent"
                        value={filterByPerformance}
                        onChange={(e) => setFilterByPerformance(e.target.value)}
                      >
                        <option value="all">All Performance</option>
                        <option value="high">High (80%+)</option>
                        <option value="medium">Medium (60-79%)</option>
                        <option value="low">Low (Below 60%)</option>
                      </select>
                    </div>
                    
                    {/* Activity Filter */}
                    <div className="flex items-center bg-white rounded-md px-3 py-2 border">
                      <Clock size={18} className="text-gray-400 mr-2" />
                      <select
                        className="outline-none text-sm bg-transparent"
                        value={filterByActivity}
                        onChange={(e) => setFilterByActivity(e.target.value)}
                      >
                        <option value="all">All Activity</option>
                        <option value="recent">Recent (Last 7 days)</option>
                        <option value="week">Last 7-30 days</option>
                        <option value="month">Over 30 days ago</option>
                      </select>
                    </div>
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
                          <tr key={index} className="hover:bg-gray-50">
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
                              {formatTime(student.progressData?.totalReadingTimeMinutes || 0)}
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