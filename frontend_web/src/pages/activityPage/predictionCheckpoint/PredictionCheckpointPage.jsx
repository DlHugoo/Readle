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

  // Add sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [storyData, setStoryData] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4);
  const [slots, setSlots] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(null);

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
          pageNumber: checkpointPage,
        } = res.data;

        setPageNumber(checkpointPage);

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
      const userId = localStorage.getItem("userId");

      // Check if the prediction is correct first
      const response = await axios.post(
        `http://localhost:8080/api/prediction-checkpoints/${storyData.id}/check`,
        {
          selectedImageId: predictionSlot.id,
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Then create an attempt record using the correct endpoint
      // In your handleSubmit function, modify the second axios call:
      await axios.post(
        `http://localhost:8080/api/prediction-checkpoint-attempts?userId=${userId}&checkpointId=${storyData.id}&selectedImageId=${predictionSlot.id}&isCorrect=${response.data.correct}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsCorrect(response.data.correct);
      setShowFeedback(true);

      // After showing feedback, continue to the next page
      setTimeout(() => {
        navigate(`/book/${bookId}`);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit prediction:", err);
    }
  };

  // Remove the handleTryAgain function since we only want one attempt

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
            What happens next? Choose your prediction carefully - you only have
            one chance!
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
              disabled={!slots[slots.length - 1] || showFeedback}
              className={`px-6 py-3 rounded-full text-xl font-bold ${
                !slots[slots.length - 1] || showFeedback
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              Submit My Prediction
            </button>
          </div>

          {showFeedback && (
            <div
              className={`mt-6 p-4 rounded-lg text-center ${
                isCorrect
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <p className="text-lg font-semibold">
                {isCorrect
                  ? "Great prediction! 🎉"
                  : "Not quite right, but that's okay! 🤔"}
              </p>
              <p className="mt-2">Continuing the story in a moment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionCheckpointPage;
