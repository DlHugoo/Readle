import { useNavigate } from "react-router-dom";
import fallbackImage from "../assets/not-available.jpeg"; // Update the path if needed
import { getImageUrl } from "../utils/apiConfig";

const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const difficultyLevel = book.difficultyLevel || 0;

  const handleClick = () => {
    navigate(`/book/${book.bookID}`, { state: { from: "LIBRARY" } });
  };

  const getDifficultyConfig = (level) => {
    switch (level) {
      case 1:
        return {
          label: "Easy",
          bgColor: "bg-emerald-500",
          textColor: "text-emerald-500",
          borderColor: "border-emerald-400",
          ringColor: "ring-emerald-500/50",
        };
      case 2:
        return {
          label: "Medium",
          bgColor: "bg-amber-500",
          textColor: "text-amber-500",
          borderColor: "border-amber-400",
          ringColor: "ring-amber-500/50",
        };
      case 3:
        return {
          label: "Hard",
          bgColor: "bg-rose-500",
          textColor: "text-rose-500",
          borderColor: "border-rose-400",
          ringColor: "ring-rose-500/50",
        };
      default:
        return null;
    }
  };

  const difficulty = getDifficultyConfig(difficultyLevel);

  return (
    <div
      className="book-card group relative cursor-pointer transition-all duration-500 ease-out hover:scale-110 hover:z-10"
      onClick={handleClick}
      style={{ margin: "0.5rem" }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={getImageUrl(book.imageURL)}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />

        {/* Subtle gradient overlay - always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-0 transition-opacity duration-500 ease-out" />

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

        {/* Difficulty Indicator - Corner Ribbon (Visible on Hover) */}
        {difficulty && (
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
            <div className="relative">
              {/* Corner triangle background */}
              <div
                className={`${difficulty.bgColor} w-16 h-16 transform rotate-45 translate-x-8 -translate-y-8`}
                style={{ transformOrigin: "center" }}
              />
              {/* Difficulty level dots */}
              <div className="absolute top-2 right-2 flex gap-1 transform -rotate-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index < difficultyLevel
                        ? "bg-white shadow-lg"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Difficulty Badge - Minimal Design (Visible on Hover) */}
        {difficulty && (
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out transform -translate-x-8 group-hover:translate-x-0">
            <div
              className={`${difficulty.bgColor} bg-opacity-95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border-2 ${difficulty.borderColor} border-opacity-50`}
            >
              {difficulty.label}
            </div>
          </div>
        )}

        {/* Book Title and Author - Bottom (Visible on Hover) */}
        {book.title && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-lg">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-white/80 text-xs drop-shadow-md">
                  by {book.author}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
