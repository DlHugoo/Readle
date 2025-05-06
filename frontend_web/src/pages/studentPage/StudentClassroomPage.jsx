import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomCode, setClassroomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const studentId = 1; // Replace this with the actual student ID from the auth system (e.g., from JWT)
  const navigate = useNavigate();
  
  // Fetch classrooms the student is enrolled in
  useEffect(() => {
    const getClassrooms = async () => {
      try {
        const response = await fetch(`/api/classrooms/student/${studentId}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`  // Get the JWT token from local storage
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch classrooms");
        }
        const data = await response.json();
        console.log("Classrooms fetched:", data); // Debugging the fetched data
        setClassrooms(data);
      } catch (error) {
        setError("Error fetching classrooms");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getClassrooms();
  }, [studentId]);

  // Handle joining a classroom
  const handleJoinClassroom = async () => {
    if (!classroomCode) {
      setError("Please enter a classroom code");
      return;
    }

    try {
      const response = await fetch(`/api/classrooms/join?studentId=${studentId}&classroomCode=${classroomCode}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`  // Add token here from localStorage
        }
      });

      const data = await response.json();
      if (response.ok) {
        alert(data); // Success message
        // Fetch classrooms again to show the updated list
        await getClassrooms();
        // Redirect to the classroom content page after joining
        const classroom = classrooms.find((classroom) => classroom.classroomCode === classroomCode);
        if (classroom) {
          navigate(`/classroom-content/${classroom.id}`); // Redirect to classroom content
        }
      } else {
        setError(data); // Show error message from backend
      }
    } catch (err) {
      console.error("Error joining classroom:", err);
      setError("Error joining the classroom");
    }
  };

  return (
    <div className="student-classroom-page">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Classrooms</h1>

        {loading ? (
          <p>Loading classrooms...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : classrooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="p-4 border rounded shadow">
                <h2 className="text-xl font-semibold">{classroom.name}</h2>
                <p>{classroom.description}</p>
                <button
                  className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
                  onClick={() => navigate(`/classroom-content/${classroom.id}`)} // Navigate to the classroom content page
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No classrooms found.</p>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Join a Classroom</h2>
          <input
            type="text"
            placeholder="Enter Classroom Code"
            value={classroomCode}
            onChange={(e) => setClassroomCode(e.target.value)}
            className="p-2 border rounded mb-4"
          />
          <button
            onClick={handleJoinClassroom}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Join Classroom
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentClassroomPage;
