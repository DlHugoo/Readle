import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Book,
  GripVertical,
  Trash2,
  Info,
  Upload,
  XCircle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import TeacherNav from '../../../components/TeacherNav';

const Modal = ({ open, onClose, type, message }) => {
  if (!open) return null;
  const Icon = type === "success" ? CheckCircle : XCircle;
  const color = type === "success" ? "text-green-600" : "text-red-600";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
        <Icon size={40} className={`mx-auto mb-2 ${color}`} />
        <p className="mb-4 text-lg font-medium text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </div>
  );
};

const TeacherCreateSSA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedBookId = location.state?.bookId;
  const passedBookTitle = location.state?.bookTitle;
  
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(passedBookId || "");
  const [title, setTitle] = useState(passedBookTitle ? `${passedBookTitle} - Sequencing Activity` : "");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Only fetch books if no book ID was passed
    if (!passedBookId) {
      axios
        .get("http://localhost:8080/api/books")
        .then((res) => setBooks(res.data))
        .catch(console.error);
    }
  }, [passedBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    axios
      .get(`http://localhost:8080/api/ssa/by-book/${selectedBookId}`)
      .then((res) => {
        if (res.data.images && res.data.images.length > 0) {
          setTitle(res.data.title);
          setImages(
            res.data.images.map((img, idx) => ({
              id: `${Date.now()}-${idx}`,
              file: null,
              preview: img.imageUrl.startsWith("/uploads")
                ? `http://localhost:8080${img.imageUrl}`
                : img.imageUrl,
            }))
          );
        }
      })
      .catch(() => {
        setImages([]);
      });
  }, [selectedBookId]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...files]);
  };

  const removeImage = (idToRemove) => {
    setImages(images.filter((img) => img.id !== idToRemove));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setImages(reordered);
  };

  const resetForm = () => {
    setTitle("");
    setImages([]);
    if (!passedBookId) {
      setSelectedBookId("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedBookId || !title || images.length === 0) {
      setModal({
        open: true,
        message: "Please fill all fields.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const uploadedImageData = await Promise.all(
        images.map(async ({ file, preview }, idx) => {
          if (!file) {
            return { imageUrl: preview, correctPosition: idx + 1 };
          }
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploadType", "ssa");

          const res = await axios.post(
            "http://localhost:8080/api/books/upload-image",
            formData
          );
          return { imageUrl: res.data, correctPosition: idx + 1 };
        })
      );

      await axios.post(
        "http://localhost:8080/api/ssa/create",
        {
          title,
          bookId: selectedBookId,
          images: uploadedImageData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setModal({
        open: true,
        message: "✅ SSA created successfully!",
        type: "success",
      });
      resetForm();
    } catch (err) {
      console.error("SSA creation failed:", err);
      setModal({
        open: true,
        message: "❌ Failed to create SSA.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <div className="max-w-4xl mx-auto pt-24 pb-12 px-6">
        <Modal {...modal} onClose={() => setModal({ ...modal, open: false })} />
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {passedBookId && (
                <button 
                  onClick={goBack} 
                  className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ArrowLeft size={20} className="mr-1" />
                  Back to Book
                </button>
              )}
              <h2 className="text-2xl font-semibold text-gray-800">
                <span className="mr-2">🧩</span> Create Story Sequencing Activity
              </h2>
            </div>
            <button
              className="text-blue-600 hover:text-blue-800 flex items-center"
              onClick={() => setShowHelp(!showHelp)}
            >
              <Info size={18} className="mr-1" />
              Help
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
            <h3 className="font-semibold text-blue-800 mb-2">
              How to create a Story Sequencing Activity:
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-blue-800">
              <li>{passedBookId ? "Book already selected." : "Select a book."}</li>
              <li>Upload images in order of the story.</li>
              <li>Drag images to reorder.</li>
              <li>Click Create when ready.</li>
            </ol>
          </div>
        )}

        <div className="space-y-6">
          {/* Only show book selection if no book ID was passed */}
          {!passedBookId && (
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <label className="flex items-center text-lg font-medium text-gray-700 mb-2">
                <Book size={20} className="mr-2" /> Select Book
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => {
                  const selected = e.target.value;
                  setSelectedBookId(selected);
                  const book = books.find((b) => b.bookID.toString() === selected);
                  if (book) setTitle(book.title);
                }}
                className="w-full border border-gray-300 p-3 rounded-md"
              >
                <option value="">-- Choose a Book --</option>
                {books.map((book) => (
                  <option key={book.bookID} value={book.bookID}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show selected book info if a book ID was passed */}
          {passedBookId && (
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center text-lg font-medium text-gray-700 mb-2">
                <Book size={20} className="mr-2" /> Selected Book
              </div>
              <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                {passedBookTitle || "Book #" + passedBookId}
              </div>
            </div>
          )}

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <label className="flex items-center text-lg font-medium text-gray-700 mb-2">
              Activity Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md"
              placeholder="Enter activity title"
            />
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <label className="flex items-center text-lg font-medium text-gray-700 mb-2">
              <Camera size={20} className="mr-2" /> Upload Story Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="mb-2 text-sm text-gray-500">
                Upload images for each step in the story sequence
              </p>
              <input
                type="file"
                id="image-upload"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 cursor-pointer"
              >
                <Upload size={16} className="mr-2" />
                Select Images
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {images.length > 0
                ? `${images.length} image(s) selected`
                : "No images selected"}
            </p>
          </div>

          {/* Rest of the component remains the same */}
          {images.length > 0 && (
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <label className="flex items-center text-lg font-medium text-gray-700 mb-3">
                <GripVertical size={20} className="mr-2" /> Arrange Images in
                Story Sequence
              </label>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="imageList" direction="horizontal">
                  {(provided) => (
                    <div
                      className="flex gap-4 overflow-x-auto pb-4"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {images.map((img, index) => (
                        <Draggable
                          key={img.id}
                          draggableId={img.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              className="relative border rounded-lg overflow-hidden bg-white shadow-md group w-40 cursor-move"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {/* ❌ Remove button (top-right) */}
                              <div
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-10"
                                onClick={() => removeImage(img.id)}
                                title="Remove"
                              >
                                <Trash2 size={14} />
                              </div>

                              <img
                                src={img.preview}
                                alt={`Step ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />

                              {/* 📍 Position Number */}
                              <div className="text-center py-1 text-sm font-semibold text-gray-700">
                                Position {index + 1}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedBookId || images.length === 0}
              className={`px-6 py-3 text-white font-semibold rounded-md ${
                loading || !selectedBookId || images.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating..." : "Create Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCreateSSA;