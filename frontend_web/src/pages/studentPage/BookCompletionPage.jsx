import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import Confetti from "react-confetti";
import axios from "axios";
import { getAccessToken } from "../../api/api";
import { getImageUrl } from "../../utils/apiConfig";

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
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
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
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Check for Snake Game
        const snakeRes = await fetch(`/api/snake-questions/book/${bookId}`, { headers });
        const snakeData = await snakeRes.json();
        setHasSnakeGame(!!snakeData && snakeData.length > 0);
      } catch (err) {
        setHasSnakeGame(false);
      }
    };

    const completeBook = async () => {
      try {
        const token = getAccessToken();
        const userId = localStorage.getItem("userId");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
            await fetch(
              `/api/progress/complete/${progressData.id}`,
              {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              }
            );
            console.log("Book completed successfully!");
          } else {
            setCompletionError("Could not find progress tracker for this book.");
          }
        } else if (progressRes.status === 404) {
          setCompletionError("No progress found for this book. Please start reading first.");
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

  if (!book) {
    return (
      <div className="min-h-screen bg-white">
        <StudentNavbar />
        <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg">
          Loading book details...
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-white">
        <StudentNavbar />
        <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg">
          Completing book...
        </div>
      </div>
    );
  }

  if (completionError) {
    return (
      <div className="min-h-screen bg-white">
        <StudentNavbar />
        <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            {completionError}
          </div>
          <button
            onClick={() => navigate("/library")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <StudentNavbar />

      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} />
      )}

      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-green-700 mb-4">
          Well done!
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-8">
          You've successfully finished reading{" "}
          <span className=" ">{book.title}</span>
        </p>

        {book.imageURL && (
          <img
            src={getImageURL(book.imageURL)}
            alt={book.title}
            className="w-64 h-auto rounded-lg shadow-md mb-8"
          />
        )}

        {(hasSSA || hasSnakeGame) && (
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Test your knowledge
          </h3>
        )}
        
        {(!hasSSA && !hasSnakeGame) ? (
          <p className="text-gray-600 italic mb-8">
            No activities are available for this book yet.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {hasSSA && (
              <button
                onClick={() => navigate(`/book/${bookId}/sequencing`)}
                className="px-6 py-3 bg-green-600 text-white text-lg rounded-full shadow hover:bg-green-700 transition"
              >
                🎯 Start Story Sequencing
              </button>
            )}
            {hasSnakeGame && (
              <button
                onClick={() => navigate(`/book/${bookId}/snake-game`)}
                className="px-6 py-3 bg-purple-600 text-white text-lg rounded-full shadow hover:bg-purple-700 transition"
              >
                🐍 Play Snake Game
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => navigate("/library")}
          className="mt-10 text-blue-500 hover:underline text-sm"
        >
          ← Back to Library
        </button>
      </div>
    </div>
  );
};

export default BookCompletionPage;
