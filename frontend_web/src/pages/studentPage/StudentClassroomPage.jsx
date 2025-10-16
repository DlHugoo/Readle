import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";
import { toast } from "react-toastify";
import { getAccessToken } from "../../api/api";
import "react-toastify/dist/ReactToastify.css";
import { CalendarDays, Users, BookOpen, Copy } from "lucide-react";

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomCode, setClassroomCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const studentId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const t = getAccessToken();
        const response = await fetch(`/api/classrooms/student/${studentId}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch classrooms");
        const data = await response.json();
        setClassrooms(data);
      } catch (err) {
        console.error(err);
        toast.error("Error fetching classrooms");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchClassrooms();
  }, [studentId]);

  const handleJoinClassroom = async () => {
    if (!classroomCode) {
      toast.error("Please enter a classroom code");
      return;
    }

    setLoading(true);
    try {
      const t = getAccessToken();
      const response = await fetch(
        `/api/classrooms/join?studentId=${studentId}&classroomCode=${classroomCode}`,
        {
          method: "POST",
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowJoin(false);
        setClassroomCode("");
        toast.success("Successfully joined classroom!");

        const refresh = await fetch(`/api/classrooms/student/${studentId}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
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
        toast.error(data.error || "Unknown error joining classroom");
      }
    } catch (err) {
      console.error("Error joining classroom:", err);
      toast.error("Error joining the classroom");
    } finally {
      setLoading(false);
    }
  };

  const filteredClassrooms = classrooms.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Classroom code copied!");
  };

  return (
    <div className="student-classroom-page min-h-screen bg-[#f9fbfc]">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-10 relative">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-4xl font-bold text-gray-800">My Classrooms</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search classrooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
            >
              Join Classroom
            </button>
          </div>
        </div>

        {/* Join Modal */}
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
            </div>
          </div>
        )}

        {/* Classroom Grid */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredClassrooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms.map((classroom, index) => {
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
                  className="group relative transform transition-transform hover:scale-105 hover:shadow-xl flex shadow-md rounded-xl overflow-hidden bg-white max-w-md w-full h-56 mx-auto"
                >
                  {/* Colored Icon Side */}
                  <div className={`${color} w-24 flex justify-center items-center`}>
                    <BookOpen size={36} className="text-white" />
                  </div>

                  {/* Info Side */}
                  <div className="flex-1 px-6 py-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {classroom.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {classroom.description || "No description provided."}
                      </p>
                      <div className="mt-2 flex flex-wrap text-xs gap-2 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {classroom.studentEmails?.length || 0} students
                        </span>
                        {classroom.createdAt && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={14} /> {new Date(classroom.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {classroom.classroomCode && (
                        <div className="flex items-center text-xs mt-2 gap-2 text-gray-700">
                          <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                            Code: {classroom.classroomCode}
                          </span>
                          <button
                            onClick={() => handleCopy(classroom.classroomCode)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/student/classroom-content/${classroom.id}`)}
                      className="mt-2 self-end bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded text-sm font-semibold"
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
            <p className="text-sm text-gray-500">
              Join a class using the button above to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassroomPage;
