/**
 * REFACTORED VERSION - Secure Storage Implementation
 * 
 * Key Changes:
 * 1. ✅ Removed localStorage for auth (use context instead)
 * 2. ✅ Use sessionStorage for UI state (hasSeenJoinPrompt)
 * 3. ✅ Use apiClient for all requests (token sent automatically)
 * 4. ✅ Better error handling and loading states
 */

import { getApiBaseUrl, getImageUrl } from "../../utils/apiConfig";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";

// ✅ Import secure storage utilities
import { useAuth } from "../../contexts/SecureAuthContext";
import { sessionStore } from "../../utils/secureStorage";
import { apiClient } from "../../api/api";

// 📌 Enhanced Error Modal with animation
const ErrorModal = ({ message, onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn"
    onClick={onClose}
  >
    <div
      className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative transform animate-slideUp"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        Oops!
      </h2>
      <p className="text-gray-600 text-center mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Got it
      </button>
    </div>
  </div>
);

// ✨ Enhanced Join Classroom Modal - REFACTORED
const JoinClassroomModal = ({ onClose, studentId }) => {
  const [classroomCode, setClassroomCode] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!classroomCode.trim()) {
      setError("Please enter a valid classroom code.");
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Use apiClient - token sent automatically via HTTPOnly cookie
      const response = await apiClient.post(
        `/api/classrooms/join?studentId=${studentId}&classroomCode=${classroomCode}`
      );

      if (response.data) {
        // ✅ Use sessionStorage instead of localStorage for UI state
        sessionStore.set("hasSeenJoinPrompt", true);
        window.location.reload();
      }
    } catch (err) {
      console.error("Join error:", err);
      const errorMsg = err.response?.data?.error || "Failed to join classroom.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative transform animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Join a Classroom
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Enter the classroom code provided by your teacher
        </p>

        <input
          type="text"
          value={classroomCode}
          onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
          placeholder="Enter classroom code"
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={isLoading}
          onKeyPress={(e) => e.key === "Enter" && handleJoin()}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            disabled={isLoading}
          >
            Maybe Later
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentLibraryPage = () => {
  const navigate = useNavigate();
  
  // ✅ Use auth context instead of localStorage
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        // ✅ Use apiClient - token sent automatically
        const response = await apiClient.get("/api/books/public");
        setBooks(response.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load books. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBooks();
    }
  }, [isAuthenticated]);

  // Check if user has seen join prompt
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "STUDENT") {
      // ✅ Use sessionStorage instead of localStorage
      const hasSeenPrompt = sessionStore.get("hasSeenJoinPrompt");
      
      if (!hasSeenPrompt) {
        // Show modal after a delay
        const timer = setTimeout(() => {
          setShowJoinModal(true);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, isAuthenticated, user]);

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    // ✅ Mark as seen in sessionStorage
    sessionStore.set("hasSeenJoinPrompt", true);
  };

  const banners = [
    {
      image: Banner1,
      title: "Welcome to Readle!",
      description: "Explore a world of stories and adventures",
    },
    {
      image: Banner2,
      title: "Learn and Grow",
      description: "Improve your reading skills every day",
    },
    {
      image: Banner3,
      title: "Track Your Progress",
      description: "See how far you've come on your reading journey",
    },
  ];

  // Show loading state while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <StudentNavbar />

      {/* Hero Section with Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeaturedCarousel banners={banners} />
      </div>

      {/* Books Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            📚 Available Books
          </h2>
          <p className="text-gray-600">
            Choose a book to start your reading adventure
          </p>
        </div>

        {error && (
          <ErrorModal message={error} onClose={() => setError(null)} />
        )}

        {books.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No books available yet
            </h3>
            <p className="text-gray-600">
              Check back later for new reading materials!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => navigate(`/student/book/${book.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Join Classroom Modal */}
      {showJoinModal && user && (
        <JoinClassroomModal
          onClose={handleCloseJoinModal}
          studentId={user.userId}
        />
      )}
    </div>
  );
};

export default StudentLibraryPage;


