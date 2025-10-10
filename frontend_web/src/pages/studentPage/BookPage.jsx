import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import noContentImage from "../../assets/no-content.png";
import StoryProgressIndicator from "../../components/StoryProgressIndicator";
import VocabularyHighlighter from "../../components/VocabularyHighlighter";
import BookLoader from "../../components/BookLoader";
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
  const [imageLoading, setImageLoading] = useState(false);
  const contentRef = useRef(null);

  // Reading timer state - using raw seconds for backend sync
  const [totalReadingTimeSeconds, setTotalReadingTimeSeconds] = useState(0); // Total seconds from backend
  const [lastSyncedTimeSeconds, setLastSyncedTimeSeconds] = useState(0); // Last synced time to backend
  const [sessionStartTime, setSessionStartTime] = useState(null); // When current session started
  const [isReading, setIsReading] = useState(false);
  const [displayTime, setDisplayTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const intervalRef = useRef(null);
  const syncIntervalRef = useRef(null); // For periodic backend sync
  const [lastActivityTime, setLastActivityTime] = useState(Date.now()); // Track user activity
  const lastSyncTimeRef = useRef(0); // Throttle sync calls

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

  // Timer utility functions
  const secondsToDisplay = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const getCurrentTotalSeconds = () => {
    if (isReading && sessionStartTime) {
      const sessionElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      return totalReadingTimeSeconds + sessionElapsed;
    }
    return totalReadingTimeSeconds;
  };

  // Timer control functions
  const startReadingTimer = () => {
    if (!isReading) {
      const now = Date.now();
      setSessionStartTime(now);
      setIsReading(true);
      console.log(
        `Starting reading timer. Current total time: ${totalReadingTimeSeconds} seconds`
      );
    }
  };

  const pauseReadingTimer = () => {
    if (isReading && sessionStartTime) {
      const sessionElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      setTotalReadingTimeSeconds((prev) => prev + sessionElapsed);
      setIsReading(false);
      setSessionStartTime(null);
    }
  };

  const resetReadingTimer = () => {
    setTotalReadingTimeSeconds(0);
    setLastSyncedTimeSeconds(0);
    setSessionStartTime(null);
    setIsReading(false);
    setDisplayTime({ hours: 0, minutes: 0, seconds: 0 });
  };

  // Update display time every second
  useEffect(() => {
    if (isReading) {
      intervalRef.current = setInterval(() => {
        const currentTotalSeconds = getCurrentTotalSeconds();
        setDisplayTime(secondsToDisplay(currentTotalSeconds));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isReading, totalReadingTimeSeconds, sessionStartTime]);

  // Smart periodic backend sync - less frequent but more efficient
  useEffect(() => {
    if (isReading && trackerId) {
      syncIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivityTime;
        const timeSinceLastSync =
          getCurrentTotalSeconds() - lastSyncedTimeSeconds;

        // Only sync if:
        // 1. At least 30 seconds have passed since last sync, OR
        // 2. User has been inactive for more than 2 minutes (to save progress)
        if (timeSinceLastSync >= 30 || timeSinceLastActivity > 120000) {
          syncReadingTimeToBackend(currentPageIndex + 1);
          setLastActivityTime(currentTime);
        }
      }, 30000); // Check every 30 seconds instead of 5
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isReading, trackerId, currentPageIndex, lastActivityTime]);

  // Start timer when component mounts and book is loaded
  useEffect(() => {
    if (book && pages.length > 0 && !isReading) {
      // Small delay to ensure reading time is loaded from backend first
      const timer = setTimeout(() => {
        startReadingTimer();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [book, pages.length, totalReadingTimeSeconds]);

  // Pause timer when user navigates away
  useEffect(() => {
    const handleBeforeUnload = async () => {
      pauseReadingTimer();
      if (trackerId) {
        await syncReadingTimeToBackend(currentPageIndex + 1, true);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        pauseReadingTimer();
        if (trackerId) {
          await syncReadingTimeToBackend(currentPageIndex + 1, true);
        }
      } else if (book && pages.length > 0) {
        startReadingTimer();
      }
    };

    // Final sync when component unmounts
    const handleUnmount = async () => {
      if (trackerId) {
        await syncReadingTimeToBackend(currentPageIndex + 1, true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function runs on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      handleUnmount();
    };
  }, [book, pages.length, trackerId, currentPageIndex]);

  // API sync functions
  const syncReadingTimeToBackend = async (pageNumber, forceSync = false) => {
    if (!trackerId) return;

    // Throttle sync calls - prevent rapid successive calls
    const now = Date.now();
    if (!forceSync && now - lastSyncTimeRef.current < 5000) {
      console.log("Throttling sync call - too soon since last sync");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentTotalSeconds = getCurrentTotalSeconds();

      // Calculate incremental time since last sync
      const incrementalSeconds = currentTotalSeconds - lastSyncedTimeSeconds;

      // Only sync if there's new time to record (at least 1 second) or if forced
      if (incrementalSeconds >= 1 || forceSync) {
        // Convert seconds to fractional minutes to preserve precision
        const fractionalMinutes = incrementalSeconds / 60;

        await fetch(
          getApiUrl(
            `api/progress/update/${trackerId}` +
              `?pageNumber=${pageNumber}&readingTimeMinutes=${fractionalMinutes}`
          ),
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        // Update the last synced time and throttle timestamp
        setLastSyncedTimeSeconds(currentTotalSeconds);
        lastSyncTimeRef.current = now;

        console.log(
          `Synced incremental reading time: ${incrementalSeconds} seconds (${fractionalMinutes.toFixed(
            2
          )} minutes) for page ${pageNumber}`
        );
      } else {
        console.log(
          `Skipping sync - only ${incrementalSeconds} seconds since last sync`
        );
      }
    } catch (error) {
      console.error("Error syncing reading time to backend:", error);
    }
  };

  const loadReadingTimeFromBackend = async () => {
    if (!userId || !book?.bookID) {
      console.log("Cannot load reading time - missing userId or bookID", {
        userId,
        bookID: book?.bookID,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log(
        `Loading reading time for user ${userId}, book ${book.bookID}`
      );

      const response = await fetch(
        getApiUrl(`api/progress/book/${userId}/${book.bookID}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const progressData = await response.json();
        console.log("Progress data received:", progressData);

        if (
          progressData &&
          progressData.totalReadingTimeSeconds !== undefined
        ) {
          console.log(
            `Setting reading time to ${progressData.totalReadingTimeSeconds} seconds`
          );
          setTotalReadingTimeSeconds(progressData.totalReadingTimeSeconds);
          setLastSyncedTimeSeconds(progressData.totalReadingTimeSeconds);
          setDisplayTime(
            secondsToDisplay(progressData.totalReadingTimeSeconds)
          );
          console.log(
            `Loaded reading time from backend: ${progressData.totalReadingTimeSeconds} seconds`
          );
        } else {
          console.log("No reading time data found in progress data");
        }
      } else {
        console.log(
          `Failed to load progress data: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error loading reading time from backend:", error);
    }
  };

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
                getApiUrl(
                  `api/progress/book/${storedUserId}/${bookData.bookID}`
                ),
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const progressData = await progressRes.json();

              if (progressData) {
                // Set tracker ID if available
                if (progressData.id) setTrackerId(progressData.id);

                // Load saved reading time from backend (always load if available)
                if (progressData.totalReadingTimeSeconds !== undefined) {
                  setTotalReadingTimeSeconds(
                    progressData.totalReadingTimeSeconds
                  );
                  setLastSyncedTimeSeconds(
                    progressData.totalReadingTimeSeconds
                  );
                  setDisplayTime(
                    secondsToDisplay(progressData.totalReadingTimeSeconds)
                  );
                  console.log(
                    `Loaded reading time from backend: ${progressData.totalReadingTimeSeconds} seconds`
                  );
                }

                // Set to last read page if available
                if (progressData.lastPageRead) {
                  const lastPage = Math.min(
                    progressData.lastPageRead - 1,
                    pagesData.length - 1
                  );
                  setCurrentPageIndex(lastPage);
                }
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
      .get(getApiUrl(`api/progress/book/${storedUserId}/${book.bookID}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
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

  // Load reading time when tracker is available
  useEffect(() => {
    if (trackerId && book?.bookID && userId) {
      loadReadingTimeFromBackend();
    }
  }, [trackerId, book?.bookID, userId]);

  // Initial sync when tracker is available (only once)
  useEffect(() => {
    if (trackerId && pages.length > 0) {
      syncReadingTimeToBackend(currentPageIndex + 1, true);
    }
  }, [trackerId, pages.length]);

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

        // Handle 404 response (no checkpoint found)
        if (checkpointRes.status === 404) {
          // No checkpoint for this book, continue with normal page navigation
          const nextIndex = currentPageIndex + 1;
          setCurrentPageIndex(nextIndex);

          // Update reading progress if we have a tracker
          if (trackerId) {
            await syncReadingTimeToBackend(nextIndex + 1, true);
          }

          // Reset transition state after animation
          setTimeout(() => setIsPageTransitioning(false), 500);
          return;
        }

        const checkpoint = await checkpointRes.json();
        console.log("Prediction checkpoint found:", checkpoint);
        console.log("Current page index:", currentPageIndex);
        console.log("Checkpoint page number:", checkpoint.pageNumber);

        // 2) If this checkpoint lives on the *next* page…
        if (checkpoint.pageNumber === currentPageIndex + 1) {
          const checkpointId = checkpoint.id;

          // 3) Ask how many times the user has tried this checkpoint
          console.log(
            "Checking attempt count for user:",
            userId,
            "checkpoint:",
            checkpointId
          );
          const attemptRes = await fetch(
            getApiUrl(
              `api/prediction-checkpoint-attempts/user/${userId}` +
                `/checkpoint/${checkpointId}/count`
            ),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Attempt count response status:", attemptRes.status);

          if (!attemptRes.ok) {
            console.error(
              "Error fetching attempt count:",
              attemptRes.status,
              attemptRes.statusText
            );
            // Continue with normal navigation if we can't get attempt count
          } else {
            const attemptCount = await attemptRes.json();
            console.log("Attempt count for checkpoint:", attemptCount);

            // 4) Only redirect into the prediction if they've never attempted yet
            if (attemptCount === 0) {
              console.log("Redirecting to prediction page");
              navigate(`/prediction/${bookId}`);
              return;
            } else {
              console.log(
                "User has already attempted this checkpoint, continuing with normal navigation"
              );
            }
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
        await syncReadingTimeToBackend(nextIndex + 1, true);
      }

      // Reset transition state after animation
      setTimeout(() => setIsPageTransitioning(false), 500);
    } else {
      // If we *are* on the last page, sync final reading time and go to completion
      if (trackerId) {
        await syncReadingTimeToBackend(currentPageIndex + 1, true);
      }
      navigate(`/book/${bookId}/completion`);
    }
  };

  const handlePreviousPage = async () => {
    if (isPageTransitioning) return;

    setIsPageTransitioning(true);
    const prevIndex = Math.max(currentPageIndex - 1, 0);
    setCurrentPageIndex(prevIndex);

    // Update reading progress if we have a tracker
    if (trackerId) {
      await syncReadingTimeToBackend(prevIndex + 1, true);
    }

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

  // Track user activity for smart sync
  useEffect(() => {
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Track various user activities
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

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

  // Reset image loading state when page changes
  useEffect(() => {
    if (pages[currentPageIndex]?.imageURL) {
      setImageLoading(true);
    }
  }, [currentPageIndex, pages]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentNavbar />
        <BookLoader />
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

            {/* Reading Timer */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium mb-2 ${
                  readingTheme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Reading Time
              </label>
              <div
                className={`p-3 rounded-lg border text-center ${
                  readingTheme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                <div className="text-2xl font-mono font-bold">
                  {String(displayTime.hours).padStart(2, "0")}:
                  {String(displayTime.minutes).padStart(2, "0")}:
                  {String(displayTime.seconds).padStart(2, "0")}
                </div>
                <div className="text-xs mt-1">
                  {isReading ? "Reading..." : "Paused"}
                </div>
              </div>
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
                    <div className="relative w-full max-w-2xl mb-8">
                      {/* Skeleton Loader */}
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl animate-pulse">
                          <div className="flex flex-col items-center space-y-4">
                            <svg
                              className="w-16 h-16 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <div className="text-gray-400 text-sm">
                              Loading image...
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actual Image with Container */}
                      <motion.div
                        className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <img
                          src={getImageURL(currentPage.imageURL)}
                          alt="Book Page"
                          className="rounded-xl max-h-[500px] w-full object-contain"
                          onLoadStart={() => setImageLoading(true)}
                          onLoad={() => setImageLoading(false)}
                          onError={() => setImageLoading(false)}
                          style={{ display: imageLoading ? "none" : "block" }}
                        />
                      </motion.div>
                    </div>
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
              onClick={async () => {
                if (trackerId) {
                  await syncReadingTimeToBackend(currentPageIndex + 1, true);
                }
                navigate(`/book/${bookId}/complete`);
              }}
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
