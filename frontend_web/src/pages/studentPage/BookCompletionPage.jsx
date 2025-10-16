import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import Confetti from "react-confetti";
import axios from "axios";
import { getImageUrl } from "../../utils/apiConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Target,
  Gamepad2,
  BookOpen,
  ArrowLeft,
  AlertCircle,
  Clock,
  FileText,
  Award,
} from "lucide-react";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return getImageUrl(url);
  }
  return url;
};

const BookCompletionPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(true);
  const [hasSSA, setHasSSA] = useState(false);
  const [hasSnakeGame, setHasSnakeGame] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${bookId}`);
        const data = await res.json();
        if (data) setBook(data);
      } catch (err) {
        console.error("Error fetching book details:", err);
      }
    };

    const checkActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Check for SSA
        const ssaRes = await fetch(`/api/ssa/by-book/${bookId}`, { headers });
        if (ssaRes.ok) {
          const ssaData = await ssaRes.json();
          setHasSSA(!!ssaData);
        } else if (ssaRes.status === 404) {
          setHasSSA(false);
        } else {
          console.error("Error checking SSA:", ssaRes.status);
          setHasSSA(false);
        }
      } catch (err) {
        console.error("Error checking SSA:", err);
        setHasSSA(false);
      }

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Check for Snake Game
        const snakeRes = await fetch(`/api/snake-questions/book/${bookId}`, {
          headers,
        });
        const snakeData = await snakeRes.json();
        setHasSnakeGame(!!snakeData && snakeData.length > 0);
      } catch (err) {
        setHasSnakeGame(false);
      }
    };

    const completeBook = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const headers = { Authorization: `Bearer ${token}` };

        if (!userId) {
          setCompletionError("User not found. Please log in again.");
          return;
        }

        setIsCompleting(true);
        setCompletionError(null);

        // First get the tracker ID for this user and book
        const progressRes = await fetch(
          `/api/progress/book/${userId}/${bookId}`,
          { headers }
        );

        if (progressRes.ok) {
          const progressData = await progressRes.json();

          if (progressData?.id) {
            // Now complete the book using the tracker ID
            await fetch(`/api/progress/complete/${progressData.id}`, {
              method: "PUT",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            console.log("Book completed successfully!");
          } else {
            setCompletionError(
              "Could not find progress tracker for this book."
            );
          }
        } else if (progressRes.status === 404) {
          setCompletionError(
            "No progress found for this book. Please start reading first."
          );
        } else {
          setCompletionError("Failed to get book progress. Please try again.");
        }
      } catch (err) {
        console.error("Error completing book:", err);
        setCompletionError("Failed to complete book. Please try again.");
      } finally {
        setIsCompleting(false);
      }
    };

    fetchBook();
    checkActivities();
    completeBook(); // Automatically complete the book when page loads
  }, [bookId]);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowConfetti(false), 10000);
    return () => clearTimeout(timeout);
  }, []);

  if (!book || isCompleting) {
    return (
      <div className="min-h-screen bg-white">
        <StudentNavbar />
        <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p>Preparing your completion page...</p>
          </div>
        </div>
      </div>
    );
  }

  if (completionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <StudentNavbar />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto px-6 py-16"
        >
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Oops!</h3>
            <p className="text-red-700 mb-6">{completionError}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/library")}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={20} />
              Back to Library
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

      <StudentNavbar />

      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center relative z-10"
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, delay: 0.3 }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-200/50">
            <Trophy size={48} className="text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4"
        >
          Well Done!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg sm:text-xl text-gray-700 mb-8"
        >
          You've successfully finished reading{" "}
          <span className="font-bold text-green-700">{book.title}</span>
        </motion.p>

        {/* Reading Statistics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <FileText size={32} className="text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">
              {book.pageCount || "—"}
            </div>
            <div className="text-xs text-gray-600">Pages</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Clock size={32} className="text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">✓</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <Award size={32} className="text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600">🏆</div>
            <div className="text-xs text-gray-600">Achievement</div>
          </div>
        </motion.div>

        {/* Book Cover with Enhanced Display */}
        {book.imageURL && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="relative mb-8"
          >
            <div className="relative transform hover:scale-105 transition-transform duration-300">
              <img
                src={getImageURL(book.imageURL)}
                alt={book.title}
                className="w-64 h-auto rounded-2xl shadow-2xl ring-4 ring-white/50"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent rounded-2xl"></div>
            </div>
          </motion.div>
        )}

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8 max-w-lg shadow-md"
        >
          <p className="text-blue-800 italic font-medium">
            "Reading is to the mind what exercise is to the body."
          </p>
          <p className="text-blue-600 text-sm mt-1">— Joseph Addison</p>
        </motion.div>

        {/* Activities Section */}
        {(hasSSA || hasSnakeGame) && (
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"
          >
            <Target className="text-green-600" />
            Test Your Knowledge
          </motion.h3>
        )}

        {!hasSSA && !hasSnakeGame ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-8 border-2 border-dashed border-gray-300 max-w-md"
          >
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-700 text-lg font-medium">
              Great job finishing this book!
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Activities for this book are coming soon...
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            {hasSSA && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/book/${bookId}/sequencing`)}
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>

                <div className="relative flex items-center gap-3">
                  <Target size={24} />
                  <span>Start Story Sequencing</span>
                </div>
              </motion.button>
            )}
            {hasSnakeGame && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/book/${bookId}/snake-game`)}
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>

                <div className="relative flex items-center gap-3">
                  <Gamepad2 size={24} />
                  <span>Play Snake Game</span>
                </div>
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Enhanced Back to Library Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={() => navigate("/library")}
          whileHover={{ x: -5 }}
          className="mt-8 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium shadow-md hover:shadow-lg"
        >
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BookCompletionPage;
