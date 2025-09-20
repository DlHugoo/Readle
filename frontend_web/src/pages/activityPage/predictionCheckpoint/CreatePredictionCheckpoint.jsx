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
} from "lucide-react";
import axios from "axios";
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

  useEffect(() => {
    if (selectedBookId) {
      // Fetch existing prediction checkpoint
      const token = localStorage.getItem("token");
      setLoading(true);
      axios
        .get(`http://localhost:3000/api/prediction-checkpoints/by-book/${selectedBookId}`, {
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
                    ? `http://localhost:3000${img.imageUrl}`
                    : img.imageUrl,
                  originalId: img.id,
                  position: img.position
                }))
            );
            // Set option images
            setOptionImages(
              res.data.options.map((opt, idx) => ({
                id: `${Date.now()}-option-${idx}`,
                file: null,
                preview: opt.imageUrl.startsWith("/uploads")
                  ? `http://localhost:3000${opt.imageUrl}`
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
        .get(`http://localhost:3000/api/pages/${selectedBookId}`)
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadType", "prediction");

        const response = await axios.post(
          "http://localhost:3000/api/books/upload-image",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
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
        "http://localhost:3000/api/prediction-checkpoints",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav />
      <Modal {...modal} onClose={() => setModal({ ...modal, open: false })} />
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow pt-24">
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
                <span className="mr-2">🎯</span> 
                {existingCheckpoint ? "View" : "Create"} Prediction Checkpoint
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
              How to create a Prediction Checkpoint:
            </h3>
            <ol className="list-decimal pl-5 space-y-1 text-blue-800">
              <li>Select a book</li>
              <li>Enter a title for the checkpoint</li>
              <li>Enter the page number where this checkpoint occurs</li>
              <li>Upload story sequence images</li>
              <li>Upload prediction options</li>
              <li>Click Create when ready</li>
            </ol>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 gap-4">
              {!passedBookId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Book
                  </label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Choose a book...</option>
                    {books.map((book) => (
                      <option key={book.bookID} value={book.bookID}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Title (auto-filled)
                </label>
                <input
                  type="text"
                  value={title}
                  disabled
                  className="w-full p-2 border rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Page Number (Do not Select The last page of the book)
                </label>
                <select
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  disabled={existingCheckpoint}
                  className={`w-full p-2 border rounded-md ${existingCheckpoint ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select page...</option>
                  {[...Array(bookPageCount)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Story Images Section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Story Sequence Images
            </label>
            <div className="flex flex-wrap gap-4 mb-4">
              {storyImages.map((img, index) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.preview}
                    alt={`Story ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  {!existingCheckpoint && (
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              ))}
              {!existingCheckpoint && (
                <label className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleImageChange(e, false)}
                    accept="image/*"
                    className="hidden"
                    multiple
                  />
                  <Camera className="text-gray-400" size={32} />
                </label>
              )}
            </div>
          </div>

          {/* Option Images Section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Prediction Options (First image will be the correct answer)
            </label>
            <div className="flex flex-wrap gap-4 mb-4">
              {optionImages.map((img, index) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.preview}
                    alt="Option"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  {!existingCheckpoint && (
                    <button
                      onClick={() => removeImage(img.id, true)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                  {index === 0 && (
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </div>
              ))}
              {!existingCheckpoint && (
                <label className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    ref={optionFileInputRef}
                    onChange={(e) => handleImageChange(e, true)}
                    accept="image/*"
                    className="hidden"
                    multiple
                  />
                  <Camera className="text-gray-400" size={32} />
                </label>
              )}
            </div>
          </div>

          {!existingCheckpoint && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? "Creating..." : "Create Prediction Checkpoint"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePredictionCheckpoint;