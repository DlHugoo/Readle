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
  const [menuOpenIndex, setMenuOpenIndex] = useState(null); // State to track which menu is open
  const [selectedBook, setSelectedBook] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States for the "Add/Edit Book" modal
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

    // Reset fields for the Add Book modal
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("");
    setBookDifficulty("");
    setBookImageURL("");
  };

  const closeAddBookModal = () => {
    setShowContentModal(false);

    // Reset fields when closing the modal
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("");
    setBookDifficulty("");
    setBookImageURL("");
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

  const handleEditClick = (book) => {
    setSelectedBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookGenre(book.genre);
    setBookDifficulty(book.difficultyLevel);
    setBookImageURL(book.imageURL);
    setShowEditModal(true);
  };

  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to delete a book.");
      return;
    }

    try {
      const response = await fetch(`/api/books/${selectedBook.bookID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Book deleted successfully!");
        setClassroomContent((prevContent) =>
          prevContent.filter((book) => book.bookID !== selectedBook.bookID)
        );
      } else {
        alert("Failed to delete book.");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("An error occurred while deleting the book.");
    } finally {
      setShowDeleteModal(false);
      setSelectedBook(null);
    }
  };

  const submitEditBook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("You must be logged in to edit a book.");
      return;
    }

    const updatedBook = {
      bookID: selectedBook.bookID,
      title: bookTitle,
      author: bookAuthor,
      genre: bookGenre,
      difficultyLevel: bookDifficulty,
      imageURL: bookImageURL,
      classroomId: parseInt(classroomId),
    };

    try {
      const response = await fetch(`/api/books/${selectedBook.bookID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedBook),
      });

      if (response.ok) {
        const updatedBookData = await response.json();
        alert("Book updated successfully!");
        setClassroomContent((prevContent) =>
          prevContent.map((book) =>
            book.bookID === updatedBookData.bookID ? updatedBookData : book
          )
        );
      } else {
        alert("Failed to update book.");
      }
    } catch (error) {
      console.error("Error updating book:", error);
      alert("An error occurred while updating the book.");
    } finally {
      setShowEditModal(false);
      setSelectedBook(null);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {classroomContent.map((book, index) => {
                // Construct the full image URL
                const backendBaseUrl = "http://localhost:8080"; // Backend URL
                const fullImageUrl = `${backendBaseUrl}${book.imageURL}`;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 relative"
                  >
                    {/* Book Cover Image */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {book.imageURL ? (
                        <img
                          src={fullImageUrl} // Use the full image URL here
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500">No Image</span>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#3B82F6] truncate">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        Difficulty:{" "}
                        <span className="ml-2 text-yellow-500 text-2xl"> {/* Larger stars */}
                          {"★".repeat(book.difficultyLevel)} {/* Render stars based on difficulty */}
                        </span>
                      </p>
                    </div>

                    {/* 3-dot Menu */}
                    <button
                      className="absolute top-2 right-2 text-gray-700 hover:text-black text-2xl"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering other events
                        setMenuOpenIndex(index === menuOpenIndex ? null : index);
                      }}
                    >
                      ⋮
                    </button>

                    {menuOpenIndex === index && (
                      <div className="absolute top-0 right-10 bg-white border rounded shadow-md z-10 w-40">
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-yellow-200 text-yellow-600 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering other events
                            handleEditClick(book);
                            setMenuOpenIndex(null); // Close the menu after clicking
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-red-200 text-red-600 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering other events
                            handleDeleteClick(book);
                            setMenuOpenIndex(null); // Close the menu after clicking
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Book Modal */}
        {showContentModal && selectedModule === "library" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4 text-[#3B82F6]">Add a New Book</h2>

              <input
                type="text"
                id="bookTitle"
                name="bookTitle"
                placeholder="Book Title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                id="bookAuthor"
                name="bookAuthor"
                placeholder="Author"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                id="bookGenre"
                name="bookGenre"
                placeholder="Genre"
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <input
                type="text"
                id="bookDifficulty"
                name="bookDifficulty"
                placeholder="Difficulty Level (1-3)"
                value={bookDifficulty}
                onChange={(e) => setBookDifficulty(e.target.value)}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              {/* File Upload for Image */}
              <input
                type="file"
                id="bookImage"
                name="bookImage"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("file", file);

                    try {
                      const response = await fetch("/api/books/upload-image", {
                        method: "POST",
                        body: formData,
                      });

                      if (response.ok) {
                        const fileUrl = await response.text();
                        setBookImageURL(fileUrl); // Set the uploaded image URL
                        alert("Image uploaded successfully!");
                      } else {
                        alert("Failed to upload image.");
                      }
                    } catch (error) {
                      console.error("Error uploading image:", error);
                      alert("An error occurred while uploading the image.");
                    }
                  }
                }}
                className="w-full mb-3 p-3 border border-gray-300 rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeAddBookModal}
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

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Book</h2>

              <input
                type="text"
                placeholder="Book Title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <input
                type="text"
                placeholder="Author"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <input
                type="text"
                placeholder="Genre"
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <input
                type="text"
                placeholder="Difficulty Level"
                value={bookDifficulty}
                onChange={(e) => setBookDifficulty(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEditBook}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center">
              <h2 className="text-lg font-bold mb-4 text-red-600">Are you sure you want to delete this book?</h2>
              <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded bg-red-100 hover:bg-red-300 text-red-700"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={confirmDeleteBook}
                  className="px-4 py-2 rounded bg-green-100 hover:bg-green-300 text-green-700"
                >
                  ✅ Confirm
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