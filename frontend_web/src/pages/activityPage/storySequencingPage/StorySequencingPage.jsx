// pages/StorySequencingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../../components/StudentNavbar";
import SequencingBoard from "./SequencingBoard";
import FeedbackModal from "./FeedbackModal";
import sequenceBg from "../../../assets/sequence-bg2.png";
import { getImageUrl } from "../../../utils/apiConfig";

const StorySequencingPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);
  const [trackerId, setTrackerId] = useState(null);
  const [modal, setModal] = useState({ open: false, message: "", type: "" });
  const userId = localStorage.getItem("userId");

  // Fetch trackerId for this user/book
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (userId && bookId && token) {
      axios
        .get(`/api/progress/book/${userId}/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setTrackerId(res.data.id))
        .catch((err) => console.error("Failed to fetch trackerId:", err));
    }
  }, [userId, bookId]);

  useEffect(() => {
    const fetchSSA = async () => {
      try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          setModal({
            open: true,
            message: "Please log in to access this activity.",
            type: "error",
          });
          navigate("/login");
          return;
        }

        if (role !== "STUDENT") {
          setModal({
            open: true,
            message: "This activity is only accessible to students.",
            type: "error",
          });
          navigate("/");
          return;
        }

        const res = await axios.get(`/api/ssa/by-book/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.data) {
          throw new Error("No data received from server");
        }

        const { title, id, images } = res.data;

        if (!images || !Array.isArray(images)) {
          throw new Error("Invalid or missing image data from response.");
        }

        setStoryData({
          ssaId: id,
          title,
          images: images.map((img) => ({
            id: img.id,
            url: img.imageUrl.startsWith("/uploads")
              ? getImageUrl(img.imageUrl)
              : img.imageUrl,
          })),
        });
      } catch (err) {
        console.error("Failed to fetch SSA:", err);

        if (err.response) {
          const errorMessage = err.response.data || "An error occurred";

          switch (err.response.status) {
            case 400:
              setModal({
                open: true,
                message:
                  "This book doesn't have a Story Sequencing Activity yet.",
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
      fetchSSA();
    }
  }, [bookId, navigate]);

  const handleSubmitSequence = async (sequenceIds) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in.");
        navigate("/login");
        return;
      }

      const res = await axios.post(
        `/api/ssa/${storyData.ssaId}/check`,
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
        setReshuffleTrigger((prev) => prev + 1); // reshuffle images
      }
      // Mark book as completed if correct and trackerId is available
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
            <p>Loading story sequencing activity...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <StudentNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6 h-full">
        <div
          className="bg-white rounded-xl shadow-lg p-6 min-h-[calc(95vh-8rem)]"
          style={{
            backgroundImage: `url(${sequenceBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <h1 className="text-3xl font-bold text-center text-seq-title mb-4">
            {storyData.title}
          </h1>
          <p className="text-xl text-sequence-title text-center mb-6">
            Drag and drop the images in the correct order
          </p>

          <SequencingBoard
            key={resetCounter}
            images={storyData.images}
            onSubmit={handleSubmitSequence}
            reshuffleTrigger={reshuffleTrigger}
          />
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal
          isCorrect={isCorrect}
          attemptsLeft={attemptsLeft}
          onTryAgain={attemptsLeft > 0 ? handleTryAgain : null}
          onContinue={handleContinue}
        />
      )}

      {/* Modal for error messages */}
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

export default StorySequencingPage;
