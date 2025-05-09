import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import noContentImage from "../../assets/no-content.png";
import StoryProgressIndicator from "../../components/StoryProgressIndicator";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [trackerId, setTrackerId] = useState(null);

  useEffect(() => {
    // Get userId from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.userID || decoded.id);
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  }, []);

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

  // Start reading progress when book and pages are loaded
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("[BookPage] No userId found in localStorage");
      return;
    }
    if (!book || !book.bookID) {
      console.error("[BookPage] Book or bookID not loaded yet", book);
      return;
    }
    if (!pages || pages.length === 0) {
      console.error("[BookPage] Pages not loaded yet");
      return;
    }

    const token = localStorage.getItem("token");
    console.log(`[BookPage] Attempting to start progress: userId=${storedUserId}, bookId=${book.bookID}`);

    axios.post(
      `http://localhost:8080/api/progress/start/${storedUserId}/${book.bookID}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(res => {
        if (res.data && res.data.id) {
          setTrackerId(res.data.id);
          console.log("[BookPage] Progress started, trackerId:", res.data.id);
        }
      })
      .catch((err) => console.error("[BookPage] Error starting book progress:", err));
  }, [book, pages]);

  // After setting trackerId, update progress for the first page
  useEffect(() => {
    if (trackerId && pages.length > 0) {
      const token = localStorage.getItem("token");
      axios.put(
        `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=1&readingTimeMinutes=1`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch((err) => console.error("Error updating book progress on first load:", err));
    }
  }, [trackerId, pages.length]);

  const handleNextPage = () => {
    setCurrentPageIndex((prev) => {
      const nextIndex = Math.min(prev + 1, pages.length - 1);
      // Update progress on page turn
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = nextIndex + 1;
        const readingTimeMinutes = 1; // You can replace this with actual reading time if available
        axios.put(
          `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=${readingTimeMinutes}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch((err) => console.error("Error updating book progress:", err));
      }
      // If last page, mark as completed
      if (nextIndex === pages.length - 1 && userId && book && trackerId) {
        const token = localStorage.getItem("token");
        axios.put(
          `http://localhost:8080/api/progress/complete/${trackerId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch((err) => console.error("Error completing book:", err));
      }
      return nextIndex;
    });
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex((prev) => {
      const prevIndex = Math.max(prev - 1, 0);
      // Update progress on page turn
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = prevIndex + 1;
        const readingTimeMinutes = 1; // You can replace this with actual reading time if available
        axios.put(
          `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=${readingTimeMinutes}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch((err) => console.error("Error updating book progress:", err));
      }
      return prevIndex;
    });
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
  const hasContent = currentPage?.content?.trim() || currentPage?.imageURL;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <StudentNavbar />

      {/* Hover Zones */}
      {pages.length > 1 && (
        <>
          {/* Left Hover Zone */}
          <div
            className="fixed left-0 top-0 h-full w-40 z-40 px-6"
            onMouseEnter={() => setHoverLeft(true)}
            onMouseLeave={() => setHoverLeft(false)}
          ></div>

          {/* Right Hover Zone */}
          <div
            className="fixed right-0 top-0 h-full w-40 z-40 px-6 flex justify-end"
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
          ></div>

          {/* Left Button */}
          <button
            onMouseEnter={() => setHoverLeft(true)}
            onMouseLeave={() => setHoverLeft(false)}
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0}
            className={`fixed left-40 top-1/2 transform -translate-y-1/2 
        bg-blue-400 hover:bg-blue-500 text-white 
        w-20 h-20 rounded-full flex items-center justify-center text-3xl 
        transition-all duration-300 shadow-lg z-50
        ${hoverLeft ? "opacity-100" : "opacity-0"}
        disabled:opacity-0 disabled:cursor-not-allowed`}
          >
            ‹
          </button>

          {/* Right Button */}
          <button
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className={`fixed right-40 top-1/2 transform -translate-y-1/2 
        bg-blue-400 hover:bg-blue-500 text-white 
        w-20 h-20 rounded-full flex items-center justify-center text-3xl 
        transition-all duration-300 shadow-lg z-50
        ${hoverRight ? "opacity-100" : "opacity-0"}
        disabled:opacity-0 disabled:cursor-not-allowed`}
          >
            ›
          </button>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-story-title mb-6 text-center">
          {book?.title}
        </h1>

        {/* Add Story Progress Indicator here */}
        {hasContent && pages.length > 0 && (
          <StoryProgressIndicator
            currentPage={currentPageIndex + 1}
            totalPages={pages.length}
          />
        )}

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
              {hasContent ? (
                <>
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
                    {currentPage?.content}
                  </div>
                </>
              ) : (
                // ❌ No Content
                <div className="flex flex-col items-center justify-center mt-10">
                  <img
                    src={noContentImage}
                    alt="No Content Available"
                    className="w-80 h-80 object-contain mb-4"
                  />
                  <p className="text-gray-500 text-lg text-center">
                    Oops! No content available for this page.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Add page counter below the progress indicator */}
        {hasContent && pages.length > 0 && (
          <div className="text-gray-700 font-semibold mb-4">
            Page {currentPageIndex + 1} of {pages.length}
          </div>
        )}
        <div className="flex gap-4">
          {currentPageIndex === pages.length - 1 && (
            <button
              onClick={() => navigate(`/book/${bookId}/sequencing`)}
              className="mt-4 px-6 py-3 bg-green-600 text-white text-lg rounded-full shadow-lg hover:bg-green-700 transition"
            >
              🎯 Start Story Sequencing Activity
            </button>
          )}
          {/* Updated Snake Game Button */}
          <button
            onClick={() => navigate(`/book/${bookId}/snake-game`)}
            className="mt-4 px-6 py-3 bg-purple-600 text-white text-lg rounded-full shadow-lg hover:bg-purple-700 transition"
          >
            🐍 Play Snake Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookPage;