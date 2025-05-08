import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { Menu, UserPlus } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from "axios";

const ClassroomStudents = () => {
  const { classroomId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Extract students from the classroom data
        if (classroomData.studentEmails && Array.isArray(classroomData.studentEmails)) {
          // Map student emails to student objects with enhanced name processing
          const processedStudents = classroomData.studentEmails.map((email, index) => {
            // Extract username from email (part before @)
            const username = email.split('@')[0];
            
            // Process username to get firstName and lastName
            // Assuming username format could be: john.doe, john_doe, johndoe
            let firstName = username;
            let lastName = '';
            
            // Try to split by common separators
            if (username.includes('.')) {
              const parts = username.split('.');
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            } else if (username.includes('_')) {
              const parts = username.split('_');
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            } else {
              // Try to intelligently split camelCase or just take first part
              const match = username.match(/^([a-z]+)([A-Z][a-z]+)$/);
              if (match) {
                firstName = match[1];
                lastName = match[2];
              } else {
                // Try to split based on potential word boundaries in lowercase names
                // For example: "studentsample" -> "Student Sample"
                const potentialWords = username.match(/[a-z]+/g);
                if (potentialWords && potentialWords.length > 1) {
                  firstName = potentialWords[0];
                  lastName = potentialWords.slice(1).join(' ');
                }
              }
            }
            
            // Capitalize first letter of names
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            if (lastName) {
              lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
            }
            
            return {
              id: index,
              userId: index,
              firstName: firstName,
              lastName: lastName,
              email: email
            };
          });
          
          console.log("Processed students:", processedStudents);
          setStudents(processedStudents);
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
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : students.length === 0 ? (
              <p className="text-gray-500">No students enrolled in this classroom yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {students.map((student) => (
                  <div key={student.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-500 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {student.firstName ? student.firstName.charAt(0) : '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{student.firstName} <span className="font-extrabold">{student.lastName}</span></h3>
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