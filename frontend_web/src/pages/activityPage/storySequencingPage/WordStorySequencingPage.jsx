// pages/WordStorySequencingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../../components/StudentNavbar";
import WordSequencingBoard from "./WordSequencingBoard";
import FeedbackModal from "./FeedbackModal";
import { getAccessToken } from "../../../api/api";
import { useAuth } from "../../../contexts/AuthContext";
import wssaImage from "../../../assets/wssa.png";
import { motion } from "framer-motion";

const WordStorySequencingPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);
  const [trackerId, setTrackerId] = useState(null);
  const [modal, setModal] = useState({ open: false, message: "", type: "" });
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (user?.userId && bookId && token) {
      axios
        .get(`/api/progress/book/${user.userId}/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setTrackerId(res.data.id))
        .catch((err) => console.error("Failed to fetch trackerId:", err));
    }
  }, [user?.userId, bookId]);

  useEffect(() => {
    const fetchWSSA = async () => {
      try {
        const token = getAccessToken();

        if (!token || !user?.userId) {
          setModal({
            open: true,
            message: "Please log in to access this activity.",
            type: "error",
          });
          navigate("/login");
          return;
        }

        if (user?.role !== "STUDENT") {
          setModal({
            open: true,
            message: "This activity is only accessible to students.",
            type: "error",
          });
          navigate("/");
          return;
        }

        const res = await axios.get(`/api/wssa/by-book/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.data) {
          throw new Error("No data received from server");
        }

        const { title, id, texts } = res.data;

        if (!texts || !Array.isArray(texts)) {
          throw new Error("Invalid or missing text data from response.");
        }

        setStoryData({
          wssaId: id,
          title,
          texts: texts.map((text) => ({
            id: text.id,
            textContent: text.textContent,
          })),
        });
      } catch (err) {
        console.error("Failed to fetch WSSA:", err);

        if (err.response) {
          const errorMessage = err.response.data || "An error occurred";

          switch (err.response.status) {
            case 400:
              setModal({
                open: true,
                message:
                  "This book doesn't have a Word Story Sequencing Activity yet.",
                type: "error",
              });
              navigate(-1);
              break;
            case 401:
              setModal({
                open: true,
                message: "Your session has expired. Please login again.",
                type: "error",
              });
              navigate("/login");
              break;
            case 403:
              setModal({
                open: true,
                message: "You don't have permission to access this activity.",
                type: "error",
              });
              navigate("/");
              break;
            default:
              setModal({
                open: true,
                message: "Failed to load activity. Please try again later.",
                type: "error",
              });
              navigate(-1);
          }
        } else {
          setModal({
            open: true,
            message:
              "Failed to connect to the server. Please check your internet connection.",
            type: "error",
          });
          navigate(-1);
        }
      }
    };

    if (bookId) {
      fetchWSSA();
    }
  }, [bookId, navigate, user]);

  const handleSubmitSequence = async (sequenceIds) => {
    try {
      const token = getAccessToken();
      if (!token) {
        alert("You must be logged in.");
        navigate("/login");
        return;
      }

      // Step 1: Fast check - show result immediately
      const checkRes = await axios.post(
        `/api/wssa/${storyData.wssaId}/check`,
        { attemptedSequence: sequenceIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const correct = checkRes.data.correct;
      setIsCorrect(correct);
      setShowFeedback(true); // Show modal immediately
      setFeedback(""); // Clear previous feedback
      setFeedbackLoading(true); // Show loading indicator

      if (!correct) {
        setAttemptsLeft((prev) => prev - 1);
        setReshuffleTrigger((prev) => prev + 1);
      }

      if (correct && trackerId) {
        axios
          .put(
            `/api/progress/complete/${trackerId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((err) =>
            console.error("Failed to mark book as completed:", err)
          );
      }

      // Step 2: Fetch feedback asynchronously (in background)
      try {
        const feedbackRes = await axios.post(
          `/api/wssa/${storyData.wssaId}/feedback`,
          { attemptedSequence: sequenceIds },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setFeedback(feedbackRes.data.feedback || "");
      } catch (feedbackErr) {
        console.error("Failed to fetch feedback:", feedbackErr);
        // Set fallback feedback
        setFeedback(
          correct
            ? "Excellent work! You've arranged the story parts correctly."
            : "Good effort! Think about the order of events in the story."
        );
      } finally {
        setFeedbackLoading(false);
      }
    } catch (err) {
      console.error("Failed to submit sequence:", err);
      alert("❌ Submission failed. Please try again.");
    }
  };

  const handleTryAgain = () => {
    setResetCounter((prev) => prev + 1);
    setShowFeedback(false);
  };

  const handleContinue = () => {
    navigate("/library");
  };

  if (!storyData)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <StudentNavbar />
        <div className="flex justify-center items-center h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin animate-reverse opacity-50"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium">
              Loading activity...
            </p>
          </motion.div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <StudentNavbar />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Modern Header with Gradient Blue Background */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12"
        >
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-3xl shadow-xl p-6 sm:p-8 border border-blue-200/50">
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              {/* Mascot on the left */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
                <img
                  src={wssaImage}
                  alt="Word Sequencing Activity Mascot"
                  className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
                />
              </motion.div>

              {/* Title and Instructions on the right */}
              <div className="flex-1 w-full space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900">
                  Word Sequencing Activity
                </h1>

                {/* Collapsible Instructions */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl overflow-hidden border border-blue-200/50">
                  <button
                    onClick={() =>
                      setInstructionsExpanded(!instructionsExpanded)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between text-blue-900 hover:bg-white/40 transition-colors"
                  >
                    <span className="font-semibold text-sm sm:text-base">
                      Instructions
                    </span>
                    <motion.svg
                      animate={{ rotate: instructionsExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </motion.svg>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: instructionsExpanded ? "auto" : 0,
                      opacity: instructionsExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 text-blue-800 text-sm sm:text-base">
                      <ol className="space-y-3 list-none">
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                            1
                          </div>
                          <div>
                            <p className="font-semibold text-blue-700 mb-1">
                              Drag to Reorder
                            </p>
                            <p className="text-sm">
                              Click and hold any story part, then drag it to the
                              correct position in the sequence.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                            2
                          </div>
                          <div>
                            <p className="font-semibold text-indigo-700 mb-1">
                              Arrange Chronologically
                            </p>
                            <p className="text-sm">
                              Place the story parts in the order they appear in
                              the story, from first to last event.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                            3
                          </div>
                          <div>
                            <p className="font-semibold text-purple-700 mb-1">
                              Submit When Ready
                            </p>
                            <p className="text-sm">
                              Once you're confident with your arrangement, click
                              Submit to check your answer.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Activity Board */}
        <WordSequencingBoard
          key={resetCounter}
          texts={storyData.texts}
          onSubmit={handleSubmitSequence}
          reshuffleTrigger={reshuffleTrigger}
        />
      </div>

      {showFeedback && (
        <FeedbackModal
          isCorrect={isCorrect}
          feedback={feedback}
          feedbackLoading={feedbackLoading}
          attemptsLeft={attemptsLeft}
          onTryAgain={attemptsLeft > 0 ? handleTryAgain : null}
          onContinue={handleContinue}
        />
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-center mb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                  modal.type === "error"
                    ? "bg-red-100 text-red-600"
                    : modal.type === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {modal.type === "error"
                  ? "❌"
                  : modal.type === "success"
                  ? "✅"
                  : "ℹ️"}
              </div>
            </div>
            <p className="text-center text-gray-700 mb-6 text-lg">
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ open: false, message: "", type: "" })}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-reverse {
          animation-direction: reverse;
        }
      `}</style>
    </div>
  );
};

export default WordStorySequencingPage;
