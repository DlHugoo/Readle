import React, { useEffect, useState } from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import { fetchBooks } from "../../api/api";
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";

// 📌 Error Modal
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
      <h2 className="text-xl font-semibold text-red-600 mb-3">⚠️ Error</h2>
      <p className="text-gray-700">{message}</p>
      <button
        onClick={onClose}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded"
      >
        Dismiss
      </button>
    </div>
  </div>
);

const StudentLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const featuredBanners = [
    { id: 1, imageURL: Banner1 },
    { id: 2, imageURL: Banner2 },
    { id: 3, imageURL: Banner3 },
  ];

  useEffect(() => {
    const getBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view the library.");
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        const data = await fetchBooks();
        setBooks(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError("Failed to load books. Please try again later.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    getBooks();
  }, []);

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8 text-gray-500">
      <p>No books available at the moment.</p>
    </div>
  );

  return (
    <div className="student-library-page bg-white min-h-screen">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        <FeaturedCarousel books={featuredBanners} autoplay />

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">For You</h2>
          {loading ? (
            renderLoadingState()
          ) : books.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {books.map((book, index) => (
                <BookCard key={`for-you-${book.id || index}`} book={book} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Continue Reading
          </h2>
          {loading ? (
            renderLoadingState()
          ) : books.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {books.map((book, index) => (
                <BookCard
                  key={`continue-reading-${book.id || index}`}
                  book={book}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 🔺 Error Modal */}
      {showErrorModal && error && (
        <ErrorModal
          message={error}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default StudentLibraryPage;
