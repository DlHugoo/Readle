import React, { useEffect, useState } from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import { fetchBooks } from "../../api/api"; // adjust path if needed

const StudentLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBooks = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };

    getBooks();
  }, []);

  return (
    <div>
      <StudentNavbar />
      <div className="max-w-7xl mx-auto px-10 mt-10">
        <h2 className="text-3xl font-bold mb-6 text-gray-600">Library</h2>
        {loading ? (
          <p className="text-center text-gray-400">Loading books...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book) => (
              <BookCard key={book.bookID} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLibraryPage;
