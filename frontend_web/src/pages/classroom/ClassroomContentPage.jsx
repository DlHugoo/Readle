import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";
import arrow from "../../assets/arrow.png";

const ClassroomContentPage = () => {
  const { classroomId } = useParams();
  const [books, setBooks] = useState([]);
  const [classroomName, setClassroomName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await fetch(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setClassroomName(data.name);
        } else {
          setClassroomName("Unknown Class");
        }
      } catch {
        setClassroomName("Unknown Class");
      }
    };

    const fetchBooks = async () => {
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/books`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to load books.");
        const data = await response.json();
        setBooks(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not fetch classroom books.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
    fetchBooks();
  }, [classroomId]);

  const getImageUrl = (path) =>
    path?.startsWith("/uploads") ? `http://localhost:8080${path}` : path;

  return (
    <div className="classroom-content-page min-h-screen bg-[#f9fbfc]">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/student-classrooms"
            title="Back to My Classrooms"
            className="hover:opacity-80 transition"
          >
            <img src={arrow} alt="Back" className="w-8 h-8" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            {classroomName}
          </h1>
        </div>

        {/* Books */}
        {loading ? (
          <p className="text-gray-500">Loading books...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book) => (
              <Link to={`/book/${book.bookID}`} key={book.bookID}>
                <div className="relative group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition w-44 sm:w-48 mx-auto">
                  {/* Book Cover */}
                  <div className="w-full h-72 bg-white flex items-center justify-center">
                    <img
                      src={getImageUrl(book.imageURL)}
                      alt={book.title}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150";
                      }}
                    />
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                    <div>
                      <h2 className="text-sm font-semibold truncate mb-1" title={book.title}>
                        {book.title}
                      </h2>
                      <p className="text-xs">by {book.author}</p>
                      <p className="text-xs italic text-gray-300">{book.genre}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-gray-600 py-16">
            <img
              src={mascot}
              alt="No books mascot"
              className="w-48 h-auto mb-4 object-contain"
            />
            <h2 className="text-lg font-semibold">No books added yet</h2>
            <p className="text-sm text-gray-500">
              Your teacher hasn't added any content for this class.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomContentPage;
