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
import sequenceBg from "../../../assets/sequence-bg1.png";

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
  const [availableOptions, setAvailableOptions] = useState([]);

  useEffect(() => {
    const fetchPredictionData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/prediction-checkpoints/by-book/${bookId}`,
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
              ? `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000${img.imageUrl}`
              : img.imageUrl,
            locked: true,
          }));

        // Add empty prediction slot at the end
        orderedSequence.push(null);

        setSlots(orderedSequence);

        const formattedOptions = predictionOptions.map((opt) => ({
          id: opt.id,
          url: opt.imageUrl.startsWith("/uploads")
            ? `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000${opt.imageUrl}`
            : opt.imageUrl,
        }));

        setOptions(formattedOptions);
        setAvailableOptions(formattedOptions); // Initialize available options
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
        // Get the current option in the slot (if any)
        const currentSlotOption = slots[slots.length - 1];

        // Update the slots with the new option
        const newSlots = [...slots];
        newSlots[slots.length - 1] = draggedOption;
        setSlots(newSlots);

        // Update available options: remove the dragged option and add back the previous one
        const newAvailableOptions = availableOptions.filter(
          (opt) => opt.id !== active.id
        );
        if (currentSlotOption) {
          newAvailableOptions.push(currentSlotOption);
        }
        setAvailableOptions(newAvailableOptions);
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
        `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/prediction-checkpoints/${storyData.id}/check`,
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
        `http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/prediction-checkpoint-attempts?userId=${userId}&checkpointId=${storyData.id}&selectedImageId=${predictionSlot.id}&isCorrect=${response.data.correct}`,
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
      }, 3000);
    } catch (err) {
      console.error("Failed to submit prediction:", err);
    }
  };

  // Remove the handleTryAgain function since we only want one attempt

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-500 text-xl font-semibold">
            Loading your prediction challenge...
          </p>
        </div>
      </div>
    );
  }

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
            {storyData?.title}
          </h1>
          <p className="text-xl text-gray-700 text-center mb-6">
            What happens next? Choose your prediction carefully
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col items-center min-h-[350px]">
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
                {availableOptions.map((option) => (
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
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div
                className={`bg-white p-8 rounded-xl shadow-2xl transform transition-all ${
                  isCorrect
                    ? "border-4 border-green-500"
                    : "border-4 border-red-500"
                }`}
              >
                <div className="text-center">
                  {isCorrect ? (
                    <div className="animate-bounce mb-4">
                      <svg
                        className="w-16 h-16 mx-auto text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    <div className="animate-pulse mb-4">
                      <svg
                        className="w-16 h-16 mx-auto text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                    </div>
                  )}
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      isCorrect ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isCorrect
                      ? "Great prediction! 🎉"
                      : "Not quite right, but that's okay! 🤔"}
                  </h3>
                  <p className="text-gray-700 text-lg mb-4">
                    {isCorrect
                      ? "You correctly predicted what happens next in the story!"
                      : "Keep reading to discover what actually happens next!"}
                  </p>
                  <div className="animate-pulse">
                    <p className="text-gray-600 italic">
                      Continuing to story in a moment...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionCheckpointPage;
