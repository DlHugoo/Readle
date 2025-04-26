import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const BookPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  useEffect(() => {
    const loadBookAndPages = async () => {
      try {
        const bookRes = await axios.get(`/api/books/${bookId}`);
        const pagesRes = await axios.get(`/api/pages/${bookId}`);
        const pagesData = pagesRes.data.sort(
          (a, b) => a.pageNumber - b.pageNumber
        );

        if (bookRes.data) setBook(bookRes.data);
        setPages(pagesData);
      } catch (err) {
        console.error("Error loading book:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookAndPages();
  }, [bookId]);

  const handleNextPage = () => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentNavbar />
        <p className="text-center mt-20 text-gray-500">Loading...</p>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <StudentNavbar />

      {/* Hover Zones */}
      {pages.length > 1 && (
        <>
          {/* Left Hover Zone */}
          <div
            className="fixed left-0 top-0 h-full w-24 z-40"
            onMouseEnter={() => setHoverLeft(true)}
            onMouseLeave={() => setHoverLeft(false)}
          ></div>

          {/* Right Hover Zone */}
          <div
            className="fixed right-0 top-0 h-full w-24 z-40"
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
          ></div>

          {/* Left Button */}
          <button
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0}
            className={`fixed left-6 top-1/2 transform -translate-y-1/2 
                       bg-blue-400 hover:bg-blue-500 text-white 
                       w-16 h-16 rounded-full flex items-center justify-center text-3xl 
                       transition-all duration-300 shadow-lg z-50
                       ${hoverLeft ? "opacity-100" : "opacity-0"}
                       disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            ‹
          </button>

          {/* Right Button */}
          <button
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className={`fixed right-6 top-1/2 transform -translate-y-1/2 
                       bg-blue-400 hover:bg-blue-500 text-white 
                       w-16 h-16 rounded-full flex items-center justify-center text-3xl 
                       transition-all duration-300 shadow-lg z-50
                       ${hoverRight ? "opacity-100" : "opacity-0"}
                       disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            ›
          </button>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col items-center">
        {/* Book Title */}
        <h1 className="text-3xl font-bold text-story-title mb-6 text-center">
          {book?.title}
        </h1>

        {/* Page Transition Animation */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage?.pageID}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Page Image */}
              {currentPage?.imageURL && (
                <img
                  src={getImageURL(currentPage.imageURL)}
                  alt="Book Page"
                  className="rounded-lg max-h-[400px] object-contain mb-6"
                />
              )}

              {/* Page Content */}
              <div
                className="p-6 rounded-lg text-gray-800 text-lg leading-relaxed w-full"
                style={{ textAlign: "justify" }}
              >
                {currentPage?.content || "No content available."}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page Indicator */}
        <div className="text-gray-700 font-semibold mt-6">
          Page {currentPageIndex + 1} of {pages.length}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
