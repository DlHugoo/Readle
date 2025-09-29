import React, { useState, useEffect } from "react";
import { useParams, useNavigate  } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import { BookOpen, PlusCircle, Menu, Upload, AlertCircle, CheckCircle, Copy, Check, Sparkles, Star, Heart, Zap, GraduationCap, Users, Edit, Trash2, Archive, MoreVertical, X } from "lucide-react";
import ClassroomSidebar from "../../components/ClassroomSidebar";
import axios from 'axios'; // Import axios
import { getImageUrl } from "../../utils/apiConfig";

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
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, type: "", message: "" }); // State for alert modal
  const [sidebarOpen, setSidebarOpen] = useState(true); // State for sidebar (always open by default)
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

  // Normalize archived state (handles boolean, number, or string representations)
  const isArchived = (book) => {
    const v = book?.archived;
    return v === true || v === 1 || v === '1';
  };

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
        // Fetch only active (non-archived) books using the dedicated endpoint
        await fetchActiveBooks();
      } catch (error) {
        console.error("Failed to fetch classroom details. Status:", error.response?.status, "Error:", error.message);
      }
    };

    fetchClassroomDetails();
  }, [classroomId]);

  // Fetch only active (non-archived) books for the classroom
  const fetchActiveBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/classrooms/${classroomId}/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const books = Array.isArray(res.data) ? res.data : [];
      setClassroomContent(books.filter((b) => !isArchived(b)));
    } catch (e) {
      console.error('Failed to load active books for classroom:', e);
    }
  };

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

  const token = localStorage.getItem("token");

  try {
    console.log("=== FRONTEND UPLOAD DEBUG START ===");
    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result.split(',')[1]; // Remove data: prefix
        console.log("Base64 data length:", result.length);
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const requestData = {
      file: base64Data,
      filename: file.name,
      contentType: file.type,
      uploadType: "bookcontent"
    };

    console.log("Request data:", {
      filename: requestData.filename,
      contentType: requestData.contentType,
      uploadType: requestData.uploadType,
      base64Length: requestData.file.length
    });

    // Send as JSON instead of FormData
    console.log("Sending request to /api/books/upload-image");
    const response = await fetch("/api/books/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData)
    });
    
    console.log("Response received:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    // The backend now returns file URL (like your old SkillMatch app)
    const fileUrl = await response.text();
    
    console.log("File URL received:", fileUrl);
    console.log("=== FRONTEND UPLOAD DEBUG END ===");
    
    return fileUrl;
  } catch (error) {
    console.error("=== FRONTEND UPLOAD ERROR ===");
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    console.error("Full error:", error);
    console.error("=== FRONTEND UPLOAD ERROR END ===");
    throw error;
  }
};

  const handleAddBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlertModal("error", "You must be logged in to add a book.");
      return;
    }

    // Validate required fields
    if (!bookTitle.trim()) {
      showAlertModal("error", "Book title is required.");
      return;
    }
    
    if (!bookAuthor.trim()) {
      showAlertModal("error", "Author name is required.");
      return;
    }
    
    if (!bookGenre.trim()) {
      showAlertModal("error", "Genre is required.");
      return;
    }
    
    if (!bookDifficulty.trim()) {
      showAlertModal("error", "Difficulty level is required.");
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
      setClassroomContent((prevContent) => (
        isArchived(response.data) ? prevContent : [...prevContent, response.data]
      ));
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
    setImagePreview(book.imageURL ? getImageUrl(book.imageURL) : null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    // Determine if deletable; if not, offer archive
    checkIfBookCanBeDeleted(book.bookID);
  };

  const checkIfBookCanBeDeleted = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/books/${bookId}/can-delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data === true) {
        setShowDeleteModal(true);
      } else {
        setShowArchiveModal(true);
      }
    } catch (e) {
      // Default to archive option if unsure
      setShowArchiveModal(true);
    }
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
        showAlertModal("error", `Failed to delete book: ${error.response?.data?.message || "This book has existing progress linked to it. To maintain data integrity, deletion is disabled."}`);
      }
    }
  };

  const confirmArchiveBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showAlertModal("error", "You must be logged in to archive a book.");
      return;
    }
    try {
      await axios.put(`/api/books/${selectedBook.bookID}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlertModal("success", "Book archived successfully!");
      // Refresh active books to ensure archived items are excluded
      await fetchActiveBooks();
      setShowArchiveModal(false);
    } catch (error) {
      console.error("Error archiving book:", error);
      showAlertModal("error", "Failed to archive book.");
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
      setClassroomContent((prevContent) => {
        const updated = prevContent.map((book) =>
          book.bookID === response.data.bookID ? response.data : book
        );
        return updated.filter((b) => !isArchived(b));
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating book:", error);
      showAlertModal("error", "An error occurred while updating the book.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-20 transition-all duration-150 ease-out ${sidebarOpen ? 'pl-72' : 'pl-0'}`}>
        {/* Navigation Bar - Full Width */}
        <div className="w-full fixed top-0 left-0 right-0 z-40">
          <TeahcerNav />
        </div>
        
        {/* Simplified decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/10 rounded-full blur-lg"></div>
        </div>
        
        <div className="px-4 sm:px-8 lg:px-12 py-4 max-w-8xl mx-auto w-full relative z-10">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {/* Sidebar Toggle Button */}
              <button 
                onClick={toggleSidebar}
                className="group p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-150 ease-out"
              >
                <Menu size={20} className="text-blue-600 group-hover:text-blue-700" />
              </button>
              
              {/* Simplified decorative elements */}
              <div className="hidden md:flex items-center space-x-2">
                <Sparkles className="text-yellow-500" size={20} />
                <Star className="text-purple-500" size={16} />
              </div>
            </div>
            
            {/* Professional Header */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Content Management</h1>
                    <p className="text-gray-600 text-lg">Curate and manage your classroom's digital library</p>
                  </div>
                  <div className="hidden lg:flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{classroomContent.length}</div>
                      <div className="text-sm text-gray-500">Active Books</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{classroomName}</div>
                      <div className="text-sm text-gray-500">Classroom</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Classroom Information Card */}
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-8 border border-white/50 relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    {classroomName}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">Classroom ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{classroomId}</span>
                  </p>
                </div>
              </div>
              
              {/* Enhanced Classroom Code Display */}
              <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-xl shadow-lg border border-blue-200/50 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 flex items-center">
                    <Sparkles size={16} className="mr-2 text-yellow-500" />
                    Classroom Code
                  </p>
                  <Heart size={16} className="text-red-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {classroomCode}
                  </span>
                  <button 
                    onClick={copyClassroomCode}
                    className="group p-2 rounded-lg hover:bg-blue-100 transition-all duration-300 hover:scale-110"
                    title="Copy classroom code"
                  >
                    {codeCopied ? 
                      <Check size={20} className="text-green-500" /> : 
                      <Copy size={20} className="text-gray-500 group-hover:text-blue-600" />
                    }
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <Zap size={12} className="mr-1 text-yellow-500" />
                  Share this code with students to join
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => handleSelectModule("library")}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-200 ease-out hover:shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-bold">Digital Library</span>
                    <span className="block text-sm opacity-90">Add & manage books</span>
                  </div>
                </div>
                <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
            </button>

            <button
              onClick={() => navigate(`/classroom-archived/${classroomId}`)}
              className="group bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-200 ease-out hover:shadow-2xl relative overflow-hidden border border-gray-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 to-gray-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <Archive size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg font-bold">Archived Books</span>
                    <span className="block text-sm text-gray-600">View archived content</span>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 group-hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <Star size={16} className="text-gray-600 group-hover:text-gray-700" />
                </div>
              </div>
            </button>
          </div>

          {/* Enhanced Content Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h2 className="text-3xl font-bold text-gray-800">Library Collection</h2>
                <Sparkles size={24} className="text-yellow-500" />
              </div>
              <div className="hidden md:flex items-center space-x-2 text-gray-500">
                <Heart size={16} className="text-red-400" />
                <span className="text-sm">{classroomContent.length} books</span>
              </div>
            </div>
            
            {classroomContent.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <BookOpen size={48} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Start Your Digital Library</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    No books added yet. Create an engaging learning experience by adding your first book to the classroom library.
                  </p>
                  <button
                    onClick={() => handleSelectModule("library")}
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <PlusCircle size={20} className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-semibold">Add Your First Book</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {classroomContent.map((book, index) => {
                  // Use getImageUrl for proper image URL handling
                  const fullImageUrl = book.imageURL ? getImageUrl(book.imageURL) : null;

                  return (
                    <div
                      key={book.bookID}
                      className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ease-out relative border border-white/50 hover:shadow-2xl cursor-pointer"
                      onClick={() => handleBookClick(book.bookID)}
                    >
                      {/* Simplified decorative elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                      {/* Book Cover Image */}
                      <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                        {book.imageURL ? (
                          <img
                            src={fullImageUrl}
                            alt={book.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <BookOpen size={48} className="mb-2" />
                            <span className="text-sm">No Image</span>
                          </div>
                        )}
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      </div>

                      {/* Enhanced Book Details */}
                      <div className="p-4 relative">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate mb-2 group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-200 ease-out">
                          {book.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-600 font-medium">Difficulty:</span>
                            <div className="flex items-center">
                              {[...Array(3)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={`${
                                    i < book.difficultyLevel
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  } transition-colors duration-200 ease-out`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {book.genre}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced 3-dot Menu */}
                      <button
                        className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200 ease-out shadow-lg hover:shadow-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenIndex(index === menuOpenIndex ? null : index);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuOpenIndex === index && (
                        <div className="absolute top-12 right-3 bg-white/95 backdrop-blur-sm border border-white/50 rounded-xl shadow-2xl z-20 w-44 overflow-hidden transition-all duration-150 ease-out">
                          <button
                            className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 text-yellow-600 font-medium transition-all duration-150 ease-out group/item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(book);
                              setMenuOpenIndex(null);
                            }}
                          >
                            <Edit size={16} className="mr-3 group-hover/item:scale-105 transition-transform duration-150 ease-out" />
                            Edit Book
                          </button>
                          <button
                            className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-red-600 font-medium transition-all duration-150 ease-out group/item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(book);
                              setMenuOpenIndex(null);
                            }}
                          >
                            <Trash2 size={16} className="mr-3 group-hover/item:scale-105 transition-transform duration-150 ease-out" />
                            Delete Book
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Add Book Modal */}
          {showContentModal && selectedModule === "library" && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-24">
              <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                
                {/* Close button */}
                <button
                  onClick={closeAddBookModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <X size={20} className="text-gray-600" />
                </button>
                
                <div className="relative z-10">
                  {/* Enhanced Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Book</h2>
                    <p className="text-gray-600">Expand your classroom library with engaging content</p>
                  </div>

                  {/* Enhanced Form Fields */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Book Title</label>
                      <input
                        type="text"
                        id="bookTitle"
                        name="bookTitle"
                        placeholder="Enter book title"
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                      <input
                        type="text"
                        id="bookAuthor"
                        name="bookAuthor"
                        placeholder="Enter author name"
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Genre</label>
                      <select
                        id="bookGenre"
                        name="bookGenre"
                        value={bookGenre}
                        onChange={(e) => setBookGenre(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-gray-700"
                        required
                      >
                        <option value="">Select a genre</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Nonfiction">Nonfiction</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Fantasy">Fantasy</option>
                        <option value="Fable">Fable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                      <input
                        type="text"
                        id="bookDifficulty"
                        name="bookDifficulty"
                        placeholder="1-3 (1=Easy, 2=Medium, 3=Hard)"
                        value={bookDifficulty}
                        onChange={(e) => setBookDifficulty(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Enhanced Image Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Book Cover Preview</label>
                      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-gray-200 shadow-inner">
                        <img 
                          src={imagePreview} 
                          alt="Book Cover Preview" 
                          className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Enhanced File Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Book Cover Image</label>
                    <p className="text-xs text-gray-500 mb-3 flex items-center">
                      <Sparkles size={12} className="mr-1 text-yellow-500" />
                      Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                    </p>
                    <label 
                      htmlFor="bookImage" 
                      className="group flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 cursor-pointer transition-all duration-300 hover:border-blue-400"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload size={20} className="text-white" />
                      </div>
                      <div className="text-center">
                        <span className="block text-blue-600 font-bold">Choose Image File</span>
                        <span className="block text-gray-500 text-sm">or drag and drop here</span>
                      </div>
                    </label>
                    <input
                      type="file"
                      id="bookImage"
                      name="bookImage"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={closeAddBookModal}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBook}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Add Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Edit Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-24">
              <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-y-auto border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
                
                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-20"
                >
                  <X size={16} className="text-gray-600" />
                </button>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit Book</h2>
                    <p className="text-gray-600">Update book information and details</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Book Title</label>
                      <input
                        type="text"
                        placeholder="Enter book title"
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                      <input
                        type="text"
                        placeholder="Enter author name"
                        value={bookAuthor}
                        onChange={(e) => setBookAuthor(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Genre</label>
                      <input
                        type="text"
                        placeholder="Enter genre"
                        value={bookGenre}
                        onChange={(e) => setBookGenre(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                      <input
                        type="text"
                        placeholder="1-5 (1=Easy, 5=Hard)"
                        value={bookDifficulty}
                        onChange={(e) => setBookDifficulty(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Enhanced Image Preview */}
                  {imagePreview && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Current Book Cover</label>
                      <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-gray-200 shadow-inner">
                        <img 
                          src={imagePreview} 
                          alt="Book Cover Preview" 
                          className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* Enhanced File Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Change Book Cover</label>
                    <p className="text-xs text-gray-500 mb-3 flex items-center">
                      <Sparkles size={12} className="mr-1 text-yellow-500" />
                      Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                    </p>
                    <label 
                      htmlFor="editBookImage" 
                      className="group flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-yellow-300 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 cursor-pointer transition-all duration-300 hover:border-yellow-400"
                    >
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload size={20} className="text-white" />
                      </div>
                      <div className="text-center">
                        <span className="block text-yellow-600 font-bold">Choose New Image</span>
                        <span className="block text-gray-500 text-sm">or drag and drop here</span>
                      </div>
                    </label>
                    <input
                      type="file"
                      id="editBookImage"
                      name="editBookImage"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitEditBook}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-24">
              <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <Trash2 size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Deletion</h2>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-gray-700 mb-2">
                        Are you sure you want to delete the book:
                      </p>
                      <p className="font-bold text-red-600 text-lg">"{selectedBook?.title}"</p>
                      <p className="text-sm text-red-500 mt-2 flex items-center justify-center">
                        <AlertCircle size={16} className="mr-2" />
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteBook}
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Delete Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Archive Confirmation Modal */}
          {showArchiveModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-24">
              <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                      <Archive size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Archive Book</h2>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-gray-700 mb-2">
                            This book has content and/or student progress. Deletion is disabled to preserve records.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-gray-700 mb-2">
                        Would you like to archive:
                      </p>
                      <p className="font-bold text-blue-600 text-lg">"{selectedBook?.title}"</p>
                      <p className="text-sm text-blue-500 mt-2">
                        Archived books can be restored later if needed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowArchiveModal(false)}
                      className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmArchiveBook}
                      className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Archive Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Alert Modal */}
          {alertModal.show && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 pt-24">
              <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                <div className={`absolute inset-0 ${
                  alertModal.type === "success" 
                    ? "bg-gradient-to-br from-green-500/5 to-emerald-500/5" 
                    : "bg-gradient-to-br from-red-500/5 to-pink-500/5"
                }`}></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl ${
                      alertModal.type === "success"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-red-500 to-pink-600"
                    }`}>
                      {alertModal.type === "success" ? (
                        <CheckCircle size={32} className="text-white" />
                      ) : (
                        <AlertCircle size={32} className="text-white" />
                      )}
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 ${
                      alertModal.type === "success" ? "text-green-700" : "text-red-700"
                    }`}>
                      {alertModal.type === "success" ? "Success!" : "Error"}
                    </h3>
                    <div className={`rounded-xl p-4 ${
                      alertModal.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      <p className="text-gray-700">{alertModal.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={closeAlertModal}
                      className={`px-8 py-3 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                        alertModal.type === "success"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          : "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                      }`}
                    >
                      OK
                    </button>
                  </div>
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
