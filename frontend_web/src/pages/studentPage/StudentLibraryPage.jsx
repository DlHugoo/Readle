import React from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";
import mockBooks from "./mockBooks";

const StudentLibraryPage = () => {
  return (
    <div>
      <StudentNavbar />
      <div className="max-w-7xl mx-auto px-10 mt-10">
        <h2 className="text-3xl font-bold mb-6">Library</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mockBooks.map((book) => (
            <BookCard key={book.bookID} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentLibraryPage;
