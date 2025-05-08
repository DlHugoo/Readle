import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";

const ClassroomContentPage = () => {
  const { classroomId } = useParams();

  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/books`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load books.");
        }

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

    fetchBooks();
  }, [classroomId]);

  const getImageUrl = (path) =>
    path?.startsWith("/uploads") ? `http://localhost:8080${path}` : path;
  

  return (
    <div className="classroom-content-page">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header section */}
        <div className="bg-white p-6 rounded-xl shadow mb-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-logo-blue">
            📚 Classroom Content
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Classroom ID: <span className="font-mono">{classroomId}</span>
          </p>
        </div>

        {/* Books Grid */}
        {loading ? (
          <p className="text-gray-500">Loading books...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
                <Link to={`/book/${book.bookID}`} key={book.bookID}>
                  <div className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer">
                    <img
                      src={getImageUrl(book.imageURL)}
                      alt={book.title}
                      className="w-full h-40 object-cover mb-4 rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150";
                      }}
                    />
                    <h2 className="text-lg font-semibold">{book.title}</h2>
                    <p className="text-sm text-gray-700">by {book.author}</p>
                    <p className="text-sm text-gray-500 italic">{book.genre}</p>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-16 bg-gray-50 rounded-lg shadow-inner">
            No books available in this classroom yet.
          </div>
        )}

        <div className="mt-8">
          <Link
            to="/student-classrooms"
            className="inline-block text-blue-500 hover:underline text-sm"
          >
            ← Back to My Classrooms
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClassroomContentPage;
