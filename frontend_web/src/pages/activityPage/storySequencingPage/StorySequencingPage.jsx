// pages/StorySequencingPage.jsx
import React, { useState, useEffect } from "react";
import StudentNavbar from "../../../components/StudentNavbar";
import SequencingBoard from "./SequencingBoard";
import FeedbackModal from "./FeedbackModal";
import dummyStoryData from "./dummyStoryData";
import sequenceBg from "../../../assets/sequence-bg1.png";

const StorySequencingPage = () => {
  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [reshuffleTrigger, setReshuffleTrigger] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);

  useEffect(() => {
    setTimeout(() => setStoryData(dummyStoryData), 300);
  }, []);

  const handleSubmitSequence = (sequenceIds) => {
    const correct =
      JSON.stringify(sequenceIds) ===
      JSON.stringify(dummyStoryData.correctSequence);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (!correct) {
      setAttemptsLeft((prev) => prev - 1);
      setReshuffleTrigger((prev) => prev + 1); // trigger reshuffle
    }
  };

  const handleTryAgain = () => {
    setResetCounter((prev) => prev + 1);
    setShowFeedback(false);
  };

  const handleContinue = () => {
    alert("🎉 Continue to next activity!");
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
