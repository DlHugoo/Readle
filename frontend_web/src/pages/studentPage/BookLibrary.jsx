import React from "react";
import mockBooks from "./mockBooks";

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const BookLibrary = () => {
  return (
    <div className="px-10 mt-10">
      <h2 className="text-3xl font-bold mb-6">Library</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {mockBooks.map((book) => (
          <div
            key={book.bookID}
            className="flex flex-col items-center text-center"
          >
            <img
              src={book.imageURL}
              alt={book.title}
              className="h-48 w-36 object-cover rounded-lg shadow-md mb-2"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/150")
              }
            />
            <p className="text-sm font-semibold">{book.title}</p>
            <div className="flex justify-center mt-1">
              {Array.from({
                length:
                  difficultyStars[book.difficultyLevel?.toLowerCase()] || 0,
              }).map((_, index) => (
                <span key={index} className="text-yellow-400 text-lg">
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookLibrary;
