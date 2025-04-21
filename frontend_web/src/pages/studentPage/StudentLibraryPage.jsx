import React, { useEffect, useState } from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import { fetchBooks } from "../../api/api";

const StudentLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredBooks, setFeaturedBooks] = useState([]);

  useEffect(() => {
    const getBooks = async () => {
      try {
        const data = await fetchBooks();
        setBooks(data);
        if (data.length) {
          setFeaturedBooks(data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };

    getBooks();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <StudentNavbar />

      {!loading && featuredBooks.length > 0 && (
        <FeaturedCarousel books={featuredBooks} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">For you</h2>
        {loading ? (
          <p className="text-center text-gray-400">Loading books...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {books.slice(0, 6).map((book) => (
              <BookCard key={book.bookID} book={book} />
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6 mt-10 text-gray-800">
          Continue Reading
        </h2>
        {loading ? (
          <p className="text-center text-gray-400">Loading books...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {books.slice(6, 8).map((book) => (
              <BookCard key={book.bookID} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLibraryPage;
