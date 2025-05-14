import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, UserPlus, X, BookOpen, Clock, CheckCircle, UserMinus, Mail } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from "axios";

const API_BASE_URL = 'http://localhost:8080';

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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

  // Progress Modal Component
  const ProgressModal = () => {
    if (!progressModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-800">
              Student Progress: {selectedStudent?.firstName || ''} {selectedStudent?.lastName || ''}
            </h2>
            <button 
              onClick={() => setProgressModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {progressLoading ? (
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
                  <div className="bg-blue-50 rounded-lg shadow p-6 flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <CheckCircle size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Completed Books</span>
                      <div className="text-3xl font-bold text-blue-600">{progressStats.completedCount}</div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg shadow p-6 flex items-center">
                    <div className="bg-yellow-100 p-3 rounded-full mr-4">
                      <BookOpen size={24} className="text-yellow-600" />
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Books in Progress</span>
                      <div className="text-3xl font-bold text-yellow-500">{progressStats.inProgressCount}</div>
                    </div>
                  </div>
                </div>

                {/* Books in Progress */}
                <div className="bg-white rounded-lg shadow border p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <BookOpen size={20} className="mr-2 text-blue-500" />
                    Books in Progress
                  </h2>
                  <ul>
                    {inProgressBooks.length === 0 && (
                      <li className="text-gray-400 italic">No books in progress.</li>
                    )}
                    {inProgressBooks.map((book) => (
                      <li key={`in-progress-${book.id}`} className="mb-6 border-b pb-4 last:border-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-semibold text-lg text-blue-700">{book.book.title}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              Last read: {new Date(book.lastReadAt).toLocaleDateString()}<br />
                              Page {book.lastPageRead} • {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)} read
                            </div>
                          </div>
                          <div className="w-full md:w-1/2 mt-2 md:mt-0">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-500 h-3 rounded-full"
                                style={{ width: `${(book.lastPageRead / book.book.totalPages) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 text-right">
                              {Math.round((book.lastPageRead / book.book.totalPages) * 100)}% complete
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Completed Books */}
                <div className="bg-white rounded-lg shadow border p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center">
                    <CheckCircle size={20} className="mr-2 text-green-500" />
                    Completed Books
                  </h2>
                  <ul>
                    {completedBooks.length === 0 && (
                      <li className="text-gray-400 italic">No completed books yet.</li>
                    )}
                    {completedBooks.map((book) => (
                      <li key={`completed-${book.id}`} className="mb-6 border-b pb-4 last:border-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <span className="font-semibold text-lg text-green-700">{book.book.title}</span>
                            <div className="text-sm text-gray-500 mt-1">
                              Completed on: {new Date(book.endTime).toLocaleDateString()}<br />
                              Total reading time: {formatDuration(book.totalReadingTimeMinutes, book.totalReadingTime)}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
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
    <div className="w-full min-h-screen flex">
    {/* Sidebar */}
    <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    
    {/* Main Content */}
    <div className="flex-1 flex flex-col pt-20"> {/* Added pt-20 for padding-top */}
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>
      
      <div className="p-6 max-w-7xl mx-auto w-full">
        {/* Sidebar Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="mb-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu size={24} />
        </button>
          
          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">
            👨‍👩‍👧‍👦 Classroom Students
          </h1>

          {/* Classroom Name and ID */}
          <div className="bg-[#F3F4F6] p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-3xl font-extrabold text-[#3B82F6] mb-2">
              {classroomName}
            </h2>
            <p className="text-sm text-gray-500">
              Classroom ID: <span className="font-mono">{classroomId}</span>
            </p>
          </div>

          {/* Add Student Button */}
          <button 
            onClick={() => setAddStudentModalOpen(true)}
            className="mb-6 bg-white border border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white text-[#3B82F6] font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300 flex items-center gap-2"
          >
            <UserPlus size={20} />
            <span>Add Student</span>
          </button>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Students in this Classroom</h2>
            
            {loading ? (
              <p className="text-gray-500">Loading students...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : students.length === 0 ? (
              <p className="text-gray-500">No students enrolled in this classroom yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {students.map((student) => (
                  <div 
                    key={student.id || student.userId || student.email} 
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow relative"
                  >
                    <div 
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-red-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentToRemove(student);
                        setRemoveModalOpen(true);
                      }}
                    >
                      <UserMinus size={16} />
                    </div>
                    
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => fetchStudentProgress(student)}
                    >
                      <div className="bg-blue-100 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {student.firstName ? student.firstName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">
                          {student.firstName || student.first_name || ''} 
                          <span className="font-extrabold"> {student.lastName || student.last_name || ''}</span>
                        </h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <div 
                      className="mt-2 text-xs text-blue-500 hover:text-blue-700 flex items-center justify-end cursor-pointer"
                      onClick={() => fetchStudentProgress(student)}
                    >
                      <Clock size={12} className="mr-1" />
                      View Progress
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ProgressModal />
      <AddStudentModal />
      <RemoveStudentModal />
    </div>
  );
};

export default ClassroomStudents;