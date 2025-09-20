import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, UserPlus, X, Search, BookOpen, Clock, CheckCircle, UserMinus, Mail, Copy, Check, Users } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import StudentProgressModal from './StudentProgressModal';
import axios from "axios";

const API_BASE_URL = 'http://localhost:3000';

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [classroomCode, setClassroomCode] = useState(""); // Add state for classroom code
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false); // State to track if code was copied
  
  // Student progress state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);
  const [progressStats, setProgressStats] = useState({
    completedCount: 0,
    inProgressCount: 0,
  });
  const [completedBooks, setCompletedBooks] = useState([]);
  const [inProgressBooks, setInProgressBooks] = useState([]);
  const [snakeGameAttempts, setSnakeGameAttempts] = useState({});
  const [ssaAttempts, setSSAAttempts] = useState({});
  // Add this state variable at the top with other state declarations
  const [predictionAttempts, setPredictionAttempts] = useState({});

  // Add student state
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState(null);
  const [addStudentSuccess, setAddStudentSuccess] = useState(null);
  
  // Remove student state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [removingStudent, setRemovingStudent] = useState(false);

  // Add these state variables at the top with other state declarations
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', direction: 'asc' });

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to copy classroom code to clipboard
  const copyClassroomCode = () => {
    navigator.clipboard.writeText(classroomCode)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  // Fetch classroom details and students
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No token found. Please log in.");
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // Fetch classroom details
        console.log(`Fetching classroom details for ID: ${classroomId}`);
        const classroomResponse = await axios.get(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const classroomData = classroomResponse.data;
        console.log("Classroom data received:", classroomData);
        setClassroomName(classroomData.name || "Unknown Classroom");
        setClassroomCode(classroomData.classroomCode || ""); // Store classroom code
        
        // Fetch student details for each email in studentEmails
        if (classroomData.studentEmails && Array.isArray(classroomData.studentEmails)) {
          // Get student details from the backend
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
              // Return a basic object with just the email if we can't get full details
              return {
                email: email,
                firstName: email.split('@')[0],
                lastName: "",
                userId: null,
                username: email.split('@')[0]
              };
            }
          });
          
          try {
            const studentDetails = await Promise.all(studentPromises);
            console.log("Student details:", studentDetails);
            setStudents(studentDetails);
          } catch (error) {
            console.error("Error resolving student details:", error);
            
            // Fallback to basic processing if API calls fail
            const basicStudents = classroomData.studentEmails.map((email, index) => {
              return {
                id: index,
                userId: index,
                email: email,
                firstName: email.split('@')[0],
                lastName: "",
                username: email.split('@')[0]
              };
            });
            
            setStudents(basicStudents);
          }
        } else {
          setStudents([]);
        }
        
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", 
          error.response ? `Status: ${error.response.status}, Message: ${error.response.data}` : error.message);
        
        // Handle specific error cases
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

  // Function to fetch student progress
  const fetchStudentProgress = async (student) => {
    setSelectedStudent(student);
    setProgressModalOpen(true);
    setProgressLoading(true);
    setProgressError(null);
    
    const userId = student.userId || student.id;
    if (!userId) {
      setProgressError("Cannot fetch progress: Student ID not available");
      setProgressLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setProgressError("Authentication required. Please log in.");
      setProgressLoading(false);
      return;
    }
    
    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      // Fetch all progress data in parallel
      const [completedCountRes, inProgressCountRes, completedBooksRes, inProgressBooksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/progress/completed/count/${userId}`, { headers }),
        axios.get(`${API_BASE_URL}/api/progress/in-progress/count/${userId}`, { headers }),
        axios.get(`${API_BASE_URL}/api/progress/completed/${userId}`, { headers }),
        axios.get(`${API_BASE_URL}/api/progress/in-progress/${userId}`, { headers }),
      ]);
      
      setProgressStats({
        completedCount: completedCountRes.data,
        inProgressCount: inProgressCountRes.data,
      });
      setCompletedBooks(completedBooksRes.data);
      setInProgressBooks(inProgressBooksRes.data);
      
      
  
      // In the fetchStudentProgress function, modify the attempts fetching section:
      const allBooks = [...completedBooksRes.data, ...inProgressBooksRes.data];
      const snakeAttemptsData = {};
      const ssaAttemptsData = {};
      const predictionAttemptsData = {}; // Add this line
      
      await Promise.all(allBooks.map(async (book) => {
        try {
          const bookId = book.book.bookID;
          const snakeAttemptsRes = await axios.get(
            `${API_BASE_URL}/api/snake-attempts/user/${userId}/book/${bookId}/count`, 
            { headers }
          );
          snakeAttemptsData[bookId] = snakeAttemptsRes.data;
          
          // Fetch SSA attempts for this book
          try {
            const ssaAttemptsRes = await axios.get(
              `${API_BASE_URL}/api/ssa-attempts/user/${userId}/book/${bookId}/count`,
              { headers }
            );
            ssaAttemptsData[bookId] = ssaAttemptsRes.data;
          } catch (err) {
            console.error(`Error fetching SSA attempts for book ${bookId}:`, err);
            ssaAttemptsData[bookId] = 0;
          }
      
          // Add prediction attempts fetching
          try {
            const predictionAttemptsRes = await axios.get(
              `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${bookId}/count`,
              { headers }
            );
            predictionAttemptsData[bookId] = predictionAttemptsRes.data;
          } catch (err) {
            console.error(`Error fetching prediction attempts for book ${bookId}:`, err);
            predictionAttemptsData[bookId] = 0;
          }
        } catch (err) {
          console.error(`Error fetching snake game attempts for book ${book.book.bookID}:`, err);
          snakeAttemptsData[book.book.bookID] = 0;
        }
      }));
      
      setSnakeGameAttempts(snakeAttemptsData);
      setSSAAttempts(ssaAttemptsData);
      setPredictionAttempts(predictionAttemptsData); // Add this line
      
    } catch (error) {
      console.error('Error fetching student progress:', error);
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setProgressError('Your session has expired. Please log in again.');
            break;
          case 403:
            setProgressError('You do not have permission to view this data.');
            break;
          case 404:
            setProgressError('No progress data found for this student.');
            break;
          default:
            setProgressError('Failed to load progress data. Please try again later.');
        }
      } else if (error.request) {
        setProgressError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setProgressError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setProgressLoading(false);
    }
  };
  
  // Helper function to format reading time
  const formatDuration = (minutes, fallbackDuration) => {
    // If minutes is undefined, try to use fallbackDuration (old field)
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

  // Function to add a student to the classroom
  const handleAddStudent = async () => {
    if (!newStudentEmail || !newStudentEmail.includes('@')) {
      setAddStudentError("Please enter a valid email address");
      return;
    }

    setAddingStudent(true);
    setAddStudentError(null);
    setAddStudentSuccess(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setAddStudentError("Authentication required. Please log in.");
      setAddingStudent(false);
      return;
    }
    
    try {
      // First, get the user ID from the email
      const userResponse = await axios.get(`/api/users/by-email/${newStudentEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const studentId = userResponse.data.userId || userResponse.data.id;
      
      if (!studentId) {
        setAddStudentError("Student not found with this email address");
        setAddingStudent(false);
        return;
      }
      
      // Add the student to the classroom
      await axios.post(`/api/classrooms/${classroomId}/students/${studentId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Refresh the student list
      const classroomResponse = await axios.get(`/api/classrooms/${classroomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const classroomData = classroomResponse.data;
      
      // Update the student list with the new student
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
      }
      
      setAddStudentSuccess("Student added successfully");
      setNewStudentEmail("");
      
      // Close the modal after a short delay
      setTimeout(() => {
        setAddStudentModalOpen(false);
        setAddStudentSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error adding student:", error);
      if (error.response) {
        switch (error.response.status) {
          case 400:
            setAddStudentError(error.response.data.error || "Student could not be added");
            break;
          case 401:
            setAddStudentError("Your session has expired. Please log in again.");
            break;
          case 403:
            setAddStudentError("You do not have permission to add students.");
            break;
          case 404:
            setAddStudentError("Student not found with this email address");
            break;
          default:
            setAddStudentError("Failed to add student. Please try again later.");
        }
      } else if (error.request) {
        setAddStudentError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setAddStudentError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setAddingStudent(false);
    }
  };

  // Function to remove a student from the classroom
  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    setRemovingStudent(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please log in.");
      setRemovingStudent(false);
      return;
    }
    
    const studentId = studentToRemove.userId || studentToRemove.id;
    
    try {
      // Remove the student from the classroom
      await axios.delete(`/api/classrooms/${classroomId}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update the student list by removing the student
      setStudents(students.filter(student => 
        (student.userId !== studentId) && (student.id !== studentId)
      ));
      
      // Close the modal
      setRemoveModalOpen(false);
      setStudentToRemove(null);
      
    } catch (error) {
      console.error("Error removing student:", error);
      setError("Failed to remove student. Please try again.");
    } finally {
      setRemovingStudent(false);
    }
  };

  // Add this function before the return statement
  const sortStudents = (studentsArray) => {
    return [...studentsArray].sort((a, b) => {
      if (sortConfig.key === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortConfig.key === 'email') {
        return sortConfig.direction === 'asc' 
          ? a.email.localeCompare(b.email) 
          : b.email.localeCompare(a.email);
      }
      return 0;
    });
  };

// Add this function to filter students
const filterStudents = (studentsArray) => {
  return studentsArray.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) || student.email.toLowerCase().includes(searchLower);
  });
};

// Add this function to handle sort changes
const handleSort = (key) => {
  setSortConfig(prevConfig => ({
    key,
    direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
  }));
};

  // Add Student Modal Component
  const AddStudentModal = () => {
    if (!addStudentModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b p-4">
            <h2 className="text-xl font-bold text-gray-800">
              Add Student to Classroom
            </h2>
            <button 
              onClick={() => {
                setAddStudentModalOpen(false);
                setNewStudentEmail("");
                setAddStudentError(null);
                setAddStudentSuccess(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {addStudentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{addStudentError}</span>
              </div>
            )}
            
            {addStudentSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Success: </strong>
                <span className="block sm:inline">{addStudentSuccess}</span>
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="studentEmail" className="block text-gray-700 text-sm font-bold mb-2">
                Student Email Address
              </label>
              <div className="flex">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="studentEmail"
                    placeholder="student@example.com"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    disabled={addingStudent}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The student must already have a Readle account with this email address.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleAddStudent}
                disabled={addingStudent || !newStudentEmail}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  (addingStudent || !newStudentEmail) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {addingStudent ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  'Add Student'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Remove Student Confirmation Modal
  const RemoveStudentModal = () => {
    if (!removeModalOpen || !studentToRemove) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b p-4">
            <h2 className="text-xl font-bold text-gray-800">
              Remove Student
            </h2>
            <button 
              onClick={() => {
                setRemoveModalOpen(false);
                setStudentToRemove(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            <p className="mb-4 text-gray-700">
              Are you sure you want to remove <span className="font-bold">{studentToRemove.firstName} {studentToRemove.lastName}</span> from this classroom?
            </p>
            <p className="mb-6 text-sm text-gray-500">
              This action cannot be undone. The student will lose access to all classroom materials.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRemoveModalOpen(false);
                  setStudentToRemove(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveStudent}
                disabled={removingStudent}
                className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  removingStudent ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {removingStudent ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Removing...
                  </span>
                ) : (
                  'Remove Student'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

 return (
    <div className="min-h-screen bg-gray-50">
      <TeahcerNav />
      
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`pt-[72px] transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-6 sm:p-10 max-w-7xl mx-auto">
          {/* Header with toggle sidebar button */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 p-2 rounded-md hover:bg-gray-200"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{classroomName} - Students</h1>
            </div>
          </div>
          {/* Enhanced Classroom Information Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md mb-8 border border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-[#3B82F6] mb-2">
                  {classroomName}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  Classroom ID: <span className="font-mono">{classroomId}</span>
                </p>
              </div>
              
              {/* Classroom Code Display */}
              <div className="mt-4 md:mt-0 bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Classroom Code:</p>
                <div className="flex items-center">
                  <span className="font-mono text-xl font-bold text-indigo-600 mr-3">{classroomCode}</span>
                  <button 
                    onClick={copyClassroomCode}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="Copy classroom code"
                  >
                    {codeCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Share this code with students to join the classroom</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8">
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="bg-white border border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white text-[#3B82F6] font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300 flex items-center gap-2"
            >
              <UserPlus size={20} />
              <span>Add Student</span>
            </button>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSort('name')}
                className={`px-4 py-2 rounded-lg border ${sortConfig.key === 'name' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}
              >
                Sort by Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('email')}
                className={`px-4 py-2 rounded-lg border ${sortConfig.key === 'email' ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}
              >
                Sort by Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header for the students list component */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
              <h2 className="text-2xl font-semibold flex items-center">
                <Users className="mr-3" size={24} />
                Students in this Classroom
              </h2>
              <p className="text-blue-100 mt-1">
                {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
              </p>
            </div>
            
            {/* Content area with padding */}
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-gray-400 mb-4">
                    <Users size={64} className="mx-auto" />
                  </div>
                  <p className="text-gray-500 text-lg">No students enrolled yet.</p>
                  <p className="text-gray-400 mt-2">Share your classroom code or add students manually to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {sortStudents(filterStudents(students)).map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold">
                                  {student.firstName ? student.firstName.charAt(0).toUpperCase() : '?'}
                                  {student.lastName ? student.lastName.charAt(0).toUpperCase() : ''}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  @{student.username || student.email.split('@')[0]}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => fetchStudentProgress(student)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              View Progress
                            </button>
                            <button
                              onClick={() => {
                                setStudentToRemove(student);
                                setRemoveModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <StudentProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        selectedStudent={selectedStudent}
        progressLoading={progressLoading}
        progressError={progressError}
        progressStats={progressStats}
        completedBooks={completedBooks}
        inProgressBooks={inProgressBooks}
        snakeGameAttempts={snakeGameAttempts}
        ssaAttempts={ssaAttempts}
        predictionAttempts={predictionAttempts}
        formatDuration={formatDuration}
        calculateSnakeGameScore={calculateSnakeGameScore}
        calculateSSAScore={calculateSSAScore}
        API_BASE_URL={API_BASE_URL}
      />

      {/* Add Student Modal */}
      <AddStudentModal />

      {/* Remove Student Modal */}
      {removeModalOpen && (
        <RemoveStudentModal />
      )}
    </div>
  );
};

export default ClassroomStudents;
