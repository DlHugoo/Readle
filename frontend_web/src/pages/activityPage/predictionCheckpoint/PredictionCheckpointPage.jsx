import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentNavbar from "../../../components/StudentNavbar";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import Slot from "../storySequencingPage/Slot";
import ImageCard from "../storySequencingPage/ImageCard";

const PredictionCheckpointPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [slots, setSlots] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:8080/api/prediction-checkpoints/by-book/${bookId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const {
          title,
          id,
          sequenceImages,
          options: predictionOptions,
        } = res.data;

        // Sort and prepare slots with locked sequence images
        const orderedSequence = sequenceImages
          .sort((a, b) => a.position - b.position)
          .map((img) => ({
            id: img.id,
            url: img.imageUrl.startsWith("/uploads")
              ? `http://localhost:8080${img.imageUrl}`
              : img.imageUrl,
            locked: true,
          }));

        // Add empty prediction slot at the end
        orderedSequence.push(null);

        setSlots(orderedSequence);

        const formattedOptions = predictionOptions.map((opt) => ({
          id: opt.id,
          url: opt.imageUrl.startsWith("/uploads")
            ? `http://localhost:8080${opt.imageUrl}`
            : opt.imageUrl,
        }));

        setOptions(formattedOptions);
        setStoryData({ id, title });
      } catch (err) {
        console.error("Failed to fetch prediction data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionData();
  }, [bookId]);

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    if (over.id === `slot-${slots.length - 1}`) {
      const draggedOption = options.find((opt) => opt.id === active.id);
      if (draggedOption) {
        const newSlots = [...slots];
        newSlots[slots.length - 1] = draggedOption;
        setSlots(newSlots);
      }
    }
  };

  const handleSubmit = async () => {
    const predictionSlot = slots[slots.length - 1];
    if (
      !predictionSlot ||
      !options.some((opt) => opt.id === predictionSlot.id)
    ) {
      alert("Please select a valid prediction option!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:8080/api/prediction-checkpoints/${storyData.id}/check`,
        {
          selectedImageId: predictionSlot.id,
          userId: localStorage.getItem("userId"),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsCorrect(response.data.correct);
      setShowFeedback(true);

      if (!response.data.correct) {
        setAttemptsLeft((prev) => prev - 1);
      }
    } catch (err) {
      console.error("Failed to submit prediction:", err);
    }
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
    setSlots((prev) => {
      const newSlots = [...prev];
      newSlots[newSlots.length - 1] = null;
      return newSlots;
    });
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-blue-500 text-2xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StudentNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            {storyData?.title}
          </h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            What happens next? Drag your prediction to the last slot!
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col items-center min-h-[300px]">
              <div className="flex justify-center gap-3 mb-10 flex-wrap">
                {slots.map((slot, index) => (
                  <Slot
                    key={index}
                    id={`slot-${index}`}
                    image={slot}
                    index={index}
                  />
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4 p-4 rounded-xl">
                {options.map((option) => (
                  <ImageCard key={option.id} id={option.id} url={option.url} />
                ))}
              </div>
            </div>
          </DndContext>

          <div className="text-center mt-6">
            <button
              onClick={handleSubmit}
              disabled={!slots[slots.length - 1]}
              className={`px-6 py-3 rounded-full text-xl font-bold ${
                !slots[slots.length - 1]
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              Check My Prediction
            </button>
          </div>
        </div>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">
              {isCorrect ? "🎉 Correct!" : "Try Again!"}
            </h2>
            <p className="text-gray-700 mb-6">
              {isCorrect
                ? "Great job predicting what happens next!"
                : `You have ${attemptsLeft} attempts left.`}
            </p>
            {isCorrect ? (
              <button
                onClick={() => navigate("/library")}
                className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600"
              >
                Back to Library
              </button>
            ) : (
              <button
                onClick={handleTryAgain}
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCheckpointPage;
