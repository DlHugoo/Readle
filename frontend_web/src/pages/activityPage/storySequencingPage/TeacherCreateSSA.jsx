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
  AlertCircle,
  Edit3,
  Save,
  X,
  Sparkles,
  Star,
  Heart,
  Zap,
  Target,
  Play,
  Image as ImageIcon,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wand2
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { getImageUrl, getApiUrl } from "../../../utils/apiConfig";
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalImages, setOriginalImages] = useState([]);
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
        .get(getApiUrl("api/books"))
        .then((res) => setBooks(res.data))
        .catch(console.error);
    }
  }, [passedBookId]);

  useEffect(() => {
    if (!selectedBookId) return;
    
    setLoading(true);
    const token = localStorage.getItem("token");
    
    axios
      .get(`/api/ssa/by-book/${selectedBookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data) {
          setExistingSSA(res.data);
          setTitle(res.data.title);
          const imageData = res.data.images.map((img, idx) => ({
            id: `${Date.now()}-${idx}`,
            file: null,
            preview: img.imageUrl.startsWith("/uploads")
              ? getImageUrl(img.imageUrl)
              : img.imageUrl,
            originalId: img.id
          }));
          setImages(imageData);
          setOriginalImages([...imageData]); // Store original order for cancel functionality
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
    if ((!isEditMode && existingSSA) || !result.destination) return;
    
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

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setImages([...originalImages]); // Restore original order
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!existingSSA || images.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Prepare the updated image data with new positions
      const updatedImages = images.map((img, index) => ({
        id: img.originalId,
        correctPosition: index + 1
      }));

      await axios.put(
        `/api/ssa/update-positions/${existingSSA.id}`,
        { images: updatedImages },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the original images to reflect the new order
      setOriginalImages([...images]);
      setIsEditMode(false);
      
      setModal({
        open: true,
        message: "✅ Image positions updated successfully!",
        type: "success"
      });
    } catch (err) {
      console.error("Failed to update image positions:", err);
      setModal({
        open: true,
        message: `❌ Failed to update image positions: ${err.response?.data?.message || err.message}`,
        type: "error"
      });
      // Restore original order on error
      setImages([...originalImages]);
    } finally {
      setLoading(false);
    }
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
              getApiUrl("api/books/upload-image"),
              formData,
              {
                headers: { Authorization: `Bearer ${token}` }, // Include token in headers
              }
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
        getApiUrl("api/ssa/create"),
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
        .get(`/api/ssa/by-book/${selectedBookId}`)
        .then((res) => {
          if (res.data && res.data.images && res.data.images.length > 0) {
            setExistingSSA(res.data);
            setTitle(res.data.title);
            const imageData = res.data.images.map((img, idx) => ({
              id: `${Date.now()}-${idx}`,
              file: null,
              preview: img.imageUrl.startsWith("/uploads")
                ? getImageUrl(img.imageUrl)
                : img.imageUrl,
              originalId: img.id
            }));
            setImages(imageData);
            setOriginalImages([...imageData]);
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
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
      <TeacherNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-32">
        <Modal {...modal} onClose={() => setModal({ ...modal, open: false })} />
        
        {/* Floating decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl"></div>
        </div>

        {/* Enhanced Header Section */}
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
              {passedBookId && (
                <button 
                  onClick={goBack} 
                className="group flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-300 hover:scale-105"
                >
                <ChevronLeft size={20} className="text-blue-600 group-hover:text-blue-700" />
                <span className="font-semibold text-blue-600 group-hover:text-blue-700">Back to Book</span>
                </button>
              )}
            
            {/* Decorative elements */}
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              <Star className="text-purple-500" size={16} />
              <Heart className="text-red-400" size={16} />
            </div>
          </div>
          
          {/* Professional Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                      {existingSSA ? "Story Sequencing Activity" : "Create Story Sequencing Activity"}
                    </h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">Activity Type:</span>
                      <span className="font-semibold text-gray-800">Interactive Story Sequencing</span>
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex items-center space-x-3">
              {existingSSA && !isEditMode && (
                <button
                  onClick={handleEditMode}
                      className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                >
                      <Edit3 size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-semibold">Edit Positions</span>
                </button>
              )}
              {existingSSA && isEditMode && (
                    <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                        className={`group px-6 py-3 rounded-xl flex items-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    } text-white`}
                  >
                        <Save size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="font-semibold">{loading ? "Saving..." : "Save"}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                        className="group px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                  >
                        <X size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-semibold">Cancel</span>
                  </button>
                </div>
              )}
              <button
                    className="group px-4 py-2 bg-white/20 backdrop-blur-sm text-purple-600 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                onClick={() => setShowHelp(!showHelp)}
              >
                    <Info size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-semibold">Help</span>
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Info size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-800">
                  How to create a Story Sequencing Activity
            </h3>
              </div>
              <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">{passedBookId ? "✓" : "1."}</span>
                  <span>{passedBookId ? "Book already selected." : "Select a book from the dropdown."}</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Upload story images in chronological order.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Drag and drop images to reorder them as needed.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">4.</span>
                  <span>Click "Create Activity" when ready.</span>
                </li>
            </ol>
            {existingSSA && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Star size={16} className="text-yellow-500 mr-2" />
                    <p className="font-semibold text-blue-800">Editing Mode</p>
                  </div>
                  <p className="text-blue-700 text-sm mb-1">Each book can only have one Story Sequencing Activity.</p>
                  <p className="text-blue-700 text-sm">To edit image positions: Click "Edit Positions", drag images to reorder, then click "Save".</p>
              </div>
            )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Loading your activity...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we prepare everything</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Only show book selection if no book ID was passed */}
            {!passedBookId && !existingSSA && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Book size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Select Book</h3>
                      <p className="text-sm text-gray-600">Choose the book for your sequencing activity</p>
                    </div>
                  </div>
                <select
                  value={selectedBookId}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setSelectedBookId(selected);
                    const book = books.find((b) => b.bookID.toString() === selected);
                    if (book) setTitle(book.title);
                  }}
                  disabled={loading}
                    className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-700 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-300'}`}
                >
                  <option value="">-- Choose a Book --</option>
                  {books.map((book) => (
                    <option key={book.bookID} value={book.bookID}>
                      {book.title} {book.hasSSA ? " (Has SSA)" : ""}
                    </option>
                  ))}
                </select>
                </div>
              </div>
            )}

            {/* Show selected book info if a book ID was passed */}
            {passedBookId && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Book size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Selected Book</h3>
                      <p className="text-sm text-gray-600">Book chosen for sequencing activity</p>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="font-semibold text-gray-800">{passedBookTitle || "Book #" + passedBookId}</span>
                    </div>
                </div>
                </div>
              </div>
            )}

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Activity Title</h3>
                    <p className="text-sm text-gray-600">Give your sequencing activity a descriptive name</p>
                  </div>
                </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={existingSSA}
                  className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-700 font-medium ${existingSSA ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-purple-300'}`}
                  placeholder="Enter activity title (e.g., 'Three Little Pigs - Sequencing Activity')"
              />
              </div>
            </div>

            {!existingSSA && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Camera size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Upload Story Images</h3>
                        <p className="text-sm text-gray-600">Add images for each step in your story sequence</p>
                      </div>
                    </div>
                    <Sparkles size={24} className="text-yellow-500" />
                  </div>
                  
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Upload size={32} className="text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Drop Your Images Here</h4>
                      <p className="mb-2 text-sm text-gray-600 max-w-md">
                        Upload images for each step in the story sequence. Students will arrange them in chronological order.
                      </p>
                      <p className="mb-6 text-xs text-gray-500">
                        Maximum file size: 5MB • Supported formats: JPEG, PNG, GIF, WebP
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
                        className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Upload size={18} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Select Images</span>
                  </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">
                        {images.length > 0
                          ? `${images.length} image${images.length === 1 ? '' : 's'} selected`
                          : "No images selected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <GripVertical size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                  {existingSSA ? (isEditMode ? "Edit" : "View") : "Arrange"} Images in Story Sequence
                        </h3>
                        <p className="text-sm text-gray-600">
                          {existingSSA ? (isEditMode ? "Drag images to reorder the story sequence" : "Current story sequence order") : "Drag and drop to arrange your story images"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="text-yellow-400" size={20} />
                      <Heart className="text-red-400" size={20} />
                    </div>
                  </div>
                  
                {existingSSA && isEditMode && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <Edit3 size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">Edit Mode Active</p>
                          <p className="text-blue-700 text-sm">Drag and drop images to change their positions in the story sequence.</p>
                        </div>
                      </div>
                  </div>
                )}
                  
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="imageList" direction="horizontal">
                    {(provided) => (
                      <div
                          className="flex gap-6 overflow-x-auto pb-6 min-h-[200px]"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {images.map((img, index) => (
                          <Draggable
                            key={img.id}
                            draggableId={img.id}
                            index={index}
                            isDragDisabled={existingSSA && !isEditMode}
                          >
                              {(provided, snapshot) => (
                                <div
                                  className={`relative border-2 rounded-2xl overflow-hidden bg-white shadow-lg group w-48 transition-all duration-300 hover:shadow-xl ${
                                    (existingSSA && !isEditMode) 
                                      ? 'cursor-default border-gray-200' 
                                      : 'cursor-move border-purple-200 hover:border-purple-400'
                                  } ${
                                    snapshot.isDragging 
                                      ? 'opacity-100 transform rotate-2 scale-110 shadow-2xl border-purple-500 bg-white z-50' 
                                      : ''
                                  }`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    ...(snapshot.isDragging && {
                                      transform: provided.draggableProps.style?.transform,
                                    }),
                                  }}
                                >
                                  {/* Remove button (top-right) - only show when creating new */}
                                {!existingSSA && (
                                    <button
                                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer z-10 transition-all duration-300 hover:scale-110 shadow-lg"
                                    onClick={() => removeImage(img.id)}
                                      title="Remove image"
                                  >
                                      <Trash2 size={16} />
                                    </button>
                                )}

                                  {/* Image */}
                                  <div className="relative">
                                <img
                                  src={img.preview}
                                  alt={`Step ${index + 1}`}
                                      className="w-full h-40 object-cover"
                                    />
                                    {/* Position overlay */}
                                    <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                      #{index + 1}
                                    </div>
                                  </div>

                                  {/* Position info */}
                                  <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100">
                                    <div className="text-center">
                                      <p className="text-sm font-semibold text-gray-700">
                                  Position {index + 1}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {existingSSA ? (isEditMode ? "Drag to reorder" : "Story sequence") : "Story sequence"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Drag indicator */}
                                  {!(existingSSA && !isEditMode) && (
                                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200">
                                      <GripVertical size={14} className="text-purple-600" />
                                </div>
                                  )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                          {/* Enhanced placeholder styling */}
                          <div className="flex-shrink-0 w-48 h-48 border-2 border-dashed border-purple-300 rounded-2xl bg-purple-50/50 flex items-center justify-center opacity-0 pointer-events-none">
                            <div className="text-center">
                              <GripVertical size={32} className="text-purple-400 mx-auto mb-2" />
                              <p className="text-sm text-purple-500 font-medium">Drop here</p>
                            </div>
                          </div>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                </div>
              </div>
            )}

            {!existingSSA && (
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedBookId || images.length === 0}
                  className={`group px-12 py-4 text-white font-bold rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ${
                    loading || !selectedBookId || images.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Creating Activity...</span>
                    </>
                  ) : (
                    <>
                      <Target size={20} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Create Story Sequencing Activity</span>
                    </>
                  )}
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