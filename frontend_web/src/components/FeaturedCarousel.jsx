import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const NextArrow = ({ onClick }) => (
  <div
    className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition"
    onClick={onClick}
  >
    <div className="bg-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center text-blue-500 hover:scale-110">
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
        className="w-6 h-6"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 cursor-pointer opacity-0 group-hover:opacity-100 transition"
    onClick={onClick}
  >
    <div className="bg-white rounded-full shadow-xl w-12 h-12 flex items-center justify-center text-blue-500 hover:scale-110">
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
        className="w-6 h-6"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </div>
  </div>
);

const FeaturedCarousel = ({ books }) => {
  const settings = {
    infinite: true,
    centerMode: true,
    centerPadding: "20%", // 👈 Bigger preview of side banners
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    speed: 800,
    cssEase: "ease-in-out",
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    pauseOnHover: false,
  };

  return (
    <div className="w-full relative py-6 group">
      <Slider {...settings}>
        {books.map((book, index) => (
          <div key={`${book.id}-${index}`} className="px-2">
            <div className="mx-auto w-full max-w-6xl">
              <img
                src={getImageURL(book.imageURL)}
                alt="Banner"
                className="w-full h-[280px] md:h-[300px] object-cover rounded-xl shadow-md"
                onError={(e) =>
                  (e.target.src = "https://via.placeholder.com/943x330")
                }
              />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default FeaturedCarousel;
