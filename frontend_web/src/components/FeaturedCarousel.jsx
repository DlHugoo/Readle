import React, { useRef, useEffect } from "react";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const FeaturedCarousel = ({ books }) => {
  const carouselRef = useRef(null);
  const loopedBooks = [...books, ...books, ...books];

  const scrollToMiddle = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft =
        carouselRef.current.clientWidth * books.length;
    }
  };

  const handleScroll = () => {
    const carousel = carouselRef.current;
    const scrollLeft = carousel.scrollLeft;
    const scrollWidth = carousel.scrollWidth;
    const containerWidth = carousel.clientWidth;
    const totalBookWidth = containerWidth * books.length;

    if (scrollLeft >= scrollWidth - containerWidth) {
      carousel.scrollLeft = totalBookWidth;
    }
    if (scrollLeft <= 0) {
      carousel.scrollLeft = totalBookWidth;
    }
  };

  const scroll = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount =
      direction === "left"
        ? -carouselRef.current.clientWidth
        : carouselRef.current.clientWidth;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToMiddle();
  }, [books]);

  return (
    <div className="w-full bg-gray-50 relative group">
      {/* Left Arrow - appears on hover */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center text-blue-500 hover:scale-110 transition opacity-0 group-hover:opacity-100"
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
          className="w-6 h-6"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Carousel Content */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide py-2 space-x-4 w-full snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loopedBooks.map((book, index) => (
          <div
            key={`${book.bookID}-${index}`}
            className="flex-shrink-0 snap-center min-w-full md:min-w-[33%] px-4 relative"
          >
            <img
              src={getImageURL(book.imageURL)}
              alt={book.title}
              className="w-full h-64 object-cover rounded-lg shadow-md"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/640x320")
              }
            />
          </div>
        ))}
      </div>

      {/* Right Arrow - appears on hover */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center text-blue-500 hover:scale-110 transition opacity-0 group-hover:opacity-100"
      >
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
          className="w-6 h-6"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default FeaturedCarousel;
