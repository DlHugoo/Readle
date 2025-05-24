import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, BookOpen, Clock, CheckCircle, AlertTriangle, Users, ArrowLeft, PieChart as PieChartIcon, BarChart2, TrendingUp, Activity } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const API_BASE_URL = 'http://localhost:8080';

const ClassroomVisualization = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalBooksRead: 0,
    averageReadingTime: 0,
    topPerformers: [],
    studentsNeedingAttention: []
  });
  
  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Go back to progress dashboard
  const goBackToProgress = () => {
    navigate(`/classroom-progress/${classroomId}`);
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
          
          // Fetch progress data for each student
          await fetchProgressForAllStudents(studentDetails, token);
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
          const predictionAttemptsData = {}; // Add this
          
          await Promise.all(allBooks.map(async (book) => {
            try {
              const bookId = book.book.bookID;
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

              // Add prediction attempts fetch
              try {
                const predictionAttemptsRes = await axios.get(
                  `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${bookId}/count`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                predictionAttemptsData[bookId] = predictionAttemptsRes.data;
              } catch (err) {
                console.error(`Error fetching prediction attempts for book ${bookId}:`, err);
                predictionAttemptsData[bookId] = 0;
              }
            } catch (err) {
              console.error(`Error fetching attempts for book ${book.book.bookID}:`, err);
              snakeAttemptsData[book.book.bookID] = 0;
              ssaAttemptsData[book.book.bookID] = 0;
              predictionAttemptsData[book.book.bookID] = 0;
            }
          }));
          
          // Calculate average comprehension score based on all activities
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

          // Add prediction score calculation
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
              status: status
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

  // Prepare data for charts
  const prepareComprehensionScoreData = () => {
    return progressData
      .filter(student => student.progressData?.avgComprehensionScore !== undefined)
      .map(student => ({
        name: `${student.firstName} ${student.lastName}`,
        score: student.progressData.avgComprehensionScore
      }))
      .sort((a, b) => b.score - a.score);
  };

  const prepareBooksReadData = () => {
    return progressData
      .filter(student => student.progressData?.completedCount !== undefined)
      .map(student => ({
        name: `${student.firstName} ${student.lastName}`,
        completed: student.progressData.completedCount,
        inProgress: student.progressData.inProgressCount
      }))
      .sort((a, b) => b.completed - a.completed);
  };

  const prepareReadingTimeData = () => {
    return progressData
      .filter(student => student.progressData?.totalReadingTimeMinutes !== undefined)
      .map(student => ({
        name: `${student.firstName} ${student.lastName}`,
        minutes: student.progressData.totalReadingTimeMinutes
      }))
      .sort((a, b) => b.minutes - a.minutes);
  };

  const prepareStatusDistributionData = () => {
    const statusCounts = progressData.reduce((acc, student) => {
      const status = student.progressData?.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
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
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Completed" fill="#4CAF50" />
                        <Bar dataKey="inProgress" name="In Progress" fill="#FFC107" />
                      </BarChart>
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
                      <PieChart>
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
                      </PieChart>
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
                      data={progressData
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


  // Add prediction score calculation function
  const calculatePredictionScore = (attempts) => {
    if (!attempts || attempts <= 0) return 0;
    return attempts === 1 ? 100 : 0; // 100 points for 1 attempt, 0 for more attempts
  };

  // Update prepareComprehensionScoreData to include prediction scores
  const prepareComprehensionScoreData = () => {
    return progressData
      .filter(student => student.progressData?.avgComprehensionScore !== undefined)
      .map(student => ({
        name: `${student.firstName} ${student.lastName}`,
        score: student.progressData.avgComprehensionScore,
        snakeGame: calculateAverageScore(student.progressData.snakeAttemptsData, calculateSnakeGameScore),
        sequencing: calculateAverageScore(student.progressData.ssaAttemptsData, calculateSSAScore),
        prediction: calculateAverageScore(student.progressData.predictionAttemptsData, calculatePredictionScore)
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Helper function to calculate average score
  const calculateAverageScore = (attemptsData, scoreCalculator) => {
    if (!attemptsData) return 0;
    const scores = Object.values(attemptsData)
      .filter(attempts => attempts > 0)
      .map(attempts => scoreCalculator(attempts));
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  };