import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import TeahcerNav from '../../components/TeacherNav';
import axios from 'axios'; // Import axios
import { PlusCircle, Users, BookOpen, Calendar, Code, Edit, Trash2, AlertCircle, CheckCircle, X, GraduationCap, Sparkles, Heart, Star, Zap, ChevronDown, Info } from 'lucide-react'; // Import icons

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

  // State for expandable description
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
      showNotification('error', 'Deletion Failed', 'This book has existing progress linked to it. To maintain data integrity, deletion is disabled.');
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
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-32">
        {/* Hero Section */}
        <div className="mb-12">
          {/* Main Hero Content - Horizontal Layout */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
            {/* Left Side - Icon and Title */}
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap size={40} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Classroom Management
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Create, manage, and organize your teaching spaces with ease.
                </p>
              </div>
            </div>
            
            {/* Right Side - Learn More Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="group inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-white hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Info size={16} />
                <span>{descriptionExpanded ? 'Show Less' : 'Learn More'}</span>
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform duration-300 ${
                    descriptionExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>
            </div>
          </div>
          
          {/* Expandable Content - Full Width */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            descriptionExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-base mb-1">Student Management</h4>
                    <p className="text-sm text-gray-600">Organize students with classroom codes and progress tracking.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-base mb-1">Content Library</h4>
                    <p className="text-sm text-gray-600">Access reading materials, activities, and assessments.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-base mb-1">Progress Tracking</h4>
                    <p className="text-sm text-gray-600">Monitor achievements and identify support areas.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-base mb-1">Interactive Learning</h4>
                    <p className="text-sm text-gray-600">Create engaging experiences with real-time feedback.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Your Classrooms</h2>
            <Sparkles size={20} className="text-yellow-500" />
          </div>
          
          {/* Enhanced Create Classroom Button */}
          <button
            className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            onClick={openCreateModal}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <PlusCircle size={22} className="relative z-10" />
            <span className="font-bold text-lg relative z-10">Create New Classroom</span>
            <Zap size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        </div>

        {/* Enhanced Classroom Code Alert */}
        {classroomCode && (
          <div className="relative bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border border-emerald-200 rounded-2xl p-8 mb-8 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Classroom Created Successfully! 🎉
                </h2>
              </div>
              <p className="text-gray-700 mb-6 text-lg">Share this unique code with your students to join the classroom:</p>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Classroom Access Code</p>
                    <span className="text-3xl font-mono font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">{classroomCode}</span>
                  </div>
                  <button 
                    className="group p-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    onClick={() => {
                      navigator.clipboard.writeText(classroomCode);
                      showNotification('success', 'Copied!', 'Code copied to clipboard!');
                    }}
                  >
                    <Code size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Classroom List Container */}
        <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
          {/* Redesigned Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold flex items-center mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <BookOpen size={24} />
                    </div>
                    Your Learning Spaces
                  </h2>
                  <p className="text-indigo-100 text-lg">Manage and organize all your teaching environments</p>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <Star className="text-yellow-300" size={20} />
                  <Heart className="text-pink-300" size={20} />
                  <Sparkles className="text-purple-300" size={20} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Content Area */}
          <div className="p-8">
            {classrooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen size={48} className="text-indigo-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-4">Ready to Start Teaching?</h3>
                <p className="text-gray-500 text-lg mb-2">No classrooms created yet.</p>
                <p className="text-gray-400 mb-8">Create your first classroom and begin your teaching journey!</p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <PlusCircle size={20} />
                  <span className="font-semibold">Create Your First Classroom</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {classrooms.map((classroom, index) => {
                  const colorClass = getRandomPastelColor(index);
                  
                  return (
                    <div
                      key={index}
                      className={`group relative rounded-2xl shadow-lg overflow-hidden border border-white/50 hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer ${colorClass} backdrop-blur-sm`}
                      onClick={() => handleClassroomClick(classroom.id)}
                    >
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full transform -translate-x-4 translate-y-4 group-hover:scale-125 transition-transform duration-700"></div>
                      
                      {/* Classroom Header */}
                      <div className="p-6 border-b border-white/30">
                        <h3 className="text-2xl font-bold truncate group-hover:text-opacity-90 transition-all duration-300">{classroom.name}</h3>
                      </div>
                      
                      {/* Classroom Body */}
                      <div className="p-6">
                        {/* Description */}
                        <p className="mb-6 text-opacity-90 line-clamp-2 text-lg leading-relaxed">{classroom.description}</p>
                        
                        {/* Enhanced Stats */}
                        <div className="bg-white/40 rounded-xl p-4 mb-6 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                                <Users size={16} className="opacity-70" />
                              </div>
                              <span className="font-semibold">Max Students</span>
                            </div>
                            <span className="text-2xl font-bold">{classroom.maxStudents}</span>
                          </div>
                        </div>
                    
                        {/* Enhanced Classroom Code */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm opacity-70 mb-1">Access Code</p>
                              <p className="font-mono font-bold text-lg">{classroom.classroomCode}</p>
                            </div>
                            <button 
                              className="group p-3 rounded-xl bg-white/50 hover:bg-white/80 hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(classroom.classroomCode);
                                showNotification('success', 'Copied!', 'Code copied to clipboard!');
                              }}
                            >
                              <Code size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Action Buttons */}
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          className="p-3 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(classroom);
                          }}
                          title="Edit Classroom"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </button>
                        <button
                          className="p-3 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transform hover:scale-110 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(classroom);
                          }}
                          title="Delete Classroom"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-white/50 transform animate-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusCircle size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create New Classroom</h2>
                <p className="text-gray-600 mt-2">Set up your learning environment</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="Enter classroom name"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe your classroom and its purpose"
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 min-h-[120px] bg-white/80 backdrop-blur-sm resize-none"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Students</label>
                  <input
                    type="number"
                    placeholder="Enter maximum number of students"
                    value={createMaxStudents}
                    onChange={(e) => setCreateMaxStudents(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-10">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClassroom}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Create Classroom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-white/50 transform animate-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Edit Classroom</h2>
                <p className="text-gray-600 mt-2">Update your classroom settings</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="Enter classroom name"
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Describe your classroom and its purpose"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 min-h-[120px] bg-white/80 backdrop-blur-sm resize-none"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Students</label>
                  <input
                    type="number"
                    placeholder="Enter maximum number of students"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-10">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditClassroom}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Update Classroom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl w-full max-w-md shadow-2xl text-center border border-white/50 transform animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Delete Classroom</h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-gray-700 text-lg">
                  Are you sure you want to delete <span className="font-bold text-red-600">"{selectedClassroom?.name}"</span>?
                </p>
                <p className="text-red-600 text-sm mt-2 font-semibold">This action cannot be undone.</p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteClassroom}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl w-full max-w-md shadow-2xl text-center border border-white/50 transform animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Success!</h2>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-gray-700 text-lg">{successMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Notification Modal */}
        {notificationModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/50 transform animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  notificationModal.type === 'success' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                  notificationModal.type === 'error' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                  notificationModal.type === 'warning' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                  'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {notificationModal.type === 'success' && <CheckCircle className="text-white" size={32} />}
                  {notificationModal.type === 'error' && <AlertCircle className="text-white" size={32} />}
                  {notificationModal.type === 'warning' && <AlertCircle className="text-white" size={32} />}
                  {notificationModal.type === 'info' && <AlertCircle className="text-white" size={32} />}
                </div>
                <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
                  notificationModal.type === 'success' ? 'from-green-600 to-emerald-600' :
                  notificationModal.type === 'error' ? 'from-red-600 to-pink-600' :
                  notificationModal.type === 'warning' ? 'from-yellow-600 to-orange-600' :
                  'from-blue-600 to-indigo-600'
                }`}>
                  {notificationModal.title}
                </h3>
              </div>
              <div className={`rounded-xl p-4 mb-6 border ${
                notificationModal.type === 'success' ? 'bg-green-50 border-green-200' :
                notificationModal.type === 'error' ? 'bg-red-50 border-red-200' :
                notificationModal.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-gray-700 text-lg text-center">{notificationModal.message}</p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={closeNotification}
                  className={`px-8 py-3 rounded-xl text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold ${
                    notificationModal.type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' :
                    notificationModal.type === 'error' ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700' :
                    notificationModal.type === 'warning' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' :
                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  Got it!
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
