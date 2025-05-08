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
            navigate(`/student/classroom-content/${joinedClassroom.id}`);
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

      <div className="container mx-auto px-4 pb-12 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          📚 Classroom Content Access
        </h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : classrooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-2xl font-bold text-logo-blue mb-2">
                  {classroom.name}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {classroom.description}
                </p>
                <button
                  onClick={() =>
                    navigate(`/student/classroom-content/${classroom.id}`)
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No classrooms joined yet. Use a code below.</p>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-md max-w-xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            🔑 Join a Classroom
          </h2>
          <input
            type="text"
            placeholder="Enter Classroom Code"
            value={classroomCode}
            onChange={(e) => setClassroomCode(e.target.value)}
            className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleJoinClassroom}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Join Classroom
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentClassroomPage;
