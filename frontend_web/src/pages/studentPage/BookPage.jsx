import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import noContentImage from "../../assets/no-content.png";
import StoryProgressIndicator from "../../components/StoryProgressIndicator";
import VocabularyHighlighter from "../../components/VocabularyHighlighter";
import { jwtDecode } from "jwt-decode";
import { getImageUrl, getApiUrl } from "../../utils/apiConfig";
import {
  Maximize2,
  Minimize2,
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Eye,
  Type,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Use utility function for image URLs
const getImageURL = getImageUrl;

const BookPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [trackerId, setTrackerId] = useState(null);

  // Immersive reading state
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [readingTheme, setReadingTheme] = useState("default"); // default, sepia, dark, high-contrast
  const [fontSize, setFontSize] = useState("medium"); // small, medium, large, xlarge
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [isVocabularyEnabled, setIsVocabularyEnabled] = useState(false);
  const contentRef = useRef(null);

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
        const bookRes = await fetch(`/api/books/${bookId}`);
        const pagesRes = await fetch(`/api/pages/${bookId}`);
        const bookData = await bookRes.json();
        const pagesData = (await pagesRes.json()).sort(
          (a, b) => a.pageNumber - b.pageNumber
        );

        if (bookData) setBook(bookData);
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
          if (storedUserId && bookData?.bookID) {
            const token = localStorage.getItem("token");
            try {
              const progressRes = await fetch(
                getApiUrl(`api/progress/book/${storedUserId}/${bookData.bookID}`),
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const progressData = await progressRes.json();

              if (progressData && progressData.lastPageRead) {
                // Set to last read page (subtract 1 for zero-based index)
                const lastPage = Math.min(
                  progressData.lastPageRead - 1,
                  pagesData.length - 1
                );
                setCurrentPageIndex(lastPage);
                if (progressData.id) setTrackerId(progressData.id);
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
        getApiUrl(`api/progress/book/${storedUserId}/${book.bookID}`),
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
              getApiUrl(`api/progress/start/${storedUserId}/${book.bookID}`),
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
          getApiUrl(`api/progress/update/${trackerId}?pageNumber=${
            currentPageIndex + 1
          }&readingTimeMinutes=1`),
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch((err) =>
          console.error("Error updating book progress on first load:", err)
        );
    }
  }, [trackerId, pages.length, currentPageIndex]);

  const handleNextPage = async () => {
    if (isPageTransitioning) return;

    // If we're not on the last page yet…
    if (currentPageIndex < pages.length - 1) {
      setIsPageTransitioning(true);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId"); // or your userId state

      try {
        // 1) Load the checkpoint metadata for this book
        const checkpointRes = await fetch(
          getApiUrl(`api/prediction-checkpoints/by-book/${bookId}`),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Handle 400 response (no checkpoint found)
        if (checkpointRes.status === 400) {
          // No checkpoint exists for this book, continue normally
          return;
        }
        
        const checkpoint = await checkpointRes.json();

        // 2) If this checkpoint lives on the *next* page…
        if (checkpoint.pageNumber === currentPageIndex + 1) {
          const checkpointId = checkpoint.id;

          // 3) Ask how many times the user has tried this checkpoint
          const attemptRes = await fetch(
            getApiUrl(`api/prediction-checkpoint-attempts/user/${userId}` +
              `/checkpoint/${checkpointId}/count`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const attemptCount = await attemptRes.json();

          // 4) Only redirect into the prediction if they've never attempted yet
          if (attemptCount === 0) {
            navigate(`/prediction/${bookId}`);
            return;
          }
          // Otherwise fall through and advance normally
        }
      } catch (err) {
        // 404 means "no checkpoint here" → just ignore
        if (err.response?.status !== 404) {
          console.error("Error checking prediction checkpoint:", err);
        }
      }

      // ---- No new prediction, or user already tried it ----

      // Advance the page index with smooth transition
      const nextIndex = currentPageIndex + 1;
      setCurrentPageIndex(nextIndex);

      // Finally, update reading progress if we have a tracker
      if (trackerId) {
        try {
          await fetch(
            getApiUrl(`api/progress/update/${trackerId}` +
              `?pageNumber=${nextIndex + 1}&readingTimeMinutes=1`),
            {
              method: 'PUT',
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({})
            }
          );
        } catch (updateErr) {
          console.error("Error updating progress:", updateErr);
        }
      }

      // Reset transition state after animation
      setTimeout(() => setIsPageTransitioning(false), 500);
    } else {
      // If we *are* on the last page, go to the completion screen
      navigate(`/book/${bookId}/completion`);
    }
  };

  const handlePreviousPage = () => {
    if (isPageTransitioning) return;

    setIsPageTransitioning(true);
    setCurrentPageIndex((prev) => {
      const prevIndex = Math.max(prev - 1, 0);
      if (userId && book && trackerId) {
        const token = localStorage.getItem("token");
        const pageNumber = prevIndex + 1;
        axios
          .put(
            getApiUrl(`api/progress/update/${trackerId}?pageNumber=${pageNumber}&readingTimeMinutes=1`),
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((err) => console.error("Error updating book progress:", err));
      }
      return prevIndex;
    });

    // Reset transition state after animation
    setTimeout(() => setIsPageTransitioning(false), 500);
  };

  // Focus mode toggle
  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  // Theme and settings handlers
  const getThemeClasses = () => {
    const baseClasses = "min-h-screen transition-all duration-300";

    switch (readingTheme) {
      case "sepia":
        return `${baseClasses} bg-amber-50 text-amber-900`;
      case "dark":
        return `${baseClasses} bg-gray-900 text-gray-100`;
      case "high-contrast":
        return `${baseClasses} bg-white text-black`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-800`;
    }
  };

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case "small":
        return "text-sm";
      case "medium":
        return "text-lg";
      case "large":
        return "text-xl";
      case "xlarge":
        return "text-2xl";
      default:
        return "text-lg";
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft" && currentPageIndex > 0) {
        handlePreviousPage();
      } else if (
        e.key === "ArrowRight" &&
        currentPageIndex < pages.length - 1
      ) {
        handleNextPage();
      } else if (e.key === "F11") {
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPageIndex, pages.length, isFocusMode]);

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
    <div className={getThemeClasses()}>
      {!isFocusMode && <StudentNavbar />}

      {/* Enhanced Reading Controls */}
      <div
        className={`fixed top-4 right-4 z-50 flex gap-2 transition-all duration-300 ${
          isFocusMode ? "translate-y-0" : "translate-y-0"
        }`}
      >
        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 border ${
            readingTheme === "dark"
              ? "bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200"
              : "bg-white/90 hover:bg-white border-gray-200 text-gray-700"
          }`}
          title={
            isFocusMode ? "Exit Focus Mode (F11)" : "Enter Focus Mode (F11)"
          }
        >
          {isFocusMode ? <Minimize2 size={20} /> : <BookOpen size={20} />}
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 border ${
            readingTheme === "dark"
              ? "bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200"
              : "bg-white/90 hover:bg-white border-gray-200 text-gray-700"
          }`}
          title="Reading Settings"
        >
          <Settings size={20} />
        </button>

        {/* Progress Toggle */}
        <button
          onClick={() => setShowProgress(!showProgress)}
          className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 border ${
            readingTheme === "dark"
              ? "bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200"
              : "bg-white/90 hover:bg-white border-gray-200 text-gray-700"
          }`}
          title="Toggle Progress"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-40 backdrop-blur-sm rounded-2xl shadow-2xl border p-6 w-80 ${
              readingTheme === "dark"
                ? "bg-gray-800/95 border-gray-700"
                : "bg-white/95 border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                readingTheme === "dark" ? "text-gray-100" : "text-gray-800"
              }`}
            >
              <Settings size={20} />
              Reading Settings
            </h3>

            {/* Theme Selection */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium mb-2 ${
                  readingTheme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Reading Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "default", label: "Default", icon: Sun },
                  { value: "sepia", label: "Sepia", icon: Eye },
                  { value: "dark", label: "Dark", icon: Moon },
                  {
                    value: "high-contrast",
                    label: "High Contrast",
                    icon: Type,
                  },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setReadingTheme(value)}
                    className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-2 text-sm ${
                      readingTheme === value
                        ? readingTheme === "dark"
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-blue-100 border-blue-300 text-blue-700"
                        : readingTheme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium mb-2 ${
                  readingTheme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Font Size
              </label>
              <div className="flex gap-2">
                {["small", "medium", "large", "xlarge"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                      fontSize === size
                        ? readingTheme === "dark"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700"
                        : readingTheme === "dark"
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocabulary Toggle */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium mb-2 ${
                  readingTheme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Vocabulary Helper
              </label>
              <button
                onClick={() => setIsVocabularyEnabled(!isVocabularyEnabled)}
                className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  isVocabularyEnabled
                    ? readingTheme === "dark"
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-blue-100 border-blue-300 text-blue-700"
                    : readingTheme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <BookOpen size={16} />
                {isVocabularyEnabled ? "Vocabulary On" : "Vocabulary Off"}
              </button>
            </div>

            {/* Audio Toggle */}
            <div className="mb-4">
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  isAudioEnabled
                    ? readingTheme === "dark"
                      ? "bg-green-600 border-green-500 text-white"
                      : "bg-green-100 border-green-300 text-green-700"
                    : readingTheme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {isAudioEnabled ? "Audio On" : "Audio Off"}
              </button>
            </div>

            {/* Keyboard Shortcuts */}
            <div
              className={`text-xs space-y-1 ${
                readingTheme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <div>← → Arrow keys to navigate</div>
              <div>F11 for focus mode</div>
              <div>Esc to exit focus</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Navigation Buttons */}
      {pages.length > 1 && (
        <>
          <button
            onClick={handlePreviousPage}
            disabled={currentPageIndex === 0 || isPageTransitioning}
            className={`fixed left-4 top-1/2 transform -translate-y-1/2 
              bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 
              w-14 h-14 rounded-full flex items-center justify-center text-2xl 
              transition-all duration-300 shadow-lg z-50 border border-gray-200
              ${
                currentPageIndex === 0 || isPageTransitioning
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            title="Previous Page (←)"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNextPage}
            disabled={
              currentPageIndex === pages.length - 1 || isPageTransitioning
            }
            className={`fixed right-4 top-1/2 transform -translate-y-1/2 
              bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 
              w-14 h-14 rounded-full flex items-center justify-center text-2xl 
              transition-all duration-300 shadow-lg z-50 border border-gray-200
              ${
                currentPageIndex === pages.length - 1 || isPageTransitioning
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            title="Next Page (→)"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div
        className={`max-w-4xl mx-auto px-6 py-5 flex flex-col items-center transition-all duration-300 ${
          isFocusMode ? "pt-20" : "pt-5"
        }`}
      >
        {!isFocusMode && (
          <h1 className="text-3xl font-bold text-story-title mb-6 text-center">
            {book?.title}
          </h1>
        )}

        {/* Enhanced Progress Indicator */}
        {hasContent && pages.length > 0 && showProgress && !isFocusMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mb-6"
          >
            <StoryProgressIndicator
              currentPage={currentPageIndex + 1}
              totalPages={pages.length}
              theme={readingTheme}
            />
          </motion.div>
        )}

        {/* Enhanced Content Area */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage?.pageID}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
                type: "spring",
                stiffness: 100,
                damping: 20,
              }}
              className="flex flex-col items-center"
              ref={contentRef}
            >
              {hasContent ? (
                <>
                  {currentPage?.imageURL && (
                    <motion.img
                      src={getImageURL(currentPage.imageURL)}
                      alt="Book Page"
                      className="rounded-xl max-h-[500px] object-contain mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    />
                  )}

                  <motion.div
                    className={`p-8 rounded-2xl w-full leading-relaxed shadow-lg border transition-all duration-300 ${
                      readingTheme === "dark"
                        ? "bg-gray-800/50 border-gray-700"
                        : readingTheme === "sepia"
                        ? "bg-amber-100/50 border-amber-200"
                        : readingTheme === "high-contrast"
                        ? "bg-white border-gray-300"
                        : "bg-white/70 border-gray-200"
                    }`}
                    style={{ textAlign: "justify" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <VocabularyHighlighter
                      text={currentPage?.content}
                      theme={readingTheme}
                      isVocabularyEnabled={isVocabularyEnabled}
                      className={`${getFontSizeClasses()} ${
                        readingTheme === "dark"
                          ? "text-gray-100"
                          : readingTheme === "sepia"
                          ? "text-amber-900"
                          : "text-gray-800"
                      }`}
                    />
                  </motion.div>
                </>
              ) : (
                <motion.div
                  className="flex flex-col items-center justify-center mt-10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src={noContentImage}
                    alt="No Content Available"
                    className="w-80 h-80 object-contain mb-4"
                  />
                  <p className="text-gray-500 text-lg text-center">
                    Oops! No content available for this page.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enhanced Page Counter */}
        {hasContent && pages.length > 0 && (
          <motion.div
            className="text-gray-600 font-semibold mb-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <BookOpen size={16} />
            Page {currentPageIndex + 1} of {pages.length}
          </motion.div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="flex gap-4">
          {currentPageIndex === pages.length - 1 && (
            <motion.button
              onClick={() => navigate(`/book/${bookId}/complete`)}
              className="mt-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg rounded-full shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              🎉 Finish Reading
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
