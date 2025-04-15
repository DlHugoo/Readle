import React from "react";
import StudentNavbar from "../../components/StudentNavbar";
import BookCard from "../../components/BookCard";

const StudentHomePage = () => {
  return (
    <div>
      <StudentNavbar />
      <div className="max-w-7xl mx-auto">
        <BookLibrary />
      </div>
    </div>
  );
};

export default StudentHomePage;
