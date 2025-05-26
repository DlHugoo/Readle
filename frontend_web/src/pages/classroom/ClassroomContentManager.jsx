import React, { useState, useEffect } from "react";
import { useParams, useNavigate  } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { BookOpen, PlusCircle, Menu, Upload, AlertCircle, CheckCircle, Copy, Check } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from 'axios'; // Import axios

const ClassroomContentManager = () => {
  const { classroomId } = useParams(); // Retrieve classroomId from the route
  const navigate = useNavigate(); 
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [classroomContent, setClassroomContent] = useState([]); // State to hold classroom-specific content
  const [classroomName, setClassroomName] = useState(""); // State to hold classroom name
  const [classroomCode, setClassroomCode] = useState(""); // State to hold classroom code
  const [menuOpenIndex, setMenuOpenIndex] = useState(null); // State to track which menu is open
  const [selectedBook, setSelectedBook] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, type: "", message: "" }); // State for alert modal
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar
  const [codeCopied, setCodeCopied] = useState(false); // State to track if code was copied

  // States for the "Add/Edit Book" modal
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookGenre, setBookGenre] = useState("");
  const [bookDifficulty, setBookDifficulty] = useState("");
  const [bookImageURL, setBookImageURL] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Add these constants for file validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        const response = await axios.get(`/api/classrooms/${classroomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Classroom details fetched successfully:", response.data);
        console.log("Books in classroom:", response.data.books);
        if (response.data.books && response.data.books.length > 0) {
          console.log("First book structure:", response.data.books[0]);
        }
        setClassroomName(response.data.name || "Unknown Classroom");
        setClassroomCode(response.data.classroomCode || ""); // Set classroom code
        setClassroomContent(response.data.books || []); // Fetch books associated with the classroom
      } catch (error) {
        console.error("Failed to fetch classroom details. Status:", error.response?.status, "Error:", error.message);
      }
    };

    fetchClassroomDetails();
  }, [classroomId]);

  // Function to copy classroom code to clipboard
  const copyClassroomCode = () => {
    navigator.clipboard.writeText(classroomCode)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  const handleSelectModule = (module) => {
    setSelectedModule(module);
    setShowContentModal(true);

    // Reset fields for the Add Book modal
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("");
    setBookDifficulty("");
    setBookImageURL("");
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const closeAddBookModal = () => {
    setShowContentModal(false);

    // Reset fields when closing the modal
    setBookTitle("");
    setBookAuthor("");
    setBookGenre("");
    setBookDifficulty("");
    setBookImageURL("");
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const showAlertModal = (type, message) => {
    setAlertModal({ show: true, type, message });
  };

  const closeAlertModal = () => {
    setAlertModal({ show: false, type: "", message: "" });
  };

  // Function to handle image file selection
  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showAlertModal("error", `File "${file.name}" exceeds the maximum size of 5MB.`);
        e.target.value = ""; // Reset the file input
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showAlertModal("error", `File "${file.name}" is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`);
        e.target.value = ""; // Reset the file input
        return;
      }

      // Store the file for later upload
      setSelectedImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to upload the image and return the URL
  const uploadImage = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token"); // Ensure token is retrieved

  try {
    const response = await axios.post("/api/books/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // Include token in headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

  const handleAddBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlertModal("error", "You must be logged in to add a book.");
      return;
    }

    try {
      // First upload the image if one is selected
      let imageURL = null;
      if (selectedImageFile) {
        try {
          imageURL = await uploadImage(selectedImageFile);
          showAlertModal("success", "Image uploaded successfully!");
        } catch (error) {
          showAlertModal("error", `Failed to upload image: ${error.message}`);
          return;
        }
      }

      const newBook = {
        title: bookTitle,
        author: bookAuthor,
        genre: bookGenre,
        difficultyLevel: bookDifficulty,
        imageURL: imageURL,
        classroomId: parseInt(classroomId),
      };

      const response = await axios.post("/api/books", newBook, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      showAlertModal("success", "Book added successfully!");
      setClassroomContent((prevContent) => [...prevContent, response.data]);
      closeAddBookModal();
    } catch (error) {
      console.error("Error adding book:", error);
      showAlertModal("error", `Failed to add book: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleBookClick = (bookId) => {
    console.log("Navigating to book with ID:", bookId);
    navigate(`/book-editor/${bookId}`);
  };
  

  const handleEditClick = (book) => {
    setSelectedBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookGenre(book.genre);
    setBookDifficulty(book.difficultyLevel);
    setBookImageURL(book.imageURL);
    setImagePreview(book.imageURL ? `http://localhost:8080${book.imageURL}` : null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlertModal("error", "You must be logged in to delete a book.");
      return;
    }

    try {
      // First attempt to delete the book
      await axios.delete(`/api/books/${selectedBook.bookID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showAlertModal("success", "Book deleted successfully!");
      setClassroomContent((prevContent) =>
        prevContent.filter((book) => book.bookID !== selectedBook.bookID)
      );
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting book:", error);
      
      // Show a more specific error message
      if (error.response && error.response.status === 500) {
        showAlertModal("error", "Cannot delete this book because it has associated content (pages or questions). Please remove the content first.");
      } else {
        showAlertModal("error", `Failed to delete book: ${error.response?.data?.message || "An unknown error occurred"}`);
      }
    }
  };

  const submitEditBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlertModal("error", "You must be logged in to edit a book.");
      return;
    }

    try {
      // Upload new image if selected
      let imageURL = bookImageURL;
      if (selectedImageFile) {
        try {
          imageURL = await uploadImage(selectedImageFile);
          showAlertModal("success", "Image uploaded successfully!");
        } catch (error) {
          showAlertModal("error", `Failed to upload image: ${error.message}`);
          return;
        }
      }

      const updatedBook = {
        bookID: selectedBook.bookID,
        title: bookTitle,
        author: bookAuthor,
        genre: bookGenre,
        difficultyLevel: bookDifficulty,
        imageURL: imageURL,
        classroomId: parseInt(classroomId),
      };

      const response = await axios.put(`/api/books/${selectedBook.bookID}`, updatedBook, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      showAlertModal("success", "Book updated successfully!");
      setClassroomContent((prevContent) =>
        prevContent.map((book) =>
          book.bookID === response.data.bookID ? response.data : book
        )
      );
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating book:", error);
      showAlertModal("error", "An error occurred while updating the book.");
    }
  };

  return (
    <div className="w-full min-h-screen flex">
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-16 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Navigation Bar - Full Width */}
        <div className="w-full">
          <TeahcerNav />
        </div>
        
        <div className="p-4 max-w-7xl mx-auto w-full">
          {/* Sidebar Toggle Button */}
          <button 
            onClick={toggleSidebar}
            className="mb-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          
          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">
            📚 Classroom Content Management
          </h1>

          {/* Enhanced Classroom Information Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-md mb-5 border border-blue-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#3B82F6] mb-1">
                  {classroomName}
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                  Classroom ID: <span className="font-mono">{classroomId}</span>
                </p>
              </div>
              
              {/* Classroom Code Display */}
              <div className="mt-2 md:mt-0 bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                <p className="text-sm font-medium text-gray-600 mb-1">Classroom Code:</p>
                <div className="flex items-center">
                  <span className="font-mono text-xl font-bold text-indigo-600 mr-2">{classroomCode}</span>
                  <button 
                    onClick={copyClassroomCode}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    title="Copy classroom code"
                  >
                    {codeCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Share this code with students to join the classroom</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => handleSelectModule("library")}
              className="bg-white border border-[#FACC14] hover:bg-[#FACC14] hover:text-white text-[#FACC14] font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={24} />
                <span>Digital Library & Book Selection</span>
              </div>
              <PlusCircle size={20} />
            </button>
          </div>

          {/* Display Classroom Content */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
              <BookOpen size={20} className="mr-2 text-blue-500" />
              <span>Classroom Content</span>
            </h2>
            {classroomContent.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-3">No content added yet for this classroom.</p>
                <button
                  onClick={() => handleSelectModule("library")}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Add Your First Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {classroomContent.map((book, index) => {
                  // Construct the full image URL
                  const backendBaseUrl = "http://localhost:8080"; // Backend URL
                  const fullImageUrl = `${backendBaseUrl}${book.imageURL}`;

                  return (
                    <div
                      key={book.bookID}
                      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 relative"
                      onClick={() => handleBookClick(book.bookID)}
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
                      <div className="p-3">
                        <h3 className="text-lg font-bold text-[#3B82F6] truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          Difficulty:{" "}
                          <span className="ml-2 text-yellow-500 text-2xl">
                            {"★".repeat(book.difficultyLevel)}
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

                <select
                  id="bookGenre"
                  name="bookGenre"
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                  className="w-full mb-3 p-3 border border-gray-300 rounded text-gray-700"
                  required
                >
                  <option value="">Select a genre</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Nonfiction">Nonfiction</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Fable">Fable</option>
                </select>

                <input
                  type="text"
                  id="bookDifficulty"
                  name="bookDifficulty"
                  placeholder="Difficulty Level (1-3)"
                  value={bookDifficulty}
                  onChange={(e) => setBookDifficulty(e.target.value)}
                  className="w-full mb-3 p-3 border border-gray-300 rounded"
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Book Cover Preview:</p>
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Book Cover Preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Redesigned File Upload Button */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Book Cover Image</p>
                  <p className="text-xs text-gray-500 mb-2">
                    Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                  </p>
                  <label 
                    htmlFor="bookImage" 
                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-blue-500" />
                    <span className="text-blue-600 font-medium">Choose Image File</span>
                  </label>
                  <input
                    type="file"
                    id="bookImage"
                    name="bookImage"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden" // Hide the actual input
                  />
                </div>

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

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Book Cover:</p>
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Book Cover Preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Redesigned File Upload Button */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Change Book Cover</p>
                  <p className="text-xs text-gray-500 mb-2">
                    Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                  </p>
                  <label 
                    htmlFor="editBookImage" 
                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-blue-500" />
                    <span className="text-blue-600 font-medium">Choose New Image</span>
                  </label>
                  <input
                    type="file"
                    id="editBookImage"
                    name="editBookImage"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden" // Hide the actual input
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitEditBook}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">
                  Are you sure you want to delete the book "{selectedBook?.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteBook}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Modal */}
          {alertModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex items-center mb-4">
                  {alertModal.type === "success" ? (
                    <CheckCircle className="text-green-500 mr-3" size={24} />
                  ) : (
                    <AlertCircle className="text-red-500 mr-3" size={24} />
                  )}
                  <h3 className="text-lg font-medium">
                    {alertModal.type === "success" ? "Success" : "Error"}
                  </h3>
                </div>
                <p className="mb-6">{alertModal.message}</p>
                <div className="flex justify-end">
                  <button
                    onClick={closeAlertModal}
                    className={`px-4 py-2 rounded text-white ${
                      alertModal.type === "success" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomContentManager;
