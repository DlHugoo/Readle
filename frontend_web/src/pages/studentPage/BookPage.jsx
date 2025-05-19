import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import noContentImage from "../../assets/no-content.png";
import StoryProgressIndicator from "../../components/StoryProgressIndicator";
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
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [trackerId, setTrackerId] = useState(null);

  useEffect(() => {
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

        // Get page number from URL query params first
        const searchParams = new URLSearchParams(window.location.search);
        const pageParam = searchParams.get('page');
        
        if (pageParam) {
          const initialPage = Math.min(parseInt(pageParam), pagesData.length) - 1;
          setCurrentPageIndex(initialPage);
        } else {
          // If no page param, check for user's last read page
          const storedUserId = localStorage.getItem("userId");
          if (storedUserId && bookRes.data?.bookID) {
            const token = localStorage.getItem("token");
            try {
              const progressRes = await axios.get(
                `http://localhost:8080/api/progress/book/${storedUserId}/${bookRes.data.bookID}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (progressRes.data && progressRes.data.lastPageRead) {
                // Set to last read page (subtract 1 for zero-based index)
                const lastPage = Math.min(progressRes.data.lastPageRead - 1, pagesData.length - 1);
                setCurrentPageIndex(lastPage);
                if (progressRes.data.id) setTrackerId(progressRes.data.id);
              }
            } catch (err) {
              // If no progress found or error, default to first page
              console.log("No previous reading progress found, starting from page 1");
              setCurrentPageIndex(0);
            }
          }
        }
      } catch (err) {
        console.error("Error loading book:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookAndPages();
  }, [bookId]);

  // Add this useEffect to BookPage to handle URL changes while on the page
  useEffect(() => {
    const handleLocationChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const pageParam = searchParams.get('page');
      if (pageParam) {
        const newPage = Math.min(parseInt(pageParam), pages.length) - 1;
        if (newPage !== currentPageIndex) {
          setCurrentPageIndex(newPage);
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [pages.length, currentPageIndex]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId || !book?.bookID || !pages.length) return;

    // Only create a new tracker if we don't already have one
    if (!trackerId) {
      const token = localStorage.getItem("token");
      axios
        .post(
          `http://localhost:8080/api/progress/start/${storedUserId}/${book.bookID}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
          if (res.data?.id) setTrackerId(res.data.id);
        })
        .catch((err) => console.error("Error starting book progress:", err));
    }
  }, [book, pages, trackerId]);

  useEffect(() => {
    if (trackerId && pages.length > 0) {
      const token = localStorage.getItem("token");
      axios
        .put(
          `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=${currentPageIndex + 1}&readingTimeMinutes=1`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch((err) =>
          console.error("Error updating book progress on first load:", err)
        );
    }
  }, [trackerId, pages.length, currentPageIndex]);

  const handleNextPage = () => {
    setCurrentPageIndex((prev) => {
      const nextIndex = Math.min(prev + 1, pages.length - 1);
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = nextIndex + 1;
        axios
          .put(
            `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=1`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((err) => console.error("Error updating book progress:", err));

        if (nextIndex === pages.length - 1) {
          axios
            .put(
              `http://localhost:8080/api/progress/complete/${trackerId}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch((err) => console.error("Error completing book:", err));
        }
      }
      return nextIndex;
    });
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex((prev) => {
      const prevIndex = Math.max(prev - 1, 0);
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = prevIndex + 1;
        axios
          .put(
            `http://localhost:8080/api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=1`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((err) => console.error("Error updating book progress:", err));
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

      {/* Always Visible Navigation Buttons */}
      {pages.length > 1 && (
        <>
          <button
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0}
            className="fixed left-10 top-1/2 transform -translate-y-1/2 
              bg-blue-400 hover:bg-blue-500 text-white 
              w-20 h-20 rounded-full flex items-center justify-center text-3xl 
              transition-all duration-300 shadow-lg z-50
              opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>

          <button
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="fixed right-10 top-1/2 transform -translate-y-1/2 
              bg-blue-400 hover:bg-blue-500 text-white 
              w-20 h-20 rounded-full flex items-center justify-center text-3xl 
              transition-all duration-300 shadow-lg z-50
              opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-story-title mb-6 text-center">
          {book?.title}
        </h1>

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
                  {currentPage?.imageURL && (
                    <img
                      src={getImageURL(currentPage.imageURL)}
                      alt="Book Page"
                      className="rounded-lg max-h-[400px] object-contain mb-6"
                    />
                  )}

                  <div
                    className="p-6 rounded-lg text-gray-800 text-lg leading-relaxed w-full"
                    style={{ textAlign: "justify" }}
                  >
                    {currentPage?.content}
                  </div>
                </>
              ) : (
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

        {hasContent && pages.length > 0 && (
          <div className="text-gray-700 font-semibold mb-4">
            Page {currentPageIndex + 1} of {pages.length}
          </div>
        )}

        <div className="flex gap-4">
          {currentPageIndex === pages.length - 1 && (
            <>
              <button
                onClick={() => navigate(`/book/${bookId}/sequencing`)}
                className="mt-4 px-6 py-3 bg-green-600 text-white text-lg rounded-full shadow-lg hover:bg-green-700 transition"
              >
                🎯 Start Story Sequencing Activity
              </button>
              <button
                onClick={() => navigate(`/book/${bookId}/snake-game`)}
                className="mt-4 px-6 py-3 bg-purple-600 text-white text-lg rounded-full shadow-lg hover:bg-purple-700 transition"
              >
                🐍 Play Snake Game
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
