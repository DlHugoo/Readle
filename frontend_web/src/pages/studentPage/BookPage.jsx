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
    return `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000${url}`;
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
        const pageParam = searchParams.get("page");

        if (pageParam) {
          const initialPage =
            Math.min(parseInt(pageParam), pagesData.length) - 1;
          setCurrentPageIndex(initialPage);
        } else {
          // If no page param, check for user's last read page
          const storedUserId = localStorage.getItem("userId");
          if (storedUserId && bookRes.data?.bookID) {
            const token = localStorage.getItem("token");
            try {
              const progressRes = await axios.get(
                `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/book/${storedUserId}/${bookRes.data.bookID}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (progressRes.data && progressRes.data.lastPageRead) {
                // Set to last read page (subtract 1 for zero-based index)
                const lastPage = Math.min(
                  progressRes.data.lastPageRead - 1,
                  pagesData.length - 1
                );
                setCurrentPageIndex(lastPage);
                if (progressRes.data.id) setTrackerId(progressRes.data.id);
              }
            } catch (err) {
              // If no progress found or error, default to first page
              console.log(
                "No previous reading progress found, starting from page 1"
              );
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
      const pageParam = searchParams.get("page");
      if (pageParam) {
        const newPage = Math.min(parseInt(pageParam), pages.length) - 1;
        if (newPage !== currentPageIndex) {
          setCurrentPageIndex(newPage);
        }
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [pages.length, currentPageIndex]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId || !book?.bookID || !pages.length) return;

    const token = localStorage.getItem("token");

    console.log(
      `Checking/creating tracker for User ID: ${storedUserId}, Book ID: ${book.bookID}`
    );

    // First try to get existing progress
    axios
      .get(
        `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/book/${storedUserId}/${book.bookID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        if (res.data?.id) {
          console.log("Found existing progress tracker with ID:", res.data.id);
          setTrackerId(res.data.id);

          // If we have a last page read, set the current page index
          if (res.data.lastPageRead) {
            const lastPage = Math.min(
              res.data.lastPageRead - 1,
              pages.length - 1
            );
            setCurrentPageIndex(lastPage);
          }
        }
      })
      .catch((err) => {
        // If no progress exists (404), create a new one
        if (
          err.response &&
          (err.response.status === 404 || err.response.status === 400)
        ) {
          console.log("No existing progress found, creating new tracker");
          axios
            .post(
              `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/start/${storedUserId}/${book.bookID}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
              if (res.data?.id) {
                console.log(
                  "Created new progress tracker with ID:",
                  res.data.id
                );
                setTrackerId(res.data.id);
              }
            })
            .catch((createErr) => {
              console.error(
                "Error creating progress tracker:",
                createErr.response ? createErr.response.data : createErr.message
              );
            });
        } else {
          console.error(
            "Error fetching progress:",
            err.response ? err.response.data : err.message
          );
        }
      });
  }, [book, pages]);

  useEffect(() => {
    if (trackerId && pages.length > 0) {
      const token = localStorage.getItem("token");
      axios
        .put(
          `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/update/${trackerId}?pageNumber=${
            currentPageIndex + 1
          }&readingTimeMinutes=1`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch((err) =>
          console.error("Error updating book progress on first load:", err)
        );
    }
  }, [trackerId, pages.length, currentPageIndex]);

  const handleNextPage = async () => {
    // If we’re not on the last page yet…
    if (currentPageIndex < pages.length - 1) {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId"); // or your userId state

      try {
        // 1) Load the checkpoint metadata for this book
        const { data: checkpoint } = await axios.get(
          `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/prediction-checkpoints/by-book/${bookId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2) If this checkpoint lives on the *next* page…
        if (checkpoint.pageNumber === currentPageIndex + 1) {
          const checkpointId = checkpoint.id;

          // 3) Ask how many times the user has tried this checkpoint
          const { data: attemptCount } = await axios.get(
            `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/prediction-checkpoint-attempts/user/${userId}` +
              `/checkpoint/${checkpointId}/count`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // 4) Only redirect into the prediction if they've never attempted yet
          if (attemptCount === 0) {
            navigate(`/prediction/${bookId}`);
            return;
          }
          // Otherwise fall through and advance normally
        }
      } catch (err) {
        // 404 means “no checkpoint here” → just ignore
        if (err.response?.status !== 404) {
          console.error("Error checking prediction checkpoint:", err);
        }
      }

      // ---- No new prediction, or user already tried it ----

      // Advance the page index
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);

      // Finally, update reading progress if we have a tracker
      if (trackerId) {
        try {
          await axios.put(
            `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/update/${trackerId}` +
              `?pageNumber=${nextIndex + 1}&readingTimeMinutes=1`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (updateErr) {
          console.error("Error updating progress:", updateErr);
        }
      }
    } else {
      // If we *are* on the last page, go to the completion screen
      navigate(`/book/${bookId}/completion`);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex((prev) => {
      const prevIndex = Math.max(prev - 1, 0);
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = prevIndex + 1;
        axios
          .put(
            `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=1`,
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
                onClick={() => navigate(`/book/${bookId}/complete`)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white text-lg rounded-full shadow-lg hover:bg-blue-700 transition"
              >
                Finish Reading
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
