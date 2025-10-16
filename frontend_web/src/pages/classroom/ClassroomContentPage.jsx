import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";
import arrow from "../../assets/arrow.png";
import fallbackImage from "../../assets/not-available.jpeg";
import { getImageUrl as getImageUrlUtil } from "../../utils/apiConfig";
import { getAccessToken } from "../../api/api";

const ClassroomContentPage = () => {
  const { classroomId } = useParams();
  const [books, setBooks] = useState([]);
  const [classroomName, setClassroomName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const t = getAccessToken();
        const res = await fetch(`/api/classrooms/${classroomId}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setClassroomName(data.name);
        } else {
          setClassroomName("Unknown Class");
        }
      } catch {
        setClassroomName("Unknown Class");
      }
    };

    const fetchBooks = async () => {
      try {
        const t = getAccessToken();
        const response = await fetch(`/api/classrooms/${classroomId}/books`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to load books.");
        const data = await response.json();

        // Filter out archived books
        const activeBooks = data.filter((book) => !book.archived);
        setBooks(activeBooks);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not fetch classroom books.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
    fetchBooks();
  }, [classroomId]);

  const getImageUrl = (path) => getImageUrlUtil(path);

  const estimateReadTime = (pageCount) => {
    const pages = parseInt(pageCount);
    if (isNaN(pages) || pages <= 0) return "~1 min read";
    return `~${pages} min read`;
  };

  const sortedBooks = [...books].sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  const groupBooksByDifficulty = (books) => {
    return books.reduce((acc, book) => {
      const level = parseInt(book.difficultyLevel) || 0;
      if (!acc[level]) acc[level] = [];
      acc[level].push(book);
      return acc;
    }, {});
  };

  const groupedBooks = groupBooksByDifficulty(sortedBooks);

  return (
    <div className="classroom-content-page min-h-screen bg-[#f9fbfc]">
      <StudentNavbar />

      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/student-classrooms"
            title="Back to My Classrooms"
            className="hover:opacity-80 transition"
          >
            <img src={arrow} alt="Back" className="w-8 h-8" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            {classroomName}
          </h1>
        </div>

        {/* Info */}
        <p className="text-gray-600 mb-6">
          {books.length} book{books.length !== 1 && "s"} available in this classroom.
        </p>

        {/* Books */}
        {loading ? (
          <p className="text-gray-500">Loading books...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : books.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedBooks).map(([difficulty, booksAtLevel]) => (
              <div key={difficulty}>
                <h2 className="text-3xl font-extrabold text-yellow-500 mb-6">
                  {"★".repeat(difficulty)}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {booksAtLevel.map((book) => (
                    <Link
                      to={`/book/${book.bookID}`}
                      state={{ from: "CLASSROOM" }}
                      key={book.bookID}
                    >
                      <div className="relative group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition ring-1 ring-gray-200 hover:ring-blue-300">
                        {/* Genre Tag */}
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
                          {book.genre}
                        </div>

                        {/* Book Cover */}
                        <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                          <img
                            src={getImageUrl(book.imageURL)}
                            alt={book.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = fallbackImage;
                            }}
                          />
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                          <div>
                            <h2 className="text-sm font-semibold truncate mb-1" title={book.title}>
                              {book.title}
                            </h2>
                            <p className="text-xs">by {book.author}</p>
                            <p className="text-xs italic text-gray-300">{book.genre}</p>
                            <p className="text-[10px] text-gray-300 mt-1">
                              {estimateReadTime(book.pageCount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-gray-600 py-16">
            <img
              src={mascot}
              alt="No books mascot"
              className="w-48 h-auto mb-4 object-contain"
            />
            <h2 className="text-lg font-semibold">No books added yet</h2>
            <p className="text-sm text-gray-500">
              Your teacher hasn't added any content for this class.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomContentPage;
