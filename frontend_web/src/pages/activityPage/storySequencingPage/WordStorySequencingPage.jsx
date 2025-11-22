// pages/WordStorySequencingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../../components/StudentNavbar";
import WordSequencingBoard from "./WordSequencingBoard";
import FeedbackModal from "./FeedbackModal";
import { getAccessToken } from "../../../api/api";
import { useAuth } from "../../../contexts/AuthContext";
import { motion } from "framer-motion";
import { Type, Sparkles } from "lucide-react";

const WordStorySequencingPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);
  const [trackerId, setTrackerId] = useState(null);
  const [modal, setModal] = useState({ open: false, message: "", type: "" });

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

      const res = await axios.post(
        `/api/wssa/${storyData.wssaId}/check`,
        { attemptedSequence: sequenceIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsCorrect(res.data.correct);
      setShowFeedback(true);

      if (!res.data.correct) {
        setAttemptsLeft((prev) => prev - 1);
        setReshuffleTrigger((prev) => prev + 1);
      }

      if (res.data.correct && trackerId) {
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <StudentNavbar />
        <div className="flex justify-center items-center h-[60vh] text-gray-500 text-lg">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-orange-500"
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
            <p>Loading word story sequencing activity...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <StudentNavbar />
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 h-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border-2 border-orange-200"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Type size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {storyData.title}
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Sparkles size={16} className="text-orange-500" />
                  <p className="text-lg text-gray-600 font-medium">
                    Word-Based Story Sequencing
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              Arrange the story parts in the correct chronological order by
              dragging them into position
            </p>
          </div>
        </motion.div>

        {/* Main Activity Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <WordSequencingBoard
            key={resetCounter}
            texts={storyData.texts}
            onSubmit={handleSubmitSequence}
            reshuffleTrigger={reshuffleTrigger}
          />
        </motion.div>
      </div>

      {showFeedback && (
        <FeedbackModal
          isCorrect={isCorrect}
          attemptsLeft={attemptsLeft}
          onTryAgain={attemptsLeft > 0 ? handleTryAgain : null}
          onContinue={handleContinue}
        />
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-center mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  modal.type === "error"
                    ? "bg-red-100"
                    : modal.type === "success"
                    ? "bg-green-100"
                    : "bg-blue-100"
                }`}
              >
                {modal.type === "error"
                  ? "❌"
                  : modal.type === "success"
                  ? "✅"
                  : "ℹ️"}
              </div>
            </div>
            <p className="text-center text-gray-700 mb-4">{modal.message}</p>
            <button
              onClick={() => setModal({ open: false, message: "", type: "" })}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordStorySequencingPage;
