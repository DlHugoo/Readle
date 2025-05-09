import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import TeahcerNav from '../../components/TeacherNav';
import axios from 'axios'; // Import axios

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

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMaxStudents, setCreateMaxStudents] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('token');
  const navigate = useNavigate(); // Initialize useNavigate

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
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [teacherId]);

  const handleClassroomClick = (classroomId) => {
    navigate(`/classroom-content/${classroomId}`); // Redirect to ClassroomContentManager
  };

  const handleCreateClassroom = async () => {
    if (!createName || !createDescription || !createMaxStudents || !teacherId) {
      alert('Please fill in all fields.');
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
        alert('Failed to create classroom: ' + error.response.data.message);
      } else {
        alert('An error occurred while creating the classroom.');
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
      alert("Error deleting classroom.");
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
      alert("Error updating classroom.");
    } finally {
      setShowEditModal(false);
      setSelectedClassroom(null);
    }
  };
  

  return (
    <div className="w-full">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-6xl mx-auto pt-24">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">📘 Classroom Management</h1>

        <button
          className="mb-4 bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500"
          onClick={openCreateModal}
        >
          + Create Classroom
        </button>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Create New Classroom</h2>

              <input
                type="text"
                placeholder="Classroom Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full mb-3 p-2 border border-gray-300 rounded"
              />

              <textarea
                placeholder="Description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full mb-3 p-2 border border-gray-300 rounded"
              />

              <p className="text-sm text-gray-600 mb-2">
                Teacher ID: <span className="font-mono">{teacherId || "Not found"}</span>
              </p>

              <input
                type="number"
                placeholder="Max Students"
                value={createMaxStudents}
                onChange={(e) => setCreateMaxStudents(e.target.value)}
                className="w-full mb-3 p-2 border border-gray-300 rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClassroom}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Classroom Code Alert */}
        {classroomCode && (
          <div className="bg-yellow-100 border border-yellow-300 rounded p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800">
              Classroom Created! 🎉 Share this code with students:
            </h2>
            <div className="mt-2 text-2xl font-bold text-yellow-600">{classroomCode}</div>
          </div>
        )}

        {/* Classroom List */}
        <div className="mt-8 bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-semibold mb-4">📚 Your Classrooms</h2>
          {classrooms.length === 0 ? (
            <p className="text-gray-500">No classrooms created yet.</p>
          ) : (
            <ul className="space-y-3">
              {classrooms.map((classroom, index) => (
                <li
                  key={index}
                  className="border p-4 rounded shadow-sm relative cursor-pointer hover:bg-gray-100"
                  onClick={(e) => {
                    // Prevent redirect when clicking on the 3-dot menu or its options
                    if (e.target.tagName === "BUTTON" || e.target.tagName === "SPAN") return;
                    handleClassroomClick(classroom.id);
                  }}
                >
                  <h3 className="text-lg font-bold text-blue-700">{classroom.name}</h3>
                  <p className="text-gray-600">
                    Code: <span className="font-mono">{classroom.classroomCode}</span>
                  </p>
                  <p className="text-gray-500 text-sm">{classroom.description}</p>

                  {/* 3-dot Menu */}
                  <button
                    className="absolute top-2 right-2 text-gray-700 hover:text-black text-2xl"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the redirect
                      setMenuOpenIndex(index === menuOpenIndex ? null : index);
                    }}
                  >
                    ⋮
                  </button>

                  {menuOpenIndex === index && (
                    <div className="absolute top-0 right-10 bg-white border rounded shadow-md z-10 w-40">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-yellow-200 text-yellow-600 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the redirect
                          handleEditClick(classroom);
                          setMenuOpenIndex(null); // Close the menu after clicking
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-200 text-red-600 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the redirect
                          handleDeleteClick(classroom);
                          setMenuOpenIndex(null); // Close the menu after clicking
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Enrolled Students (optional) */}
        <div className="bg-white shadow-md rounded p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">👥 Enrolled Students</h2>
          {students.length === 0 ? (
            <p className="text-gray-500">No students enrolled yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {students.map((student, index) => (
                <li key={index} className="py-2">{student.name}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Classroom</h2>

              <input
                type="text"
                placeholder="Classroom Name"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <input
                type="number"
                placeholder="Max Students"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditClassroom}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center">
              <h2 className="text-lg font-bold mb-4 text-red-600">Are you sure you want to delete this classroom?</h2>
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded bg-red-100 hover:bg-red-300 text-red-700"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={confirmDeleteClassroom}
                  className="px-4 py-2 rounded bg-green-100 hover:bg-green-300 text-green-700"
                >
                  ✅ Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md text-center">
              <h2 className="text-lg font-bold mb-4 text-green-600">{successMessage}</h2>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 rounded bg-green-100 hover:bg-green-300 text-green-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ClassroomManagement;
