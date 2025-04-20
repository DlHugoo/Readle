import React from "react";

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const BookCard = ({ book }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={book.imageURL}
        alt={book.title}
        className="h-48 w-36 object-cover rounded-lg shadow-md mb-2"
        onError={(e) => (e.target.src = "https://via.placeholder.com/150")}
      />
      <p className="text-sm font-semibold">{book.title}</p>
      <div className="flex justify-center mt-1">
        {Array.from({
          length: difficultyStars[book.difficultyLevel?.toLowerCase()] || 0,
        }).map((_, index) => (
          <span key={index} className="text-yellow-400 text-lg">
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

export default BookCard;
