import React, { useEffect, useState } from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import { fetchBooks } from "../../api/api";
import axios from "axios";

// ✨ Import local banners
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";

const StudentLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [inProgressBooks, setInProgressBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inProgressLoading, setInProgressLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🎯 Local static featured banners
  const featuredBanners = [
    { id: 1, imageURL: Banner1 },
    { id: 2, imageURL: Banner2 },
    { id: 3, imageURL: Banner3 },
  ];

  useEffect(() => {
    const getBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view the library');
          setLoading(false);
          return;
        }

        const data = await fetchBooks();
        setBooks(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getBooks();
  }, []);

  // Fetch in-progress books for the Continue Reading section
  useEffect(() => {
    const fetchInProgressBooks = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
          setInProgressLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(
          `http://localhost:8080/api/progress/in-progress/${userId}`, 
          { headers }
        );
        
        // Extract the book objects from the progress data
        const progressBooks = response.data.map(progress => progress.book);
        setInProgressBooks(progressBooks);
      } catch (err) {
        console.error("Error fetching in-progress books:", err);
      } finally {
        setInProgressLoading(false);
      }
    };

    fetchInProgressBooks();
  }, []);

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
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
        {/* ✨ Always show featured carousel with local banners */}
        <FeaturedCarousel books={featuredBanners} autoplay />

        {error ? (
          renderErrorState()
        ) : (
          <>
            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">For you</h2>
              {loading ? (
                renderLoadingState()
              ) : books.length === 0 ? (
                renderEmptyState()
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {books.slice(0, 6).map((book, index) => (
                    <BookCard key={`for-you-${book.id || index}`} book={book} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Continue Reading
              </h2>
              {inProgressLoading ? (
                renderLoadingState()
              ) : inProgressBooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You don't have any books in progress. Start reading to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {inProgressBooks.map((book, index) => (
                    <BookCard key={`continue-reading-${book.bookID || index}`} book={book} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentLibraryPage;
