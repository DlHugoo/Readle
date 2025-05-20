// pages/StorySequencingPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../../components/StudentNavbar";
import SequencingBoard from "./SequencingBoard";
import FeedbackModal from "./FeedbackModal";
import sequenceBg from "../../../assets/sequence-bg1.png";

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
  const userId = localStorage.getItem("userId");

  // Fetch trackerId for this user/book
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (userId && bookId && token) {
      axios
        .get(`http://localhost:8080/api/progress/book/${userId}/${bookId}`, {
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
        if (!token) {
          alert("You must be logged in.");
          navigate("/login");
          return;
        }

        const res = await axios.get(
          `http://localhost:8080/api/ssa/by-book/${bookId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
              ? `http://localhost:8080${img.imageUrl}`
              : img.imageUrl,
          })),
        });
      } catch (err) {
        console.error("Failed to fetch SSA:", err);
        alert(
          "❌ Failed to load activity. Make sure this book has a Story Sequencing Activity."
        );
      }
    };

    fetchSSA();
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
        `http://localhost:8080/api/ssa/${storyData.ssaId}/check`,
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
            `http://localhost:8080/api/progress/complete/${trackerId}`,
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
      <div className="text-center mt-20 text-blue-500 text-2xl font-bold">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-white">
      <StudentNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          style={{
            backgroundImage: `url(${sequenceBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h1 className="text-3xl font-bold text-center text-sequence-title mb-4">
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
    </div>
  );
};

export default StorySequencingPage;
