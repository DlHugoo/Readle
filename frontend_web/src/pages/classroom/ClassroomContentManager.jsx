import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { BookOpen, PlusCircle } from "lucide-react";

const ClassroomContentManager = () => {
  const { classroomId } = useParams(); // Retrieve classroomId from the route
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [classroomContent, setClassroomContent] = useState([]); // State to hold classroom-specific content
  const [classroomName, setClassroomName] = useState(""); // State to hold classroom name

  // States for the "Add Book" modal
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookGenre, setBookGenre] = useState("");
  const [bookDifficulty, setBookDifficulty] = useState("");
  const [bookImageURL, setBookImageURL] = useState("");

  // Fetch classroom-specific content and details
  useEffect(() => {
    const fetchClassroomDetails = async () => {
      const token = localStorage.getItem('token');
      console.log("Fetching details for classroomId:", classroomId);
      console.log("Token:", token);

      if (!token) {
        console.error("No token found. Please log in.");
        return;
      }

      try {
        const response = await fetch(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Classroom details fetched successfully:", data);
          setClassroomName(data.name || "Unknown Classroom");
          setClassroomContent(data.books || []); // Fetch books associated with the classroom
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch classroom details. Status:", response.status, "Error:", errorText);
        }
      } catch (error) {
        console.error("Error fetching classroom details:", error);
      }
    };

    fetchClassroomDetails();
  }, [classroomId]);

  const handleSelectModule = (module) => {
    setSelectedModule(module);
    setShowContentModal(true);
  };

  const handleAddBook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to add a book.");
      return;
    }

    const newBook = {
      title: bookTitle,
      author: bookAuthor,
      genre: bookGenre,
      difficultyLevel: bookDifficulty,
      imageURL: bookImageURL,
      classroomId: parseInt(classroomId), // Associate the book with the current classroom
    };

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBook),
      });

      if (response.ok) {
        const createdBook = await response.json();
        alert("Book added successfully!");
        setClassroomContent((prevContent) => [...prevContent, createdBook]); // Update the classroom content
        setShowContentModal(false); // Close the modal
        setBookTitle("");
        setBookAuthor("");
        setBookGenre("");
        setBookDifficulty("");
        setBookImageURL("");
      } else {
        const errorData = await response.json();
        alert("Failed to add book: " + errorData.message);
      }
    } catch (error) {
      console.error("Error adding book:", error);
      alert("An error occurred while adding the book.");
    }
  };

  return (
    <div className="w-full">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-gray-700 mb-4">
          📚 Classroom Content Management
        </h1>

        {/* Classroom Name and ID */}
        <div className="bg-[#F3F4F6] p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-3xl font-extrabold text-[#3B82F6] mb-2">
            {classroomName}
          </h2>
          <p className="text-sm text-gray-500">
            Classroom ID: <span className="font-mono">{classroomId}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => handleSelectModule("library")}
            className="bg-white border border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white text-[#3B82F6] font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={28} />
              <span>Digital Library & Book Selection</span>
            </div>
            <PlusCircle size={22} />
          </button>
          <button
            onClick={() => handleSelectModule("challenges")}
            className="bg-white border border-[#FACC14] hover:bg-[#FACC14] hover:text-white text-[#FACC14] font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🧠</span>
              <span>Comprehension Challenges</span>
            </div>
            <PlusCircle size={22} />
          </button>
        </div>

        {/* Display Classroom Content */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Classroom Content</h2>
          {classroomContent.length === 0 ? (
            <p className="text-gray-500">No content added yet for this classroom.</p>
          ) : (
            <ul className="list-disc ml-6 text-gray-600">
              {classroomContent.map((content, index) => (
                <li key={index} className="mb-2">
                  {content.title} - {content.difficultyLevel}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Book Modal */}
        {showContentModal && selectedModule === "library" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4 text-[#3B82F6]">Add a New Book</h2>

              <input
                type="text"
                placeholder="Book Title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                placeholder="Author"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                placeholder="Genre"
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                placeholder="Difficulty Level"
                value={bookDifficulty}
                onChange={(e) => setBookDifficulty(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                placeholder="Image URL"
                value={bookImageURL}
                onChange={(e) => setBookImageURL(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowContentModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBook}
                  className="bg-[#FACC14] text-white px-4 py-2 rounded hover:bg-yellow-400"
                >
                  Add Book
                </button>
              </div>
            </div>
          </div>
        )}
         {/* Future Feature Section */}
         <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📈 Coming Soon</h2>
          <ul className="list-disc ml-6 text-gray-600">
            <li>Story Sequencing Activities</li>
            <li>Prediction-Based Quizzes</li>
            <li>Snake Game for Vocabulary Practice</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClassroomContentManager;