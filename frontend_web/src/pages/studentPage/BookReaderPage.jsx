import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BookReaderPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFullImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("/uploads") ? `http://localhost:8080${url}` : url;
  };

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/pages/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch book pages");

        const data = await response.json();
        setPages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [bookId]);

  const goToNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  if (loading) return <p className="p-8">Loading book...</p>;
  if (error) return <p className="p-8 text-red-500">Error: {error}</p>;

  const currentPage = pages[currentPageIndex];

  return (
    <div className="book-reader-page min-h-screen">
      <StudentNavbar />
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Read Book</h1>

        {currentPage?.imageURL && (
          <img
            src={getFullImageUrl(currentPage.imageURL)}
            alt="Page"
            className="mx-auto mb-4 rounded shadow max-h-96"
          />
        )}

        <p className="text-lg text-gray-700 mb-6">{currentPage?.content}</p>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={goToPrev}
            disabled={currentPageIndex === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >
            <ChevronLeft className="inline mr-1" /> Previous
          </button>

          <span className="text-gray-600">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentPageIndex === pages.length - 1}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >
            Next <ChevronRight className="inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookReaderPage;
