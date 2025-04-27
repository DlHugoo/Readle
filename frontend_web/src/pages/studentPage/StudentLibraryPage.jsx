import React, { useEffect, useState } from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import { fetchBooks } from "../../api/api";

// ✨ Import local banners
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";

const StudentLibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎯 Local static featured banners
  const featuredBanners = [
    { id: 1, imageURL: Banner1 },
    { id: 2, imageURL: Banner2 },
    { id: 3, imageURL: Banner3 },
  ];

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
    <div className="student-library-page bg-white min-h-screen">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        {/* ✨ Always show featured carousel with local banners */}
        <FeaturedCarousel books={featuredBanners} autoplay />

        <section className="">
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
