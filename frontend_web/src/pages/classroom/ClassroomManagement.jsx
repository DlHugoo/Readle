import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import TeahcerNav from '../../components/TeacherNav';
import axios from 'axios'; // Import axios
import { PlusCircle, Users, BookOpen, Calendar, Code, Edit, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react'; // Import icons

const ClassroomManagement = () => {
  const [classroomName, setClassroomName] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [classroomCode, setClassroomCode] = useState('');
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  // Removed teacherName state

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMaxStudents, setCreateMaxStudents] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // New state for notification modal
  const [notificationModal, setNotificationModal] = useState({
    show: false,
    type: 'info', // 'info', 'success', 'error', 'warning'
    message: '',
    title: ''
  });

  const token = localStorage.getItem('token');
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to show notification modal instead of alert
  const showNotification = (type, title, message) => {
    setNotificationModal({
      show: true,
      type,
      title,
      message
    });
  };

  // Function to close notification modal
  const closeNotification = () => {
    setNotificationModal({
      ...notificationModal,
      show: false
    });
  };

  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.userID || decoded.id || decoded.sub;
    } catch (error) {
      console.error("Failed to decode token", error);
      return null;
    }
  };

  const teacherId = getUserIdFromToken();

  // Removed fetchTeacherName function

  const fetchClassrooms = async () => {
    if (!teacherId) return;

    try {
      const response = await axios.get(`/api/classrooms/teacher/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClassrooms(response.data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      showNotification('error', 'Error', 'Failed to fetch classrooms. Please try again later.');
    }
  };

  useEffect(() => {
    fetchClassrooms();
    // Removed fetchTeacherName call
  }, [teacherId]);

  const handleClassroomClick = (classroomId) => {
    navigate(`/classroom-content/${classroomId}`); // Redirect to ClassroomContentManager
  };

  const handleCreateClassroom = async () => {
    if (!createName || !createDescription || !createMaxStudents || !teacherId) {
      showNotification('warning', 'Missing Information', 'Please fill in all fields.');
      return;
    }
  
    const classroomDTO = {
      name: createName,
      description: createDescription,
      teacherId: teacherId,
      maxStudents: parseInt(createMaxStudents),
    };
  
    try {
      const response = await axios.post('/api/classrooms', classroomDTO, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setClassroomCode(response.data.classroomCode);
      setSuccessMessage("Classroom created successfully! 🎉");
      setShowModal(false);
      setCreateName('');
      setCreateDescription('');
      setCreateMaxStudents('');
      fetchClassrooms();
    } catch (error) {
      console.error('Error creating classroom:', error);
      if (error.response && error.response.data) {
        showNotification('error', 'Creation Failed', 'Failed to create classroom: ' + error.response.data.message);
      } else {
        showNotification('error', 'Creation Failed', 'An error occurred while creating the classroom.');
      }
    }
  };
  
  const openCreateModal = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateMaxStudents('');
    setShowModal(true);
  };
  
  
  const handleEditClick = (classroom) => {
    setSelectedClassroom(classroom);
    setClassroomName(classroom.name);
    setDescription(classroom.description);
    setMaxStudents(classroom.maxStudents.toString());
    setShowEditModal(true);
  };
  
  const handleDeleteClick = (classroom) => {
    setSelectedClassroom(classroom);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteClassroom = async () => {
    try {
      await axios.delete(`/api/classrooms/${selectedClassroom.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setSuccessMessage("Classroom deleted successfully! 🗑️");
      setShowSuccessModal(true);
      fetchClassrooms();
    } catch (error) {
      console.error("Delete error:", error);
      showNotification('error', 'Deletion Failed', 'Error deleting classroom.');
    } finally {
      setShowDeleteModal(false);
      setSelectedClassroom(null);
    }
  };
  
  const submitEditClassroom = async () => {
    const updatedDTO = {
      name: classroomName,
      description,
      maxStudents: parseInt(maxStudents),
      teacherId: teacherId,
    };
  
    try {
      await axios.put(`/api/classrooms/${selectedClassroom.id}`, updatedDTO, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setSuccessMessage("Classroom updated successfully! ✏️");
      setShowSuccessModal(true);
      fetchClassrooms();
    } catch (error) {
      console.error("Update error:", error);
      showNotification('error', 'Update Failed', 'Error updating classroom.');
    } finally {
      setShowEditModal(false);
      setSelectedClassroom(null);
    }
  };
  
  // Generate a random pastel color for classroom cards
  const getRandomPastelColor = (index) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-yellow-100 border-yellow-300 text-yellow-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
      'bg-red-100 border-red-300 text-red-800',
      'bg-teal-100 border-teal-300 text-teal-800',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 flex items-center">
            📘 Classroom Management
          </h1>
          
          {/* Improved Create Classroom Button */}
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={openCreateModal}
          >
            <PlusCircle size={20} />
            <span className="font-semibold">Create Classroom</span>
          </button>
        </div>

        {/* Classroom Code Alert */}
        {classroomCode && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 border-l-4 border-yellow-400 rounded-lg p-6 mb-8 shadow-md">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              Classroom Created Successfully! 🎉
            </h2>
            <p className="text-yellow-700 mb-3">Share this code with your students to join:</p>
            <div className="flex items-center justify-between bg-white p-3 rounded-md border border-yellow-300">
              <span className="text-2xl font-mono font-bold text-yellow-600">{classroomCode}</span>
              <button 
                className="text-yellow-600 hover:text-yellow-800"
                onClick={() => {
                  navigator.clipboard.writeText(classroomCode);
                  showNotification('success', 'Copied!', 'Code copied to clipboard!');
                }}
              >
                <Code size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Classroom List as a distinct component with improved styling */}
        <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header for the classroom list component */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
            <h2 className="text-2xl font-semibold flex items-center">
              <BookOpen className="mr-3" size={24} />
              Your Classrooms
            </h2>
            <p className="text-blue-100 mt-1">Manage all your teaching spaces in one place</p>
          </div>
          
          {/* Content area with padding */}
          <div className="p-6">
            {classrooms.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-400 mb-4">
                  <BookOpen size={64} className="mx-auto" />
                </div>
                <p className="text-gray-500 text-lg">No classrooms created yet.</p>
                <p className="text-gray-400 mt-2">Create your first classroom to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom, index) => {
                  const colorClass = getRandomPastelColor(index);
                  
                  return (
                    <div
                      key={index}
                      className={`relative rounded-xl shadow-md overflow-hidden border-2 hover:shadow-lg transition-all duration-300 ${colorClass}`}
                    >
                      {/* Classroom Header */}
                      <div className="p-5 border-b border-opacity-30">
                        <h3 className="text-xl font-bold truncate">{classroom.name}</h3>
                      </div>
                      
                      {/* Classroom Body */}
                      <div 
                        className="p-5 cursor-pointer"
                        onClick={() => handleClassroomClick(classroom.id)}
                      >
                        {/* Description */}
                        <p className="mb-4 text-opacity-90 line-clamp-2">{classroom.description}</p>
                        
                        {/* Stats */}
                          <div className="flex items-center gap-3 mb-4">
                            <Users size={18} className="mr-2 opacity-70" />
                            <span className="font-medium">Maximum Students: {classroom.maxStudents}</span>
                          </div>
                    
                        {/* Classroom Code */}
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="text-xs opacity-70">Classroom Code</p>
                            <p className="font-mono font-bold">{classroom.classroomCode}</p>
                          </div>
                          <button 
                            className="p-2 rounded-full hover:bg-white hover:bg-opacity-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(classroom.classroomCode);
                              showNotification('success', 'Copied!', 'Code copied to clipboard!');
                            }}
                          >
                            <Code size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex space-x-1">
                        <button
                          className="p-2 rounded-full bg-white bg-opacity-50 hover:bg-opacity-80 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(classroom);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-2 rounded-full bg-white bg-opacity-50 hover:bg-opacity-80 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(classroom);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-blue-600">Create New Classroom</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="Enter classroom name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe your classroom"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    placeholder="Enter maximum number of students"
                    value={createMaxStudents}
                    onChange={(e) => setCreateMaxStudents(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClassroom}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Create Classroom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-yellow-600">Edit Classroom</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="Enter classroom name"
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe your classroom"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    placeholder="Enter maximum number of students"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditClassroom}
                  className="px-5 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                >
                  Update Classroom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl text-center">
              <div className="text-red-500 mb-4">
                <Trash2 size={48} className="mx-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-800">Delete Classroom</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedClassroom?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteClassroom}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl text-center">
              <div className="text-green-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Success!</h2>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Notification Modal - New addition to replace all alerts */}
        {notificationModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {notificationModal.type === 'success' && (
                    <CheckCircle className="text-green-500 mr-3" size={24} />
                  )}
                  {notificationModal.type === 'error' && (
                    <AlertCircle className="text-red-500 mr-3" size={24} />
                  )}
                  {notificationModal.type === 'warning' && (
                    <AlertCircle className="text-yellow-500 mr-3" size={24} />
                  )}
                  {notificationModal.type === 'info' && (
                    <AlertCircle className="text-blue-500 mr-3" size={24} />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800">
                    {notificationModal.title}
                  </h3>
                </div>
                <button 
                  onClick={closeNotification}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mb-5">{notificationModal.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeNotification}
                  className={`px-4 py-2 rounded-lg text-white ${
                    notificationModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 
                    notificationModal.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                    notificationModal.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomManagement;
