import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import Confetti from "react-confetti";
import axios from "axios";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
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

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`/api/books/${bookId}`);
        if (res.data) setBook(res.data);
      } catch (err) {
        console.error("Error fetching book details:", err);
      }
    };

    const checkActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Check for SSA
        const ssaRes = await axios.get(`http://localhost:8080/api/ssa/by-book/${bookId}`, { headers });
        setHasSSA(!!ssaRes.data);
      } catch (err) {
        setHasSSA(false);
      }

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Check for Snake Game
        const snakeRes = await axios.get(`http://localhost:8080/api/snake-questions/book/${bookId}`, { headers });
        setHasSnakeGame(!!snakeRes.data && snakeRes.data.length > 0);
      } catch (err) {
        setHasSnakeGame(false);
      }
    };

    fetchBook();
    checkActivities();
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
