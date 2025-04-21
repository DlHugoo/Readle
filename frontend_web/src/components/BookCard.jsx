const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const BookCard = ({ book }) => {
  const filledStars = book.difficultyLevel || 0;

  return (
    <div className="book-card relative flex flex-col cursor-pointer transition-transform duration-300 hover:scale-110 mx-2">
      <div className="book-cover overflow-hidden rounded-lg shadow-md">
        <img
          src={getImageURL(book.imageURL)}
          alt={book.title}
          className="w-full h-auto object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150";
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
