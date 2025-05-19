import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, BookOpen, Clock, CheckCircle, AlertTriangle, Users, Search, Filter, Award, BarChart } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from "axios";

const API_BASE_URL = 'http://localhost:8080';

const ClassroomProgress = () => {
  const { classroomId } = useParams();
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
  const [showOnlyClassroomBooks, setShowOnlyClassroomBooks] = useState(true);
  const [filterByLevel, setFilterByLevel] = useState('all');
  const [filterByPerformance, setFilterByPerformance] = useState('all');
  const [filterByActivity, setFilterByActivity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
          
          // Calculate average comprehension score (placeholder - would need actual data)
          // This is a placeholder - you would need to implement actual comprehension scoring
          const avgComprehensionScore = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
          
          // Calculate vocabulary score (placeholder - would need actual data)
          // This is a placeholder - you would need to implement actual vocabulary scoring
          const vocabularyScore = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
          
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
              vocabularyScore: vocabularyScore,
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
              vocabularyScore: 0,
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
  const filteredStudents = progressData.filter(student => {
    // Search term filter
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
                        showOnlyClassroomBooks 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setShowOnlyClassroomBooks(true)}
                    >
                      Classroom Books Only
                    </button>
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
                            {student.firstName} {student.lastName} - {student.progressData?.avgComprehensionScore || 0}%
                          </li>
                        ))}
                        {summaryStats.topPerformers.length === 0 && (
                          <li className="text-sm text-gray-400 italic">No data available</li>
                        )}
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
                      <ul className="mt-2">
                        {summaryStats.studentsNeedingAttention.map((student, index) => (
                          <li key={index} className="text-sm">
                            {student.firstName} {student.lastName}
                          </li>
                        ))}
                        {summaryStats.studentsNeedingAttention.length === 0 && (
                          <li className="text-sm text-gray-400 italic">No students need attention</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filters and Search */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    {/* Performance Filter */}
                    <div className="flex items-center">
                      <label className="mr-2 text-sm text-gray-600">Performance:</label>
                      <select
                        className="border rounded-md px-2 py-1 text-sm"
                        value={filterByPerformance}
                        onChange={(e) => setFilterByPerformance(e.target.value)}
                      >
                        <option value="all">All Levels</option>
                        <option value="high">High (80%+)</option>
                        <option value="medium">Medium (60-79%)</option>
                        <option value="low">Low (Below 60%)</option>
                      </select>
                    </div>
                    
                    {/* Activity Filter */}
                    <div className="flex items-center">
                      <label className="mr-2 text-sm text-gray-600">Activity:</label>
                      <select
                        className="border rounded-md px-2 py-1 text-sm"
                        value={filterByActivity}
                        onChange={(e) => setFilterByActivity(e.target.value)}
                      >
                        <option value="all">All Time</option>
                        <option value="recent">Last 7 Days</option>
                        <option value="week">Last 30 Days</option>
                        <option value="month">Older Than 30 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Students Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Books Completed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Comprehension
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vocabulary Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                            No students match the current filters
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.userId || student.id || student.email}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.progressData?.avgComprehensionScore || 0}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.progressData?.vocabularyScore || 0}%</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.progressData?.lastActivityDate 
                                ? new Date(student.progressData.lastActivityDate).toLocaleDateString() 
                                : 'No activity'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${student.progressData?.status === 'On Track' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'}`}>
                                {student.progressData?.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => window.location.href = `/classroom-students/${classroomId}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomProgress;