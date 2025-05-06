import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";

const ClassroomContentPage = () => {
  const { id: classroomId } = useParams();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`/api/classrooms/${classroomId}/books`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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

  return (
    <div className="classroom-content-page">
      <StudentNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Classroom Books
        </h1>

        {loading ? (
          <p>Loading books...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map((book) => (
              <div key={book.bookID} className="border rounded-lg p-4 shadow">
                <img
                  src={book.imageURL}
                  alt={book.title}
                  className="w-full h-40 object-cover mb-4"
                />
                <h2 className="text-lg font-semibold">{book.title}</h2>
                <p className="text-sm text-gray-700">by {book.author}</p>
                <p className="text-sm text-gray-500 italic">{book.genre}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No books available in this classroom.</p>
        )}

        <div className="mt-6">
          <Link
            to="/student-classrooms"
            className="text-blue-500 hover:underline"
          >
            ← Back to My Classrooms
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClassroomContentPage;
