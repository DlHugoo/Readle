import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAccessToken } from "../../api/api";
import { Upload, PlusCircle, BookOpen, Menu, AlertCircle, CheckCircle, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BadgeManagement from "../../components/BadgeManagement";
import { getApiUrl, getImageUrl } from "../../utils/apiConfig";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ✅ Get user and logout from AuthContext
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
    // ✅ Use user from AuthContext instead of localStorage
    // ProtectedRoute already handles auth check, but double-check here
    if (user && user.role === "ADMIN") {
      if (activeTab === "books") {
        fetchBooks();
      } else if (activeTab === "archived") {
        fetchArchivedBooks();
      }
    }
  }, [user, activeTab]);


  const fetchBooks = async () => {
    try {
      const response = await axios.get("/api/books/for-you", { withCredentials: true });
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books", error);
      showAlertModal("error", "Failed to fetch books. Please try again later.");
    }
  };

  const fetchArchivedBooks = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get("/api/books/archived", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
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

    const token = getAccessToken();

    try {
      // Convert file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send as JSON instead of FormData
      const response = await fetch("/api/books/upload-image-base64", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          file: base64Data,
          filename: file.name,
          contentType: file.type,
          uploadType: "bookcovers"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      // The backend now returns file URL (like your old SkillMatch app)
      const fileUrl = await response.text();
      return fileUrl;
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
      const token = getAccessToken();
      const adminId = user?.userId; // ✅ Get userId from AuthContext

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
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
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
    const token = getAccessToken();

    try {
      if (book.archived) {
        await axios.put(`/api/books/${book.bookID}/unarchive`, {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        showAlertModal("success", "Book unarchived successfully!");
      } else {
        await axios.put(`/api/books/${book.bookID}/archive`, {}, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
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
    const token = getAccessToken();
    try {
      await axios.delete(`/api/books/admin/${selectedBook.bookID}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
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
    const token = getAccessToken();
    
    // Convert file to base64 (like other upload functions)
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
      reader.onerror = reject;
      reader.readAsDataURL(editImageFile);
    });

    const requestData = {
      file: base64Data,
      filename: editImageFile.name,
      contentType: editImageFile.type,
      uploadType: "bookcovers"
    };

    const res = await fetch(getApiUrl("api/books/upload-image-base64"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(requestData)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed: ${res.status} - ${errorText}`);
    }

    return await res.text();
  };

  const submitEdit = async () => {
    const token = getAccessToken();
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
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Top Bar with Logout */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-blue-100">
          <div className="flex justify-between items-center p-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Manage books and badges</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow hover:shadow-md transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-6">
        <div className="p-6 max-w-7xl mx-auto w-full">
          {/* Tabs */}
          <div className="relative">
            {/* subtle background accents */}
            <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl"></div>
            <div className="pointer-events-none absolute -top-8 right-0 h-28 w-28 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setActiveTab("books")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "books"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen size={16} />
                  Books
                </button>
                <button
                  onClick={() => setActiveTab("archived")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "archived"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <CheckCircle size={16} />
                  Archived
                </button>
                <button
                  onClick={() => setActiveTab("badges")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === "badges"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Award size={16} />
                  Badges
                </button>
              </div>

              {/* Quick action */}
              {activeTab === "books" && (
                <button
                  onClick={() => setShowAddBookModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-white font-semibold shadow hover:shadow-md transition-all"
                >
                  <PlusCircle size={18} />
                  Add Book
                </button>
              )}
            </div>
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

              {/* Action Buttons removed to avoid redundancy with top-right Add Book */}

              {/* Book List */}
              <div className="mt-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <BookOpen size={20} className="mr-2 text-blue-500" />
                  <span>Books Library</span>
                </h2>
                
                {books.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500 mb-3">No books available in the library.</p>
                    <button
                      onClick={() => setShowAddBookModal(true)}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:shadow-md transition-all"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Add Your First Book
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...books]
                      .sort((a, b) => (Number(b.difficultyLevel || 0) - Number(a.difficultyLevel || 0)))
                      .map((book, index) => (
                      <div key={book.bookID} className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-purple-500/20 transition-all duration-300">
                        <div
                          className="group relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                          onClick={() => handleBookClick(book.bookID)}
                        >
                          {/* Book Cover Image (3:4) */}
                          <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                            {book.imageURL ? (
                              <img
                                src={getImageUrl(book.imageURL)}
                                alt={book.title}
                                className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              />
                            ) : (
                              <span className="text-gray-500">No Image</span>
                            )}
                          </div>

                          {/* Hover Overlay with compact details */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                            <div className="w-full px-3 py-2 text-white">
                              <h3 className="text-sm font-semibold leading-tight truncate">{book.title}</h3>
                              <div className="text-[11px] leading-tight text-blue-100 truncate">by {book.author}</div>
                              <div className="mt-1 flex items-center gap-0.5">
                                {Array.from({ length: Math.max(1, Math.min(3, book.difficultyLevel || 1)) }).map((_, i) => (
                                  <span key={i} className="text-amber-400 text-base leading-none">★</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* 3-dot Menu */}
                          <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering other events
                              setMenuOpenIndex(index === menuOpenIndex ? null : index);
                            }}
                          >
                            ⋮
                          </button>

                          {menuOpenIndex === index && (
                            <div className="absolute top-2 right-10 bg-white border rounded-lg shadow-md z-10 w-40 overflow-hidden">
                              <button
                                className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-700 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(book, index);
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveClick(book);
                                }}
                              >
                                📦 {book.archived ? "Unarchive" : "Archive"}
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 font-medium"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Book Modal */}
              {showAddBookModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
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
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addBook}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-white font-semibold shadow hover:shadow-md transition-all"
                      >
                        Add Book
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Modal */}
              {editingBook && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100">
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
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitEdit}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:shadow-md transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                    <p className="mb-6">
                      Are you sure you want to delete the book "{selectedBook?.title}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteBook}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow hover:shadow-md transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert Modal */}
              {alertModal.show && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
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
                        className={`px-4 py-2 rounded-lg text-white font-semibold shadow hover:shadow-md transition-all ${
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
                            src={getImageUrl(book.imageURL)}
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
