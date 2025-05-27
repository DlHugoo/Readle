import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const FeedbackModal = ({ isCorrect, attemptsLeft, onTryAgain, onContinue }) => {
  const navigate = useNavigate();
  const { bookId } = useParams();

  const handleContinue = () => {
    if (isCorrect || attemptsLeft === 0) {
      navigate(`/book/${bookId}/complete`);
    } else if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all animate-bounce-in">
        <div className="text-center">
          {isCorrect ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-green-600 mb-4">
                Amazing job!
              </h2>
              <p className="text-xl mb-6">
                You arranged the pictures in the correct order!
              </p>
              <div className="flex justify-center space-x-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="text-3xl animate-star">
                    ⭐
                  </div>
                ))}
              </div>
              <div className="flex flex-col space-y-4 mt-6">
                <button
                  onClick={handleContinue}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-full text-xl font-bold transition-colors"
                >
                  Back to Book
                </button>
              </div>
            </>
          ) : (
            <>
              {attemptsLeft > 0 ? (
                <>
                  <div className="text-6xl mb-4">🤔</div>
                  <h2 className="text-3xl font-bold text-orange-500 mb-4">
                    Not quite right
                  </h2>
                  <p className="text-xl mb-2">
                    Let's try again! Think about what happened in the story.
                  </p>
                  <p className="text-lg mb-6 font-semibold">
                    You have {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
                  </p>
                  <div className="flex flex-col space-y-4 mt-6">
                    <button
                      onClick={onTryAgain}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full text-xl font-bold transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">💫</div>
                  <h2 className="text-3xl font-bold text-purple-600 mb-4">
                    Great Effort!
                  </h2>
                  <p className="text-xl mb-6">
                    Learning takes time and practice. Keep reading and you'll get better!
                  </p>
                  <div className="flex flex-col space-y-4 mt-6">
                    <button
                      onClick={handleContinue}
                      className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-full text-xl font-bold transition-colors"
                    >
                      Back to Book
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          60% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes star {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .animate-star {
          animation: star 1s ease infinite;
          animation-delay: calc(var(--star-index, 0) * 0.1s);
        }

        .animate-star:nth-child(1) {
          --star-index: 1;
        }
        .animate-star:nth-child(2) {
          --star-index: 2;
        }
        .animate-star:nth-child(3) {
          --star-index: 3;
        }
        .animate-star:nth-child(4) {
          --star-index: 4;
        }
        .animate-star:nth-child(5) {
          --star-index: 5;
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal;
