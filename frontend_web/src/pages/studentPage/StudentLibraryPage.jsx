import { getApiBaseUrl, getImageUrl } from "../../utils/apiConfig";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../../api/api";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";
import { useAuth } from "../../contexts/AuthContext";

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

// ✨ Enhanced Join Classroom Modal
const JoinClassroomModal = ({ onClose }) => {
  const { user } = useAuth();
  const [classroomCode, setClassroomCode] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const token = getAccessToken();
    const studentId = user?.userId;

    if (!classroomCode.trim()) {
      setError("Please enter a valid classroom code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/classrooms/join?studentId=${studentId}&classroomCode=${classroomCode}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("hasSeenJoinPrompt", "true");
        window.location.reload();
      } else {
        setError(data?.error || "Failed to join classroom.");
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("Server error. Please try again.");
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
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-6">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Join a Classroom
          </h2>
          <p className="text-gray-600 text-sm">
            Enter the classroom code provided by your teacher
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Classroom Code"
            value={classroomCode}
            onChange={(e) => {
              setClassroomCode(e.target.value.toUpperCase());
              setError(null);
            }}
            className="w-full border-2 border-gray-200 focus:border-blue-500 px-4 py-3 rounded-xl text-center text-lg font-mono uppercase tracking-wider transition-colors outline-none"
            maxLength={10}
          />

          {error && (
            <div className="flex items-start space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleJoin}
              disabled={isLoading || !classroomCode.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  Joining...
                </>
              ) : (
                "Join Now"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentLibraryPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [inProgressBooks, setInProgressBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inProgressLoading, setInProgressLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();

  const featuredBanners = [
    { id: 1, imageURL: Banner1 },
    { id: 2, imageURL: Banner2 },
    { id: 3, imageURL: Banner3 },
  ];

  useEffect(() => {
    const getBooks = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          setError("Please log in to view the library.");
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        const response = await axios.get("/api/books/for-you", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });

        setBooks(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError("Failed to load books. Please try again later.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    // Show modal only once per first-time user
    const hasSeenPrompt = sessionStorage.getItem("hasSeenJoinPrompt");
    if (!hasSeenPrompt) {
      setShowJoinModal(true);
    }

    getBooks();
  }, []);

  useEffect(() => {
    const fetchInProgressBooks = async () => {
      try {
        const token = getAccessToken();
        const userId = user?.userId;

        if (!token || !userId) {
          setInProgressLoading(false);
          return;
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(
          `/api/progress/in-progress/${userId}`,
          { headers, withCredentials: true }
        );

        const progressBooks = response.data.map((progress) => progress.book);
        setInProgressBooks(progressBooks);
      } catch (err) {
        console.error("Error fetching in-progress books:", err);
      } finally {
        setInProgressLoading(false);
      }
    };

    fetchInProgressBooks();
  }, [user?.userId]);

  const renderSkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-2xl aspect-[3/4]"></div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {[...Array(6)].map((_, index) => (
        <div key={index}>{renderSkeletonCard()}</div>
      ))}
    </div>
  );

  const renderEmptyState = (type = "general") => {
    const emptyStates = {
      general: {
        icon: (
          <svg
            className="w-24 h-24 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        ),
        title: "No books available",
        message: "Check back later for new books to read!",
      },
      inProgress: {
        icon: (
          <svg
            className="w-24 h-24 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        title: "No books in progress",
        message: "Start reading a book to see it here!",
        action: {
          label: "Browse Books",
          onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
        },
      },
    };

    const state = emptyStates[type] || emptyStates.general;

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-xl">
        {state.icon}
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {state.title}
        </h3>
        <p className="text-gray-500 text-center mb-4">{state.message}</p>
        {state.action && (
          <button
            onClick={state.action.onClick}
            className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {state.action.label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="student-library-page bg-white min-h-screen">
      <StudentNavbar />

      <div className="container mx-auto px-4 pb-8">
        <FeaturedCarousel books={featuredBanners} autoplay />

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">For You</h2>
          {loading ? (
            renderLoadingState()
          ) : books.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {books.map((book, index) => (
                <div
                  key={`for-you-${book.bookID || index}`}
                  className="cursor-pointer"
                >
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Continue Reading
          </h2>
          {inProgressLoading ? (
            renderLoadingState()
          ) : inProgressBooks.length === 0 ? (
            renderEmptyState("inProgress")
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {inProgressBooks.map((book, index) => (
                <BookCard
                  key={`continue-reading-${book.bookID || index}`}
                  book={book}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showErrorModal && error && (
        <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
      )}

      {showJoinModal && (
        <JoinClassroomModal
          onClose={() => {
            sessionStorage.setItem("hasSeenJoinPrompt", "true");
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StudentLibraryPage;
