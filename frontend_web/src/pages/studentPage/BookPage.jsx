import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import axios from "axios";

const getImageURL = (url) => {
  if (url?.startsWith("/uploads")) {
    return `http://localhost:8080${url}`;
  }
  return url;
};

const BookPage = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [firstPage, setFirstPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookAndPage = async () => {
      try {
        const bookRes = await axios.get(`/api/books/${bookId}`);
        const pagesRes = await axios.get(`/api/pages/${bookId}`);
        const pages = pagesRes.data;

        if (bookRes.data) setBook(bookRes.data);
        if (pages.length > 0) {
          const sortedPages = pages.sort((a, b) => a.pageNumber - b.pageNumber);
          setFirstPage(sortedPages[0]);
        }
      } catch (err) {
        console.error("Error loading book:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookAndPage();
  }, [bookId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <StudentNavbar />
        <p className="text-center mt-20 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar />
      <div className="max-w-4xl mx-auto px-6 py-5">
        {/* Book Title */}
        <h1 className="text-3xl font-bold text-story-title mb-6 text-center">
          {book?.title}
        </h1>

        {/* Page Image */}
        {firstPage?.imageURL && (
          <div className=" flex justify-center">
            <img
              src={getImageURL(firstPage.imageURL)}
              alt="Book Page"
              className="rounded-lg  max-h-[400px] object-contain"
            />
          </div>
        )}

        {/* Page Content */}
        <div
          className="p-6 rounded-lg text-gray-800 text-lg leading-relaxed"
          style={{ textAlign: "justify" }}
        >
          {firstPage?.content || "No content available."}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
