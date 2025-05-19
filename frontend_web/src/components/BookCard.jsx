import { useNavigate } from "react-router-dom";
import fallbackImage from "../assets/not-available.jpeg"; // Update the path if needed

const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const filledStars = book.difficultyLevel || 0;

  const handleClick = () => {
    navigate(`/book/${book.bookID}`, { state: { from: "LIBRARY" } });
  };

  return (
    <div
      className="book-card relative flex flex-col cursor-pointer transition-transform duration-300 hover:scale-110 mx-2"
      onClick={handleClick}
    >
      <div className="book-cover overflow-hidden rounded-lg shadow-md">
        <img
          src={
            book.imageURL?.startsWith("/uploads")
              ? `http://localhost:8080${book.imageURL}`
              : book.imageURL
          }
          alt={book.title}
          className="w-full h-auto object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />
      </div>
      <div className="mt-2 text-center">
        <div className="stars flex justify-center space-x-1">
          {Array.from({ length: filledStars }).map((_, index) => (
            <span
              key={index}
              className="text-yellow-400 text-xl transition-transform duration-200 hover:scale-125"
              title={
                filledStars === 1
                  ? "Easy"
                  : filledStars === 2
                  ? "Medium"
                  : "Hard"
              }
            >
              ⭐
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
