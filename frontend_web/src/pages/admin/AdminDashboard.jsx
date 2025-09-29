import React, { useEffect, useState } from "react";
import axios from "axios";
import { Upload, PlusCircle, BookOpen, Menu, AlertCircle, CheckCircle, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BadgeManagement from "../../components/BadgeManagement";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("books"); // "books" or "badges"
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    difficultyLevel: 1,
    genre: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ show: false, type: "", message: "" });
  const GENRES = ["Fiction", "Nonfiction", "Mystery", "Fantasy", "Fable"];
  const [archivedBooks, setArchivedBooks] = useState([]);


  // Edit state
  const [editingBook, setEditingBook] = useState(null);
  const [editFields, setEditFields] = useState({
    title: "",
    author: "",
    genre: "",
    difficultyLevel: 1,
    imageURL: "",
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Constants for file validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/admin-login");
    } else {
      if (activeTab === "books") {
        fetchBooks();
      } else if (activeTab === "archived") {
        fetchArchivedBooks();
      }
    }
  }, [navigate, activeTab]);


  const fetchBooks = async () => {
    try {
      const response = await axios.get("/api/books/for-you");
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books", error);
      showAlertModal("error", "Failed to fetch books. Please try again later.");
    }
  };

  const fetchArchivedBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/books/archived", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedBooks(response.data);  // ✅ update archivedBooks, not books
    } catch (error) {
      console.error("Failed to fetch archived books", error);
      showAlertModal("error", "Failed to fetch archived books.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({
      ...prev,
      [name]: name === "difficultyLevel" ? parseInt(value) || 1 : value,
    }));
  };

  const handleImageSelect = (e) => {
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

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageSelect = (e) => {
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

      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const token = localStorage.getItem("token");

    try {
      // Convert file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send as JSON instead of FormData
      const response = await axios.post("/api/books/upload-image", {
        file: base64Data,
        filename: file.name,
        contentType: file.type,
        uploadType: "bookcovers"
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      // The backend now returns base64 data directly (like your old app)
      // Convert it to a data URL for display
      const base64Response = response.data;
      return `data:${file.type};base64,${base64Response}`;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  };

  const showAlertModal = (type, message) => {
    setAlertModal({ show: true, type, message });
  };

  const closeAlertModal = () => {
    setAlertModal({ show: false, type: "", message: "" });
  };

  const addBook = async () => {
    const { title, author, difficultyLevel, genre } = newBook;
    if (!title || !author || !difficultyLevel) {
      showAlertModal("error", "Please fill in all required fields.");
      return;
    }

    if (difficultyLevel < 1 || difficultyLevel > 3) {
      showAlertModal("error", "Difficulty level must be between 1 and 3.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const adminId = localStorage.getItem("userId");

      let imageURL = null;
      if (imageFile) {
        try {
          imageURL = await uploadImage(imageFile);
          showAlertModal("success", "Image uploaded successfully!");
        } catch (error) {
          showAlertModal("error", `Failed to upload image: ${error.message}`);
          return;
        }
      }

      const response = await axios.post(
        `/api/books/admin?adminId=${adminId}`,
        {
          ...newBook,
          imageURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBooks([...books, response.data]);
      showAlertModal("success", "Book added successfully!");
      setNewBook({ title: "", author: "", difficultyLevel: 1, genre: "" });
      setImageFile(null);
      setImagePreview(null);
      setShowAddBookModal(false);
    } catch (err) {
      console.error("Add book error:", err);
      const msg = err.response?.data?.message || "Failed to add book.";
      showAlertModal("error", msg);
    }
  };

  const handleDeleteClick = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
    setMenuOpenIndex(null);
  };

  const handleArchiveClick = async (book) => {
    const token = localStorage.getItem("token");

    try {
      if (book.archived) {
        await axios.put(`/api/books/${book.bookID}/unarchive`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlertModal("success", "Book unarchived successfully!");
      } else {
        await axios.put(`/api/books/${book.bookID}/archive`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showAlertModal("success", "Book archived successfully!");
      }

      // Refresh books
      fetchBooks();
    } catch (error) {
      console.error("Archive/unarchive failed:", error);
      showAlertModal("error", `Failed to update archive state: ${error.response?.data || error.message}`);
    }
  };


  const confirmDeleteBook = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/books/admin/${selectedBook.bookID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(books.filter((b) => b.bookID !== selectedBook.bookID));
      showAlertModal("success", "Book deleted successfully!");
      setShowDeleteModal(false);
    } catch (error) {
  console.error("Failed to delete book:", error);

      const msg = error.response?.data || "An unknown error occurred";
      showAlertModal("error", `Failed to delete book: ${msg}`);
    }

  };

  const openEditModal = (book, index) => {
    setEditingBook(book);
    setEditFields({
      title: book.title,
      author: book.author,
      genre: book.genre,
      difficultyLevel: book.difficultyLevel,
      imageURL: book.imageURL,
    });
    setEditImagePreview(book.imageURL ? getImageUrl(book.imageURL) : null);
    setEditImageFile(null);
    setMenuOpenIndex(null);
  };

  const uploadEditImage = async () => {
    if (!editImageFile) return null;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", editImageFile);

    const res = await axios.post("http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000/api/books/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  };

  const submitEdit = async () => {
    const token = localStorage.getItem("token");
    let imageURL = editFields.imageURL;

    if (editImageFile) {
      try {
        imageURL = await uploadEditImage();
        showAlertModal("success", "Image uploaded successfully!");
      } catch (error) {
        showAlertModal("error", `Failed to upload image: ${error.message}`);
        return;
      }
    }

    const updated = {
      ...editFields,
      imageURL,
    };

    try {
      const res = await axios.put(`/api/books/admin/${editingBook.bookID}`, updated, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBooks((prev) =>
        prev.map((b) => (b.bookID === res.data.bookID ? res.data : b))
      );
      showAlertModal("success", "Book updated successfully!");
      setEditingBook(null);
    } catch (err) {
      console.error("Failed to update book:", err);
      showAlertModal("error", "An error occurred while updating the book.");
    }
  };

  const handleBookClick = (bookId) => {
    console.log("Navigating to book with ID:", bookId);
    navigate(`/admin-book-editor/${bookId}`);
  };

  const getDifficultyStars = (level) =>
    "★".repeat(Math.max(1, Math.min(level, 3)));

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-6">
        <div className="p-6 max-w-7xl mx-auto w-full">
          {/* Page Title */}
          <h1 className="text-3xl font-bold mb-6 text-[#3B82F6] flex items-center">
            <BookOpen size={32} className="mr-3 text-[#3B82F6]" />
            Admin Dashboard
          </h1>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("books")}
              className={`py-2 px-4 font-semibold text-gray-700 ${
                activeTab === "books"
                  ? "border-b-2 border-[#3B82F6] text-[#3B82F6]"
                  : "hover:text-gray-900"
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`py-2 px-4 font-semibold text-gray-700 ${
                activeTab === "archived"
                  ? "border-b-2 border-[#3B82F6] text-[#3B82F6]"
                  : "hover:text-gray-900"
              }`}
            >
              Archived
            </button>
            <button
              onClick={() => setActiveTab("badges")}
              className={`py-2 px-4 font-semibold text-gray-700 ${
                activeTab === "badges"
                  ? "border-b-2 border-[#3B82F6] text-[#3B82F6]"
                  : "hover:text-gray-900"
              }`}
            >
              Badges
            </button>
          </div>

          {/* Content based on active tab */}
          {activeTab === "books" && (
            <>
              {/* Admin Information Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-md mb-5 border border-blue-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#3B82F6] mb-1">
                      Book Management
                    </h2>
                    <p className="text-sm text-gray-500 mb-1">
                      Add, edit, and manage books in the Readle platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setShowAddBookModal(true)}
                  className="bg-white border border-[#FACC14] hover:bg-[#FACC14] hover:text-white text-[#FACC14] font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={24} />
                    <span>Add New Book to Library</span>
                  </div>
                  <PlusCircle size={20} />
                </button>
              </div>

              {/* Book List */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <BookOpen size={20} className="mr-2 text-blue-500" />
                  <span>Books Library</span>
                </h2>
                
                {books.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500 mb-3">No books available in the library.</p>
                    <button
                      onClick={() => setShowAddBookModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Add Your First Book
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {books.map((book, index) => (
                      <div
                        key={book.bookID}
                        className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 relative"
                        onClick={() => handleBookClick(book.bookID)}
                      >
                        {/* Book Cover Image */}
                        <div className="h-48 bg-gray-200 flex items-center justify-center">
                          {book.imageURL ? (
                            <img
                              src={getImageUrl(book.imageURL)}
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
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            Difficulty:{" "}
                            <span className="ml-2 text-yellow-500 text-2xl">
                              {getDifficultyStars(book.difficultyLevel)}
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
                                e.stopPropagation();
                                openEditModal(book, index);
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-blue-200 text-blue-600 font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveClick(book);
                              }}
                            >
                              📦 {book.archived ? "Unarchive" : "Archive"}
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 hover:bg-red-200 text-red-600 font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(book);
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Book Modal */}
              {showAddBookModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
                    <h2 className="text-xl font-bold mb-4 text-[#3B82F6]">Add a New Book</h2>

                    <input
                      type="text"
                      name="title"
                      placeholder="Book Title"
                      value={newBook.title}
                      onChange={handleChange}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    />

                    <input
                      type="text"
                      name="author"
                      placeholder="Author"
                      value={newBook.author}
                      onChange={handleChange}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    />

                    <select
                      name="genre"
                      value={newBook.genre}
                      onChange={handleChange}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    >
                      <option value="">Select a genre</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>


                    <input
                      type="number"
                      name="difficultyLevel"
                      placeholder="Difficulty Level (1-3)"
                      value={newBook.difficultyLevel}
                      onChange={handleChange}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                      min="1"
                      max="3"
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
                        onChange={handleImageSelect}
                        className="hidden" // Hide the actual input
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddBookModal(false)}
                        className="bg-gray-300 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addBook}
                        className="bg-[#FACC14] text-white px-4 py-2 rounded hover:bg-yellow-400"
                      >
                        Add Book
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Modal */}
              {editingBook && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
                    <h2 className="text-xl font-bold mb-4 text-[#3B82F6]">Edit Book</h2>

                    <input
                      type="text"
                      placeholder="Book Title"
                      value={editFields.title}
                      onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    />

                    <input
                      type="text"
                      placeholder="Author"
                      value={editFields.author}
                      onChange={(e) => setEditFields({ ...editFields, author: e.target.value })}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    />

                    <select
                      value={editFields.genre}
                      onChange={(e) => setEditFields({ ...editFields, genre: e.target.value })}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    >
                      <option value="">Select a genre</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>


                    <input
                      type="number"
                      min="1"
                      max="3"
                      placeholder="Difficulty Level"
                      value={editFields.difficultyLevel}
                      onChange={(e) => setEditFields({ ...editFields, difficultyLevel: parseInt(e.target.value) || 1 })}
                      className="w-full mb-3 p-3 border border-gray-300 rounded"
                    />

                    {/* Image Preview */}
                    {editImagePreview && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Book Cover:</p>
                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          <img 
                            src={editImagePreview} 
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
                        onChange={handleEditImageSelect}
                        className="hidden" // Hide the actual input
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingBook(null)}
                        className="bg-gray-300 px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitEdit}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
            </>
          )}

          {activeTab === "archived" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <BookOpen size={20} className="mr-2 text-blue-500" />
                <span>Archived Books</span>
              </h2>

              {archivedBooks.length === 0 ? (
                <p className="text-gray-500">No archived books.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {archivedBooks.map((book) => (
                    <div
                      key={book.bookID}
                      className="bg-white rounded-lg shadow-lg overflow-hidden"
                    >
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        {book.imageURL ? (
                          <img
                            src={`http://localhost:3000${book.imageURL}`}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500">No Image</span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-lg font-bold text-[#3B82F6] truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600">by {book.author}</p>
                        <button
                          onClick={() => handleArchiveClick(book)}
                          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Unarchive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "badges" && <BadgeManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
