import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomCode, setClassroomCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
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
        setShowJoin(false);
        setClassroomCode("");

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
    <div className="student-classroom-page min-h-screen bg-[#f9fbfc]">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-10 relative">
        {/* Top-right Join Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">My Classrooms</h1>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
          >
            Join Classroom
          </button>
        </div>

        {/* Modal Join Form */}
        {showJoin && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm relative">
              <button
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => setShowJoin(false)}
              >
                &times;
              </button>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Join a Classroom</h2>
              <input
                type="text"
                placeholder="Enter Classroom Code"
                value={classroomCode}
                onChange={(e) => setClassroomCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
              />
              <button
                onClick={handleJoinClassroom}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 w-full rounded font-semibold"
              >
                Submit
              </button>
              {error && <p className="text-red-500 mt-3">{error}</p>}
            </div>
          </div>
        )}

        {/* Classroom Cards */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : classrooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom, index) => {
              const bgColors = [
                "bg-orange-400",
                "bg-indigo-400",
                "bg-emerald-400",
                "bg-pink-400",
                "bg-blue-400",
                "bg-yellow-400",
              ];
              const color = bgColors[index % bgColors.length];

              return (
                <div
                  key={classroom.id}
                  className="flex shadow-md rounded-xl overflow-hidden bg-white max-w-md w-full h-36 mx-auto"
                >
                  {/* Colored side with initial */}
                  <div className={`${color} w-24 flex justify-center items-center`}>
                    <span className="text-white text-4xl font-extrabold">
                      {classroom.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content section */}
                  <div className="flex-1 px-6 py-4 flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-gray-500">{classroom.description}</p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/student/classroom-content/${classroom.id}`)
                      }
                      className="mt-auto self-end bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm font-semibold"
                    >
                      View Classroom
                    </button>
                  </div>
                </div>

              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-gray-600 py-10">
            <img
              src={mascot}
              alt="No classrooms mascot"
              className="w-48 h-auto mb-4 object-contain"
            />
            <h2 className="text-lg font-semibold">No classrooms joined yet</h2>
            <p className="text-sm text-gray-500">Join a class using the button above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassroomPage;
