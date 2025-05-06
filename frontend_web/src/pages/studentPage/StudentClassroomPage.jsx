import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomCode, setClassroomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const studentId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // 👇 Fetch classrooms when component mounts
  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/classrooms/student/${studentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch classrooms");
        const data = await response.json();
        setClassrooms(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Error fetching classrooms");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchClassrooms();
  }, [studentId]);

  const handleJoinClassroom = async () => {
    if (!classroomCode) {
      setError("Please enter a classroom code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/classrooms/join?studentId=${studentId}&classroomCode=${classroomCode}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setError(null);

        // Fetch updated classrooms
        const refresh = await fetch(`/api/classrooms/student/${studentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (refresh.ok) {
          const updatedClassrooms = await refresh.json();
          setClassrooms(updatedClassrooms);

          const joinedClassroom = updatedClassrooms.find(
            (c) => c.classroomCode === classroomCode
          );
          if (joinedClassroom) {
            navigate(`/classroom-content/${joinedClassroom.id}`);
          }
        }
      } else {
        setError(data.error || "Unknown error joining classroom");
      }
    } catch (err) {
      console.error("Error joining classroom:", err);
      setError("Error joining the classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-classroom-page">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Classrooms</h1>

        {loading ? (
          <p>Loading...</p>
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
                  onClick={() => navigate(`/classroom-content/${classroom.id}`)}
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No classrooms joined yet. Use a code below.</p>
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
