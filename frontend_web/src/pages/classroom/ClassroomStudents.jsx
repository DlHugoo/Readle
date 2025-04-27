import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, UserPlus } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch classroom details and students
  useEffect(() => {
    const fetchClassroomDetails = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error("No token found. Please log in.");
        return;
      }

      try {
        const response = await fetch(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setClassroomName(data.name || "Unknown Classroom");
          // Assuming the API returns students data
          setStudents(data.students || []);
        } else {
          console.error("Failed to fetch classroom details");
        }
      } catch (error) {
        console.error("Error fetching classroom details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomDetails();
  }, [classroomId]);

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
          <button className="mb-6 bg-white border border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white text-[#3B82F6] font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300 flex items-center gap-2">
            <UserPlus size={20} />
            <span>Add Student</span>
          </button>

          {/* Students List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Students in this Classroom</h2>
            
            {loading ? (
              <p className="text-gray-500">Loading students...</p>
            ) : students.length === 0 ? (
              <p className="text-gray-500">No students enrolled in this classroom yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {students.map((student) => (
                  <div key={student.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-500 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{student.name}</h3>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomStudents;