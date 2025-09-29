import React, { useEffect, useState } from "react";
import axios from "axios";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import FeaturedCarousel from "../../components/FeaturedCarousel";
import Banner1 from "../../assets/Banner-1.jpg";
import Banner2 from "../../assets/Banner-2.jpg";
import Banner3 from "../../assets/Banner-3.jpg";
import { useNavigate } from "react-router-dom";

// 📌 Error Modal
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
      <h2 className="text-xl font-semibold text-red-600 mb-3">⚠️ Error</h2>
      <p className="text-gray-700">{message}</p>
      <button
        onClick={onClose}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded"
      >
        Dismiss
      </button>
    </div>
  </div>
);

// ✨ Join Classroom Modal
const JoinClassroomModal = ({ onClose }) => {
  const [classroomCode, setClassroomCode] = useState("");
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    const studentId = localStorage.getItem("userId");

    if (!classroomCode.trim()) {
      setError("Please enter a valid classroom code.");
      return;
    }

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
        localStorage.setItem("hasSeenJoinPrompt", "true");
        window.location.reload();
      } else {
        setError(data?.error || "Failed to join classroom.");
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative">
        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Already have a classroom code?
        </h2>
        <input
          type="text"
          placeholder="Enter Classroom Code"
          value={classroomCode}
          onChange={(e) => setClassroomCode(e.target.value)}
          className="w-full border px-4 py-2 rounded-lg mb-3"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
        >
          Submit
        </button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
};

const StudentLibraryPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [inProgressBooks, setInProgressBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inProgressLoading, setInProgressLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const featuredBanners = [
    { id: 1, imageURL: Banner1 },
    { id: 2, imageURL: Banner2 },
    { id: 3, imageURL: Banner3 },
  ];

  useEffect(() => {
    const getBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view the library.");
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        const response = await axios.get(`${getApiBaseUrl()}/api/books/for-you`, {
          headers: { Authorization: `Bearer ${token}` },
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
    const hasSeenPrompt = localStorage.getItem("hasSeenJoinPrompt");
    if (!hasSeenPrompt) {
      setShowJoinModal(true);
    }

    getBooks();
  }, []);

  useEffect(() => {
    const fetchInProgressBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          setInProgressLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(
<<<<<<< HEAD
          `${getApiBaseUrl()}/api/progress/in-progress/${userId}`,
=======
          `http://localhost:3000/api/progress/in-progress/${userId}`,
>>>>>>> parent of 1822e11 (Merge branch 'main' into Admin)
          { headers }
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
  }, []);

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8 text-gray-500">
      <p>No books available at the moment.</p>
    </div>
  );

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
                <BookCard key={`for-you-${book.bookID || index}`} book={book} />
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
            <div className="text-center py-8 text-gray-500">
              <p>You haven't started reading any books yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {inProgressBooks.map((book, index) => (
                <BookCard key={`continue-reading-${book.bookID || index}`} book={book} />
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
            localStorage.setItem("hasSeenJoinPrompt", "true");
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

export default StudentLibraryPage;
