import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, UserPlus, X, Search, BookOpen, Clock, CheckCircle, UserMinus, Mail, Copy, Check, Users, Sparkles, Star, Heart, Zap } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import StudentProgressModal from './StudentProgressModal';
import axios from "axios";

const API_BASE_URL = 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000';

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always open by default
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
      
      
  
      // Fetch attempts for each book (snake, ssa, prediction)
      const allBooks = [...completedBooksRes.data, ...inProgressBooksRes.data];
      const snakeAttemptsData = {};
      const ssaAttemptsData = {};
      const predictionAttemptsData = {}; // Will store numeric attempts per book to match StudentProgressModal expectations

      await Promise.all(allBooks.map(async (book) => {
        try {
          const bookId = book.book.bookID;
          // Snake game attempts count
          const snakeAttemptsRes = await axios.get(
            `${API_BASE_URL}/api/snake-attempts/user/${userId}/book/${bookId}/count`,
            { headers }
          );
          snakeAttemptsData[bookId] = snakeAttemptsRes.data;

          // SSA attempts count
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

          // Prediction activity: get checkpoint by book, then latest attempt correctness
          try {
            const predictionCheckpointRes = await axios.get(
              `${API_BASE_URL}/api/prediction-checkpoints/by-book/${bookId}`,
              { headers }
            );

            if (predictionCheckpointRes.data && predictionCheckpointRes.data.id) {
              const checkpointId = predictionCheckpointRes.data.id;
              if (!isNaN(Number(userId)) && !isNaN(Number(checkpointId))) {
                const predictionLatestAttemptRes = await axios.get(
                  `${API_BASE_URL}/api/prediction-checkpoint-attempts/user/${userId}/checkpoint/${checkpointId}/latest`,
                  { headers }
                );
                if (predictionLatestAttemptRes.data && typeof predictionLatestAttemptRes.data.correct === 'boolean') {
                  // Map correctness to numeric attempts: 1 if correct (100 pts), 2 if incorrect (0 pts)
                  predictionAttemptsData[bookId] = predictionLatestAttemptRes.data.correct ? 1 : 2;
                } else {
                  predictionAttemptsData[bookId] = undefined;
                }
              } else {
                predictionAttemptsData[bookId] = undefined;
              }
            } else {
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
          console.error(`Error fetching snake game attempts for book ${book.book.bookID}:`, err);
          snakeAttemptsData[book.book.bookID] = 0;
        }
      }));

      setSnakeGameAttempts(snakeAttemptsData);
      setSSAAttempts(ssaAttemptsData);
      setPredictionAttempts(predictionAttemptsData); // numeric mapping for modal compatibility
      
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
    console.log("Starting to add student:", newStudentEmail);
    
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
      console.log("Fetching user by email:", newStudentEmail);
      // First, get the user ID from the email
      const userResponse = await axios.get(`/api/users/by-email/${newStudentEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("User response:", userResponse.data);
      const studentId = userResponse.data.userId || userResponse.data.id;
      
      if (!studentId) {
        console.log("No student ID found in response");
        setAddStudentError("Student not found with this email address");
        setAddingStudent(false);
        return;
      }
      
      console.log("Found student ID:", studentId, "Adding to classroom:", classroomId);
      
      // Add the student to the classroom
      console.log("Making POST request to add student to classroom");
      const addResponse = await axios.post(`/api/classrooms/${classroomId}/students/${studentId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Add student response:", addResponse.data);
      
      // Refresh the student list
      console.log("Refreshing classroom data");
      const classroomResponse = await axios.get(`/api/classrooms/${classroomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const classroomData = classroomResponse.data;
      console.log("Updated classroom data:", classroomData);
      
      // Update the student list with the new student
      if (classroomData.studentEmails && Array.isArray(classroomData.studentEmails)) {
        console.log("Updating student list with", classroomData.studentEmails.length, "students");
        const studentPromises = classroomData.studentEmails.map(async (email) => {
          try {
            const userResponse = await axios.get(`/api/users/by-email/${email}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            return userResponse.data;
          } catch (error) {
            console.log("Error fetching user details for", email, error);
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
        console.log("Updated student details:", studentDetails);
        setStudents(studentDetails);
      }
      
      console.log("Student added successfully!");
      setAddStudentSuccess("Student added successfully");
      setNewStudentEmail("");
      
      // Close the modal after a short delay
      setTimeout(() => {
        setAddStudentModalOpen(false);
        setAddStudentSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error adding student:", error);
      console.error("Error response:", error.response);
      console.error("Error request:", error.request);
      
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        
        switch (error.response.status) {
          case 400:
            setAddStudentError(error.response.data.error || error.response.data.message || "Student could not be added");
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
          case 409:
            setAddStudentError("Student is already enrolled in this classroom");
            break;
          default:
            setAddStudentError(`Failed to add student: ${error.response.data?.message || error.response.statusText || "Please try again later."}`);
        }
      } else if (error.request) {
        console.error("Network error:", error.request);
        setAddStudentError("Unable to connect to the server. Please check your internet connection.");
      } else {
        console.error("Other error:", error.message);
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          
          {/* Enhanced Modal Header */}
          <div className="relative z-10 flex justify-between items-center border-b border-gray-200/50 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserPlus size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Add Student
              </h2>
            </div>
            <button 
              onClick={() => {
                setAddStudentModalOpen(false);
                setNewStudentEmail("");
                setAddStudentError(null);
                setAddStudentSuccess(null);
              }}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>
          
          {/* Enhanced Modal Content */}
          <div className="relative z-10 p-6">
            {addStudentError && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <X size={14} className="text-red-600" />
                  </div>
                  <div>
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{addStudentError}</span>
                  </div>
                </div>
              </div>
            )}
            
            {addStudentSuccess && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl relative mb-4" role="alert">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div>
                    <strong className="font-bold">Success: </strong>
                    <span className="block sm:inline">{addStudentSuccess}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="studentEmail" className="block text-gray-700 text-sm font-semibold mb-3">
                Student Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-black" />
                </div>
                <input
                  type="email"
                  id="studentEmail"
                  placeholder="student@example.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                  disabled={addingStudent}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <Sparkles size={12} className="mr-1 text-yellow-500" />
                The student must already have a Readle account with this email address.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAddStudentModalOpen(false);
                  setNewStudentEmail("");
                  setAddStudentError(null);
                  setAddStudentSuccess(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={addingStudent || !newStudentEmail}
                className={`group px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  (addingStudent || !newStudentEmail) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {addingStudent ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                    Add Student
                  </span>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Management</h1>
                    <p className="text-gray-600 text-lg">Monitor and manage your classroom students</p>
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
          {/* Enhanced Classroom Information Card */}
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-8 border border-white/50 relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {classroomName}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">Classroom ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{classroomId}</span>
                  </p>
                </div>
              </div>
              
              {/* Enhanced Classroom Code Display */}
              <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-xl shadow-lg border border-blue-200/50 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 flex items-center">
                    <Sparkles size={16} className="mr-2 text-yellow-500" />
                    Classroom Code
                  </p>
                  <Heart size={16} className="text-red-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {classroomCode}
                  </span>
                  <button 
                    onClick={copyClassroomCode}
                    className="group p-2 rounded-lg hover:bg-blue-100 transition-all duration-150 ease-out"
                    title="Copy classroom code"
                  >
                    {codeCopied ? 
                      <Check size={20} className="text-green-500" /> : 
                      <Copy size={20} className="text-gray-500 group-hover:text-blue-600" />
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <Zap size={12} className="mr-1 text-yellow-500" />
                  Share this code with students to join
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="mb-8">
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 ease-out overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <UserPlus size={22} className="relative z-10" />
              <span className="font-bold text-lg relative z-10">Add Student</span>
              <Zap size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-200 ease-out" />
            </button>
          </div>

          {/* Enhanced Search and Sort Controls */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSort('name')}
                className={`group px-6 py-3 rounded-xl border-2 transition-all duration-150 ease-out ${
                  sortConfig.key === 'name' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg' 
                    : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  Sort by Name 
                  {sortConfig.key === 'name' && (
                    <span className="group-hover:rotate-180 transition-transform duration-200 ease-out">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => handleSort('email')}
                className={`group px-6 py-3 rounded-xl border-2 transition-all duration-150 ease-out ${
                  sortConfig.key === 'email' 
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white border-transparent shadow-lg' 
                    : 'border-gray-300 bg-white/70 backdrop-blur-sm hover:border-emerald-500 hover:shadow-md'
                }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  Sort by Email 
                  {sortConfig.key === 'email' && (
                    <span className="group-hover:rotate-180 transition-transform duration-200 ease-out">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Enhanced Students List Container */}
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
                      Student Roster
                    </h2>
                    <p className="text-indigo-100 text-lg">
                      {students.length} {students.length === 1 ? 'student' : 'students'} enrolled in this classroom
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
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" style={{animationDelay: '0.1s', animationDirection: 'reverse'}}></div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl relative" role="alert">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <X size={16} className="text-red-600" />
                    </div>
                    <div>
                      <strong className="font-bold">Error: </strong>
                      <span className="block sm:inline">{error}</span>
                    </div>
                  </div>
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
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortStudents(filterStudents(students)).map((student, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-100 ease-out">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold text-sm">
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
                            <div className="flex space-x-3">
                              <button
                                onClick={() => fetchStudentProgress(student)}
                                className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 ease-out shadow-md hover:shadow-lg"
                              >
                                <span className="flex items-center gap-2">
                                  <BookOpen size={14} className="group-hover:rotate-12 transition-transform duration-200 ease-out" />
                                  View Progress
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToRemove(student);
                                  setRemoveModalOpen(true);
                                }}
                                className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 ease-out shadow-md hover:shadow-lg"
                              >
                                <span className="flex items-center gap-2">
                                  <UserMinus size={14} className="group-hover:rotate-12 transition-transform duration-200 ease-out" />
                                  Remove
                                </span>
                              </button>
                            </div>
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
