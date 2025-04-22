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
    <div className="student-library-page bg-white min-h-screen">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        {!loading && featuredBooks.length > 0 && (
          <FeaturedCarousel books={featuredBooks} />
        )}

        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">For you</h2>
          {loading ? (
            <p className="text-center py-8">Loading books...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {books.slice(3, 9).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Continue Reading
          </h2>
          {loading ? (
            <p className="text-center py-8">Loading books...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {books.slice(9, 11).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentLibraryPage;
