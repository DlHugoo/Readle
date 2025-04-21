const getImageURL = (url) => {
  // Prefix only if it's a relative path
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const BookCard = ({ book }) => {
  return (
    <div className="flex flex-col items-center text-center p-2 rounded-xl shadow-md bg-white hover:shadow-lg transition">
      <img
        src={getImageURL(book.imageURL)}
        alt={book.title}
        className="h-48 w-36 object-cover rounded-md mb-2"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/150";
        }}
      />
      <p className="text-sm font-semibold text-black">{book.title}</p>
      <div className="flex justify-center mt-1">
        {Array.from({ length: book.difficultyLevel || 0 }).map((_, index) => (
          <span key={index} className="text-yellow-400 text-lg">
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

export default BookCard;
