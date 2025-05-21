import React, { useEffect, useState } from "react";
import axios from "axios";
import { Upload, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  // ✅ Edit state
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

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/admin-login");
    } else {
      fetchBooks();
    }
  }, [navigate]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get("/api/books/for-you");
      setBooks(response.data);
    } catch (error) {
      console.error("Failed to fetch books", error);
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
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await axios.post("/api/books/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  };

  const addBook = async () => {
    const { title, author, difficultyLevel, genre } = newBook;
    if (!title || !author || !difficultyLevel) {
      setError("Please fill in all fields.");
      return;
    }

    if (difficultyLevel < 1 || difficultyLevel > 3) {
      setError("Difficulty level must be between 1 and 3.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const adminId = localStorage.getItem("userId");

      let imageURL = null;
      if (imageFile) {
        imageURL = await uploadImage();
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
      setSuccess("Book added successfully!");
      setNewBook({ title: "", author: "", difficultyLevel: 1, genre: "" });
      setImageFile(null);
      setImagePreview(null);
      setError("");
    } catch (err) {
      console.error("Add book error:", err);
      const msg = err.response?.data?.message || "Failed to add book.";
      setError(msg);
    }
  };

  const deleteBook = async (bookID) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/books/${bookID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(books.filter((b) => b.bookID !== bookID));
    } catch (error) {
      console.error("Failed to delete book:", error);
      setError("Failed to delete book.");
    }
  };

  // ✅ Open Edit
  const openEditModal = (book, index) => {
    setEditingBook(book);
    setEditFields({
      title: book.title,
      author: book.author,
      genre: book.genre,
      difficultyLevel: book.difficultyLevel,
      imageURL: book.imageURL,
    });
    setEditImagePreview(book.imageURL ? `http://localhost:8080${book.imageURL}` : null);
    setEditImageFile(null);
    setMenuOpenIndex(null);
  };

  const uploadEditImage = async () => {
    if (!editImageFile) return null;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", editImageFile);

    const res = await axios.post("/api/books/upload-image", formData, {
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
      imageURL = await uploadEditImage();
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
      setEditingBook(null);
    } catch (err) {
      console.error("Failed to update book:", err);
    }
  };

  const handleBookClick = (bookId) => {
    console.log("Navigating to book with ID:", bookId);
    navigate(`/book-editor/${bookId}`);
  };

  const getDifficultyStars = (level) =>
    "★".repeat(Math.max(1, Math.min(level, 3)));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">📚 Admin Dashboard</h1>

      {/* Book Form */}
      <div className="bg-white shadow-md p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Add a Book</h2>
        <input type="text" name="title" placeholder="Title" value={newBook.title} onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input type="text" name="author" placeholder="Author" value={newBook.author} onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input type="text" name="genre" placeholder="Genre (optional)" value={newBook.genre} onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input type="number" name="difficultyLevel" placeholder="Difficulty Level (1–3)" value={newBook.difficultyLevel} onChange={handleChange} className="w-full p-2 border rounded mb-2" min="1" max="3" />

        <label className="block mb-2 font-medium">Book Cover Image</label>
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <Upload />
          <span className="text-blue-600">Upload image</span>
          <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        </label>

        {imagePreview && (
          <div className="mb-4 w-32 h-40 border border-gray-300 rounded overflow-hidden">
            <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
          </div>
        )}

        <button onClick={addBook} className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-2 rounded">
          <PlusCircle className="inline-block mr-2" />
          Add Book
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </div>

      {/* Book List */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Books List</h2>
        {books.length === 0 ? (
          <p className="text-gray-500">No books available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book, index) => (
              <div
                key={book.bookID}
                className="bg-white shadow-md rounded p-3 hover:shadow-lg transition relative"
                onClick={() => handleBookClick(book.bookID)}
              >
                <button
                  className="absolute top-2 right-2 text-gray-500 text-xl hover:text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenIndex(menuOpenIndex === index ? null : index);
                  }}
                >
                  ⋮
                </button>

                {menuOpenIndex === index && (
                  <div className="absolute top-8 right-2 bg-white border rounded shadow z-10 w-32">
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => openEditModal(book, index)}>
                      ✏️ Edit
                    </button>
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600" onClick={() => deleteBook(book.bookID)}>
                      🗑️ Delete
                    </button>
                  </div>
                )}

                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
                  {book.imageURL ? (
                    <img src={`http://localhost:8080${book.imageURL}`} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">No Image</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-600">by {book.author}</p>
                <p className="text-yellow-500 text-lg">{getDifficultyStars(book.difficultyLevel)}</p>
                <div className="flex justify-between mt-2">
                  <button onClick={() => navigate(`/book-editor/${book.bookID}`)} className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded">Manage</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Book</h2>
            <input type="text" placeholder="Title" value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} className="w-full mb-2 p-2 border rounded" />
            <input type="text" placeholder="Author" value={editFields.author} onChange={(e) => setEditFields({ ...editFields, author: e.target.value })} className="w-full mb-2 p-2 border rounded" />
            <input type="text" placeholder="Genre" value={editFields.genre} onChange={(e) => setEditFields({ ...editFields, genre: e.target.value })} className="w-full mb-2 p-2 border rounded" />
            <input type="number" min="1" max="3" placeholder="Difficulty Level" value={editFields.difficultyLevel} onChange={(e) => setEditFields({ ...editFields, difficultyLevel: parseInt(e.target.value) || 1 })} className="w-full mb-2 p-2 border rounded" />

            <label className="block mb-2">Change Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              setEditImageFile(file);
              const reader = new FileReader();
              reader.onloadend = () => setEditImagePreview(reader.result);
              reader.readAsDataURL(file);
            }} className="mb-2" />

            {editImagePreview && <img src={editImagePreview} alt="Preview" className="mb-2 w-full h-40 object-cover rounded" />}

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingBook(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={submitEdit} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
