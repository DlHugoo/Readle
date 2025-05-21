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
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import TeacherNav from '../../../components/TeacherNav';

const Modal = ({ open, onClose, type, message }) => {
  if (!open) return null;
  const Icon = type === "success" ? CheckCircle : type === "warning" ? AlertCircle : XCircle;
  const color = type === "success" ? "text-green-600" : type === "warning" ? "text-amber-500" : "text-red-600";

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
  const [existingSSA, setExistingSSA] = useState(null);
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
    
    setLoading(true);
    const token = localStorage.getItem("token");
    
    axios
      .get(`http://localhost:8080/api/ssa/by-book/${selectedBookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data) {
          setExistingSSA(res.data);
          setTitle(res.data.title);
          setImages(
            res.data.images.map((img, idx) => ({
              id: `${Date.now()}-${idx}`,
              file: null,
              preview: img.imageUrl.startsWith("/uploads")
                ? `http://localhost:8080${img.imageUrl}`
                : img.imageUrl,
              originalId: img.id
            }))
          );
        }
      })
      .catch((err) => {
        // Handle 400 Bad Request (no SSA exists) or other errors
        console.log("No existing SSA found or error occurred:", err.response?.data);
        if (err.response?.status === 403) {
          setModal({
            open: true,
            message: "You don't have permission to view this content. Please make sure you are logged in as a teacher or admin.",
            type: "error"
          });
          navigate("/login");
          return;
        }
        setExistingSSA(null);
        if (passedBookTitle) {
          setTitle(`${passedBookTitle} - Sequencing Activity`);
        }
        setImages([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedBookId, passedBookTitle, navigate]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  const handleImageChange = (e) => {
    if (existingSSA) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Validate files before processing
    const invalidFiles = [];
    const validFiles = [];
    
    selectedFiles.forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (exceeds 5MB size limit)`);
        return;
      }
      
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (not a supported image format)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show error for invalid files
    if (invalidFiles.length > 0) {
      setModal({
        open: true,
        message: `The following files couldn't be added:\n${invalidFiles.join('\n')}`,
        type: "warning"
      });
    }
    
    // Process valid files
    if (validFiles.length > 0) {
      const newImages = validFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      
      setImages((prev) => [...prev, ...newImages]);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (idToRemove) => {
    if (existingSSA) return;
    setImages(images.filter((img) => img.id !== idToRemove));
  };

  const onDragEnd = (result) => {
    if (existingSSA || !result.destination) return;
    
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setImages(reordered);
  };

  const resetForm = () => {
    setTitle(passedBookTitle ? `${passedBookTitle} - Sequencing Activity` : "");
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

          try {
            const res = await axios.post(
              "http://localhost:8080/api/books/upload-image",
              formData
            );
            return { imageUrl: res.data, correctPosition: idx + 1 };
          } catch (error) {
            // Handle upload errors
            console.error("Image upload error:", error);
            
            // Get error message from response if available
            const errorMessage = error.response?.data || "Failed to upload image";
            
            throw new Error(`Failed to upload image ${idx + 1}: ${errorMessage}`);
          }
        })
      );

      await axios.post(
        "http://localhost:8080/api/ssa/create",
        {
          title,
          bookId: selectedBookId,
          images: uploadedImageData
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
      
      // Refresh the data after creating
      axios
        .get(`http://localhost:8080/api/ssa/by-book/${selectedBookId}`)
        .then((res) => {
          if (res.data && res.data.images && res.data.images.length > 0) {
            setExistingSSA(res.data);
            setTitle(res.data.title);
            setImages(
              res.data.images.map((img, idx) => ({
                id: `${Date.now()}-${idx}`,
                file: null,
                preview: img.imageUrl.startsWith("/uploads")
                  ? `http://localhost:8080${img.imageUrl}`
                  : img.imageUrl,
                originalId: img.id
              }))
            );
          }
        });
    } catch (err) {
      console.error("SSA creation failed:", err);
      setModal({
        open: true,
        message: `❌ ${err.message || "Failed to create SSA."}`,
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
                <span className="mr-2">🧩</span> 
                {existingSSA ? "View" : "Create"} Story Sequencing Activity
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center ml-4"
                onClick={() => setShowHelp(!showHelp)}
              >
                <Info size={18} className="mr-1" />
                Help
              </button>
            </div>
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
            {existingSSA && (
              <p className="mt-2 text-blue-800 font-medium">
                Note: Each book can only have one Story Sequencing Activity.
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Only show book selection if no book ID was passed */}
            {!passedBookId && !existingSSA && (
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
                  disabled={loading}
                  className={`w-full border border-gray-300 p-3 rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">-- Choose a Book --</option>
                  {books.map((book) => (
                    <option key={book.bookID} value={book.bookID}>
                      {book.title} {book.hasSSA ? " (Has SSA)" : ""}
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
                disabled={existingSSA}
                className={`w-full border border-gray-300 p-3 rounded-md ${existingSSA ? 'bg-gray-100' : ''}`}
                placeholder="Enter activity title"
              />
            </div>

            {!existingSSA && (
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <label className="flex items-center text-lg font-medium text-gray-700 mb-2">
                  <Camera size={20} className="mr-2" /> Upload Story Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload size={40} className="mx-auto text-gray-400 mb-2" />
                  <p className="mb-2 text-sm text-gray-500">
                    Upload images for each step in the story sequence
                  </p>
                  <p className="mb-4 text-xs text-gray-400">
                    Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                  </p>
                  <input
                    type="file"
                    id="image-upload"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={existingSSA}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`inline-flex items-center px-4 py-2 ${
                      existingSSA 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    } text-white font-medium rounded-md`}
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
            )}

            {images.length > 0 && (
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <label className="flex items-center text-lg font-medium text-gray-700 mb-3">
                  <GripVertical size={20} className="mr-2" /> 
                  {existingSSA ? "View" : "Arrange"} Images in Story Sequence
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
                            isDragDisabled={existingSSA}
                          >
                            {(provided) => (
                              <div
                                className={`relative border rounded-lg overflow-hidden bg-white shadow-md group w-40 ${existingSSA ? 'cursor-default' : 'cursor-move'}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {/* ❌ Remove button (top-right) - only show when creating new */}
                                {!existingSSA && (
                                  <div
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-10"
                                    onClick={() => removeImage(img.id)}
                                    title="Remove"
                                  >
                                    <Trash2 size={14} />
                                  </div>
                                )}

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

            {!existingSSA && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedBookId || images.length === 0}
                  className={`px-6 py-3 text-white font-semibold rounded-md flex items-center ${
                    loading || !selectedBookId || images.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Processing..." : "Create Activity"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCreateSSA;