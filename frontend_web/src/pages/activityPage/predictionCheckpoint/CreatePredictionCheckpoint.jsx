import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Book,
  Info,
  Upload,
  XCircle,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
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
  Wand2,
  GripVertical,
  Trash2
} from "lucide-react";
import axios from "axios";
import { getApiUrl } from "../../../utils/apiConfig";
import TeacherNav from "../../../components/TeacherNav";

const Modal = ({ open, onClose, type, message }) => {

  if (!open) return null;
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "warning"
      ? AlertCircle
      : XCircle;
  const color =
    type === "success"
      ? "text-green-600"
      : type === "warning"
      ? "text-amber-500"
      : "text-red-600";

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


const CreatePredictionCheckpoint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedBookId = location.state?.bookId;
  const passedBookTitle = location.state?.bookTitle;

  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(passedBookId || "");
  const [title, setTitle] = useState(
    passedBookTitle ? `${passedBookTitle} - Prediction Checkpoint` : ""
  );
  const [storyImages, setStoryImages] = useState([]);
  const [optionImages, setOptionImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const fileInputRef = useRef(null);
  const optionFileInputRef = useRef(null);
  const [bookPageCount, setBookPageCount] = useState(0);
  const [existingCheckpoint, setExistingCheckpoint] = useState(null);


  const [isEditMode, setIsEditMode] = useState(false);
  const [originalStoryImages, setOriginalStoryImages] = useState([]);
  const [originalOptionImages, setOriginalOptionImages] = useState([]);

  // Native drag-and-drop state
  const [draggingStoryIndex, setDraggingStoryIndex] = useState(null);
  const [draggingOptionIndex, setDraggingOptionIndex] = useState(null);
  
  useEffect(() => {
    if (selectedBookId) {
      // Fetch existing prediction checkpoint
      const token = localStorage.getItem("token");
      setLoading(true);
      axios
        .get(`/api/prediction-checkpoints/by-book/${selectedBookId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          if (res.data) {
            setExistingCheckpoint(res.data);
            setTitle(res.data.title);
            setPageNumber(res.data.pageNumber.toString());
            // Set story images
            setStoryImages(
              res.data.sequenceImages
                .sort((a, b) => a.position - b.position)
                .map((img, idx) => ({
                  id: `${Date.now()}-${idx}`,
                  file: null,
                  preview: img.imageUrl.startsWith("/uploads")
                    ? getImageUrl(img.imageUrl)
                    : img.imageUrl,
                  originalId: img.id,
                  position: img.position
                }))
            );
            // Set option images - sort by isCorrect so correct option appears first
            const sortedOptions = [...res.data.options].sort((a, b) => 
              a.isCorrect === b.isCorrect ? 0 : (a.isCorrect ? -1 : 1)
            );
            setOptionImages(
              sortedOptions.map((opt, idx) => ({
                id: `${Date.now()}-option-${idx}`,
                file: null,
                preview: opt.imageUrl.startsWith("/uploads")
                  ? getImageUrl(opt.imageUrl)
                  : opt.imageUrl,
                originalId: opt.id,
                isCorrect: opt.isCorrect
              }))
            );
          }
        })
        .catch((err) => {
          console.log("No existing prediction checkpoint or error occurred:", err.response?.data);
          if (err.response?.status === 403) {
            setModal({
              open: true,
              message: "You don't have permission to view this content.",
              type: "error"
            });
            navigate("/login");
            return;
          }
          setExistingCheckpoint(null);
        })
        .finally(() => {
          setLoading(false);
        });

      // If we have books data, set the title based on the selected book
      const selected = books.find(
        (b) => b.bookID.toString() === selectedBookId.toString()
      );
      if (selected) {
        setTitle(`${selected.title} - Prediction Checkpoint`);
      }
      
      // Always fetch pages when selectedBookId is available, regardless of books array
      axios
        .get(`/api/pages/${selectedBookId}`)
        .then((response) => {
          setBookPageCount(response.data.length || 0);
        })
        .catch((error) => {
          console.error("Error fetching page count:", error);
          setBookPageCount(0);
        });
    }
  }, [selectedBookId, books]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const handleImageChange = (e, isOption = false) => {
    const selectedFiles = Array.from(e.target.files);
    const invalidFiles = [];
    const validFiles = [];

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (exceeds 5MB size limit)`);
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} (not a supported image format)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setModal({
        open: true,
        message: `The following files couldn't be added:\n${invalidFiles.join(
          "\n"
        )}`,
        type: "warning",
      });
    }

    if (validFiles.length > 0) {
      const newImages = validFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
      }));

      if (isOption) {
        setOptionImages((prev) => [...prev, ...newImages]);
      } else {
        setStoryImages((prev) => [...prev, ...newImages]);
      }
    }

    if (isOption) {
      optionFileInputRef.current.value = "";
    } else {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (idToRemove, isOption = false) => {
    if (isOption) {
      setOptionImages(optionImages.filter((img) => img.id !== idToRemove));
    } else {
      setStoryImages(storyImages.filter((img) => img.id !== idToRemove));
    }
  };

  const [pageNumber, setPageNumber] = useState("");

  const handleSubmit = async () => {
    if (
      !selectedBookId ||
      !title ||
      !pageNumber ||
      storyImages.length === 0 ||
      optionImages.length === 0
    ) {
      setModal({
        open: true,
        message: "Please fill all fields and add both story and option images.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Upload all images first
      const uploadImage = async (file) => {
        // Convert file to base64 (like other upload functions)
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const requestData = {
          file: base64Data,
          filename: file.name,
          contentType: file.type,
          uploadType: "prediction"
        };

        const response = await fetch(
          getApiUrl("api/books/upload-image"),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestData)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        return await response.text();
      };

      // Upload story images
      const storyImageUrls = await Promise.all(
        storyImages.map((img) => uploadImage(img.file))
      );

      // Upload option images
      const optionImageUrls = await Promise.all(
        optionImages.map((img) => uploadImage(img.file))
      );

      // Create the prediction checkpoint
      await axios.post(
        getApiUrl("api/prediction-checkpoints"),
        {
          title,
          bookId: selectedBookId,
          pageNumber: parseInt(pageNumber),
          sequenceImages: storyImageUrls.map((url, index) => ({
            imageUrl: url,
            position: index + 1,
          })),
          predictionOptions: optionImageUrls.map((url, index) => ({
            imageUrl: url,
            isCorrect: index === 0,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setModal({
        open: true,
        message: "Prediction Checkpoint created successfully! 🎉",
        type: "success",
      });

      // Reset form
      setTitle("");
      setStoryImages([]);
      setOptionImages([]);
      if (!passedBookId) {
        setSelectedBookId("");
      }
    } catch (error) {
      console.error("Error creating prediction checkpoint:", error);
      setModal({
        open: true,
        message: "Failed to create prediction checkpoint. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add goBack function
  const goBack = () => {
    navigate(-1);
  };

  const handleEditMode = () => {
    setOriginalStoryImages([...storyImages]);
    setOriginalOptionImages([...optionImages]);
    setIsEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setStoryImages([...originalStoryImages]);
    setOptionImages([...originalOptionImages]);
    setIsEditMode(false);
  };
  
  const handleSaveEdit = async () => {
    if (!existingCheckpoint) return;
    if (storyImages.length === 0 || optionImages.length === 0) return;
  
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storyPayload = storyImages.map((img, idx) => ({
        id: img.originalId,
        position: idx + 1,
      }));
      const optionPayload = optionImages.map((img, idx) => ({
        id: img.originalId,
        isCorrect: idx === 0,
      }));
  
      await axios.put(
        `/api/prediction-checkpoints/update-positions/${existingCheckpoint.id}`,
        { storyImages: storyPayload, optionImages: optionPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setOriginalStoryImages([...storyImages]);
      setOriginalOptionImages([...optionImages]);
      setIsEditMode(false);
      setModal({ open: true, message: "✅ Positions updated successfully!", type: "success" });
    } catch (err) {
      console.error("Failed to update positions:", err);
      setModal({
        open: true,
        message: `❌ Failed to update positions: ${err.response?.data?.message || err.message}`,
        type: "error",
      });
      setStoryImages([...originalStoryImages]);
      setOptionImages([...originalOptionImages]);
    } finally {
      setLoading(false);
    }
  };

  const onStoryDragStart = (index) => setDraggingStoryIndex(index);
  const onStoryDragOver = (e) => e.preventDefault();
  const onStoryDrop = (index) => {
    if (draggingStoryIndex === null || (!isEditMode && existingCheckpoint)) return;
    const reordered = [...storyImages];
    const [moved] = reordered.splice(draggingStoryIndex, 1);
    reordered.splice(index, 0, moved);
    setStoryImages(reordered);
    setDraggingStoryIndex(null);
  };

  const onOptionDragStart = (index) => setDraggingOptionIndex(index);
  const onOptionDragOver = (e) => e.preventDefault();
  const onOptionDrop = (index) => {
    if (draggingOptionIndex === null || (!isEditMode && existingCheckpoint)) return;
    const reordered = [...optionImages];
    const [moved] = reordered.splice(draggingOptionIndex, 1);
    reordered.splice(index, 0, moved);
    setOptionImages(reordered);
    setDraggingOptionIndex(null);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
      <TeacherNav />
      </div>
      <Modal {...modal} onClose={() => setModal({ ...modal, open: false })} />

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-32">
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                      {existingCheckpoint ? "Prediction Checkpoint" : "Create Prediction Checkpoint"}
                    </h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">Activity Type:</span>
                      <span className="font-semibold text-blue-800">Interactive Prediction Challenge</span>
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex items-center space-x-3">
              {existingCheckpoint && !isEditMode && (
                <button
                  onClick={handleEditMode}
                      className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                >
                      <Edit3 size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-semibold">Edit Positions</span>
                </button>
              )}
              {existingCheckpoint && isEditMode && (
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
                 className="group px-4 py-2 bg-white/20 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
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
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <Info size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-800">
                  How to create a Prediction Checkpoint
             </h3>
              </div>
              <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">{passedBookId ? "✓" : "1."}</span>
                  <span>{passedBookId ? "Book already selected." : "Select a book from the dropdown."}</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Enter the page number where this checkpoint occurs (not the last page).</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Upload story sequence images that lead up to the prediction point.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">4.</span>
                  <span>Upload prediction options (first image will be the correct answer).</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">5.</span>
                  <span>Click "Create Prediction Checkpoint" when ready.</span>
                </li>
            </ol>
              {existingCheckpoint && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Star size={16} className="text-yellow-500 mr-2" />
                    <p className="font-semibold text-blue-800">Editing Mode</p>
                  </div>
                  <p className="text-blue-700 text-sm mb-1">Each book can only have one Prediction Checkpoint.</p>
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
              {/* Book Selection Section */}
               {!passedBookId && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Book size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-800">Select Book</h3>
                        <p className="text-sm text-blue-600">Choose the book for your prediction checkpoint</p>
                      </div>
                    </div>
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      disabled={loading}
                      className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-700 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}`}
                    >
                      <option value="">-- Choose a Book --</option>
                      {books.map((book) => (
                        <option key={book.bookID} value={book.bookID}>
                          {book.title}
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
                        <p className="text-sm text-gray-600">Book chosen for prediction checkpoint</p>
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

            {/* Activity Title Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Activity Title</h3>
                    <p className="text-sm text-blue-600">Auto-generated title for your prediction checkpoint</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  disabled
                  className="w-full border-2 border-blue-200 p-4 rounded-xl bg-blue-50/70 backdrop-blur-sm text-blue-800 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Page Number Selection Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <Target size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">Trigger Page Number</h3>
                    <p className="text-sm text-blue-600">Select the page where this prediction checkpoint occurs (not the last page)</p>
                  </div>
                </div>
                <select
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  disabled={existingCheckpoint}
                  className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-gray-700 font-medium ${existingCheckpoint ? 'bg-blue-50/70 cursor-not-allowed' : 'hover:border-blue-300'}`}
                >
                  <option value="">-- Select Page --</option>
                  {[...Array(bookPageCount)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
                {bookPageCount > 0 && (
                  <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-blue-800">
                        {bookPageCount} total pages available. Last page (Page {bookPageCount}) cannot be selected.
                      </span>
               </div>
                    </div>
                  )}
             </div>
           </div>

          {/* Story Images Section */}
            {!existingCheckpoint && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Camera size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Upload Story Sequence Images</h3>
                        <p className="text-sm text-gray-600">Add images that lead up to the prediction point</p>
                      </div>
                    </div>
                    <Sparkles size={24} className="text-yellow-500" />
                  </div>
                  
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Upload size={32} className="text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Drop Your Story Images Here</h4>
                      <p className="mb-2 text-sm text-gray-600 max-w-md">
                        Upload images that show the story sequence leading up to the prediction point.
                      </p>
                      <p className="mb-6 text-xs text-gray-500">
                        Maximum file size: 5MB • Supported formats: JPEG, PNG, GIF, WebP
                      </p>
                      
                      <input
                        type="file"
                        id="story-image-upload"
                        ref={fileInputRef}
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, false)}
                        className="hidden"
                      />
                      <label
                        htmlFor="story-image-upload"
                        className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Upload size={18} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Select Story Images</span>
            </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">
                        {storyImages.length > 0
                          ? `${storyImages.length} story image${storyImages.length === 1 ? '' : 's'} selected`
                          : "No story images selected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Story Images Display Section */}
            {storyImages.length > 0 && (
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
                          {existingCheckpoint ? (isEditMode ? "Edit" : "View") : "Arrange"} Story Sequence Images
                        </h3>
                        <p className="text-sm text-gray-600">
                          {existingCheckpoint ? (isEditMode ? "Drag images to reorder the story sequence" : "Current story sequence order") : "Drag and drop to arrange your story images"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="text-yellow-400" size={20} />
                      <Heart className="text-red-400" size={20} />
                    </div>
                  </div>
                  
                  {existingCheckpoint && isEditMode && (
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
                  
                  <div className="flex gap-6 overflow-x-auto pb-6 min-h-[200px]">
              {storyImages.map((img, index) => (
                <div
                  key={img.id}
                        className={`relative border-2 rounded-2xl overflow-hidden bg-white shadow-lg group w-48 transition-all duration-300 hover:shadow-xl flex-shrink-0 ${
                          (existingCheckpoint && !isEditMode) 
                            ? 'cursor-default border-gray-200' 
                            : 'cursor-move border-purple-200 hover:border-purple-400'
                  }`}
                  draggable={!(existingCheckpoint && !isEditMode)}
                  onDragStart={() => onStoryDragStart(index)}
                  onDragOver={onStoryDragOver}
                  onDrop={() => onStoryDrop(index)}
                  title={existingCheckpoint && !isEditMode ? "" : "Drag to reorder"}
                >
                        {/* Remove button (top-right) - only show when creating new */}
                        {!existingCheckpoint && (
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
                    alt={`Story ${index + 1}`}
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
                              {existingCheckpoint ? (isEditMode ? "Drag to reorder" : "Story sequence") : "Story sequence"}
                            </p>
                  </div>
                        </div>
                        
                        {/* Drag indicator */}
                        {!(existingCheckpoint && !isEditMode) && (
                          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200">
                            <GripVertical size={14} className="text-purple-600" />
                          </div>
                  )}
                </div>
              ))}
                  </div>
                </div>
              </div>
            )}

            {/* Option Images Section */}
              {!existingCheckpoint && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Target size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Upload Prediction Options</h3>
                        <p className="text-sm text-gray-600">Add possible outcomes for students to predict</p>
                      </div>
                    </div>
                    <Wand2 size={24} className="text-green-500" />
                  </div>
                  
                  <div className="border-2 border-dashed border-green-300 rounded-2xl p-8 text-center bg-gradient-to-br from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Upload size={32} className="text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-2">Drop Your Prediction Options Here</h4>
                      <p className="mb-2 text-sm text-gray-600 max-w-md">
                        Upload images showing possible outcomes. The first image will be marked as the correct answer.
                      </p>
                      <p className="mb-6 text-xs text-gray-500">
                        Maximum file size: 5MB • Supported formats: JPEG, PNG, GIF, WebP
                      </p>
                      
                  <input
                    type="file"
                        id="option-image-upload"
                        ref={optionFileInputRef}
                        multiple
                    accept="image/*"
                        onChange={(e) => handleImageChange(e, true)}
                    className="hidden"
                      />
                      <label
                        htmlFor="option-image-upload"
                        className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Upload size={18} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Select Prediction Options</span>
                </label>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white/50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">
                        {optionImages.length > 0
                          ? `${optionImages.length} prediction option${optionImages.length === 1 ? '' : 's'} selected`
                          : "No prediction options selected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Option Images Display Section */}
            {optionImages.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <GripVertical size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {existingCheckpoint ? (isEditMode ? "Edit" : "View") : "Arrange"} Prediction Options
                        </h3>
                        <p className="text-sm text-gray-600">
                          {existingCheckpoint ? (isEditMode ? "Drag images to reorder options" : "Current prediction options order") : "Drag and drop to arrange your prediction options (first = correct answer)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="text-green-500" size={20} />
                      <Star className="text-yellow-400" size={20} />
            </div>
          </div>

                  {existingCheckpoint && isEditMode && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <Edit3 size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">Edit Mode Active</p>
                          <p className="text-green-700 text-sm">Drag and drop images to change their positions. The first option will be the correct answer.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-6 overflow-x-auto pb-6 min-h-[200px]">
              {optionImages.map((img, index) => (
                <div
                  key={img.id}
                        className={`relative border-2 rounded-2xl overflow-hidden bg-white shadow-lg group w-48 transition-all duration-300 hover:shadow-xl flex-shrink-0 ${
                          (existingCheckpoint && !isEditMode) 
                            ? 'cursor-default border-gray-200' 
                            : 'cursor-move border-green-200 hover:border-green-400'
                  }`}
                  draggable={!(existingCheckpoint && !isEditMode)}
                  onDragStart={() => onOptionDragStart(index)}
                  onDragOver={onOptionDragOver}
                  onDrop={() => onOptionDrop(index)}
                  title={existingCheckpoint && !isEditMode ? "" : "Drag to reorder"}
                >
                        {/* Correct answer indicator */}
                  {img.isCorrect && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            ✓ Correct
                    </div>
                  )}

                        {/* Remove button (top-right) - only show when creating new */}
                  {!existingCheckpoint && (
                    <button
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer z-10 transition-all duration-300 hover:scale-110 shadow-lg"
                      onClick={() => removeImage(img.id, true)}
                            title="Remove image"
                    >
                            <Trash2 size={16} />
                    </button>
                  )}

                        {/* Image */}
                        <div className="relative">
                          <img
                            src={img.preview}
                            alt={`Option ${index + 1}`}
                            className="w-full h-40 object-cover"
                          />
                          {/* Position overlay */}
                          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Option info */}
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                              {img.isCorrect ? "Correct Answer" : `Option ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {existingCheckpoint ? (isEditMode ? "Drag to reorder" : "Prediction option") : "Prediction option"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Drag indicator */}
                        {!(existingCheckpoint && !isEditMode) && (
                          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200">
                            <GripVertical size={14} className="text-green-600" />
                          </div>
              )}
            </div>
                    ))}
          </div>
                </div>
              </div>
            )}

          {!existingCheckpoint && (
              <div className="flex justify-center">
            <button
              onClick={handleSubmit}
                  disabled={loading || !selectedBookId || storyImages.length === 0 || optionImages.length === 0}
                  className={`group px-12 py-4 text-white font-bold rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ${
                    loading || !selectedBookId || storyImages.length === 0 || optionImages.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Creating Checkpoint...</span>
                    </>
                  ) : (
                    <>
                      <Target size={20} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      <span>Create Prediction Checkpoint</span>
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

export default CreatePredictionCheckpoint;