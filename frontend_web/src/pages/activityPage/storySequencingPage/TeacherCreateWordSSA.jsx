import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Book,
  GripVertical,
  Trash2,
  Info,
  XCircle,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  X,
  Sparkles,
  Star,
  Heart,
  Target,
  FileText,
  Plus,
  ChevronLeft,
  Wand2,
  Type
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { getAccessToken } from "../../../api/api";
import { getApiUrl } from "../../../utils/apiConfig";
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

const TeacherCreateWordSSA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedBookId = location.state?.bookId;
  const passedBookTitle = location.state?.bookTitle;
  
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(passedBookId || "");
  const [title, setTitle] = useState(passedBookTitle ? `${passedBookTitle} - Word Sequencing Activity` : "");
  const [texts, setTexts] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [existingWSSA, setExistingWSSA] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalTexts, setOriginalTexts] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
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
    const token = getAccessToken();
    
    axios
      .get(`/api/wssa/by-book/${selectedBookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data) {
          setExistingWSSA(res.data);
          setTitle(res.data.title);
          const textData = res.data.texts.map((text, idx) => ({
            id: `${Date.now()}-${idx}`,
            textContent: text.textContent,
            originalId: text.id
          }));
          setTexts(textData);
          setOriginalTexts([...textData]);
        }
      })
      .catch((err) => {
        console.log("No existing WSSA found or error occurred:", err.response?.data);
        if (err.response?.status === 403) {
          setModal({
            open: true,
            message: "You don't have permission to view this content. Please make sure you are logged in as a teacher or admin.",
            type: "error"
          });
          navigate("/login");
          return;
        }
        setExistingWSSA(null);
        if (passedBookTitle) {
          setTitle(`${passedBookTitle} - Word Sequencing Activity`);
        }
        setTexts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedBookId, passedBookTitle, navigate]);

  const handleAddText = () => {
    if (!currentText.trim()) {
      setModal({
        open: true,
        message: "Please enter some text before adding.",
        type: "warning"
      });
      return;
    }

    if (existingWSSA && !isEditMode) return;

    const newText = {
      id: `${Date.now()}-${texts.length}`,
      textContent: currentText.trim(),
    };
    setTexts([...texts, newText]);
    setCurrentText("");
  };

  const removeText = (idToRemove) => {
    if (existingWSSA && !isEditMode) return;
    setTexts(texts.filter((text) => text.id !== idToRemove));
  };

  const onDragEnd = (result) => {
    if ((!isEditMode && existingWSSA) || !result.destination) return;
    
    const reordered = Array.from(texts);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTexts(reordered);
  };

  const resetForm = () => {
    setTitle(passedBookTitle ? `${passedBookTitle} - Word Sequencing Activity` : "");
    setTexts([]);
    setCurrentText("");
    if (!passedBookId) {
      setSelectedBookId("");
    }
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setTexts([...originalTexts]);
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!existingWSSA || texts.length === 0) return;

    setLoading(true);
    try {
      const token = getAccessToken();
      
      const updatedTexts = texts.map((text, index) => ({
        id: text.originalId,
        correctPosition: index + 1
      }));

      // Note: We'll need to add an update endpoint in the backend
      // For now, we'll recreate the activity
      await axios.post(
        `/api/wssa/create`,
        {
          title: existingWSSA.title,
          bookId: selectedBookId,
          texts: texts.map((text, index) => ({
            textContent: text.textContent,
            correctPosition: index + 1
          }))
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOriginalTexts([...texts]);
      setIsEditMode(false);
      
      setModal({
        open: true,
        message: "✅ Text positions updated successfully!",
        type: "success"
      });
    } catch (err) {
      console.error("Failed to update text positions:", err);
      setModal({
        open: true,
        message: `❌ Failed to update text positions: ${err.response?.data?.message || err.message}`,
        type: "error"
      });
      setTexts([...originalTexts]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBookId || !title || texts.length === 0) {
      setModal({
        open: true,
        message: "Please fill all fields and add at least one story part.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const token = getAccessToken();

      const textData = texts.map((text, idx) => ({
        textContent: text.textContent,
        correctPosition: idx + 1
      }));

      await axios.post(
        getApiUrl("api/wssa/create"),
        {
          title,
          bookId: selectedBookId,
          texts: textData
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setModal({
        open: true,
        message: "✅ Word Story Sequencing Activity created successfully!",
        type: "success",
      });
      
      // Refresh the data after creating
      axios
        .get(`/api/wssa/by-book/${selectedBookId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          if (res.data && res.data.texts && res.data.texts.length > 0) {
            setExistingWSSA(res.data);
            setTitle(res.data.title);
            const textData = res.data.texts.map((text, idx) => ({
              id: `${Date.now()}-${idx}`,
              textContent: text.textContent,
              originalId: text.id
            }));
            setTexts(textData);
            setOriginalTexts([...textData]);
          }
        });
    } catch (err) {
      console.error("WSSA creation failed:", err);
      setModal({
        open: true,
        message: `❌ ${err.response?.data?.message || err.message || "Failed to create activity."}`,
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
      <div className="w-full">
        <TeacherNav />
      </div>

      <div className="p-6 max-w-7xl mx-auto pt-32">
        <Modal {...modal} onClose={() => setModal({ ...modal, open: false })} />
        
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl"></div>
        </div>

        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            {passedBookId && (
              <button 
                onClick={goBack} 
                className="group flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-300 hover:scale-105"
              >
                <ChevronLeft size={20} className="text-blue-600 group-hover:text-blue-700" />
                <span className="font-semibold text-blue-600 group-hover:text-blue-700">Back to Book</span>
              </button>
            )}
            
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              <Star className="text-purple-500" size={16} />
              <Heart className="text-red-400" size={16} />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Type size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                      {existingWSSA ? "Word Story Sequencing Activity" : "Create Word Story Sequencing Activity"}
                    </h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">Activity Type:</span>
                      <span className="font-semibold text-gray-800">Text-Based Story Sequencing</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {existingWSSA && !isEditMode && (
                    <button
                      onClick={handleEditMode}
                      className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                    >
                      <Edit3 size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-semibold">Edit Positions</span>
                    </button>
                  )}
                  {existingWSSA && isEditMode && (
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
                  How to create a Word Story Sequencing Activity
                </h3>
              </div>
              <ol className="list-decimal pl-6 space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">{passedBookId ? "✓" : "1."}</span>
                  <span>{passedBookId ? "Book already selected." : "Select a book from the dropdown."}</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">2.</span>
                  <span>Enter story parts (sentences or paragraphs) in chronological order.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">3.</span>
                  <span>Drag and drop text parts to reorder them as needed.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">4.</span>
                  <span>Click "Create Activity" when ready.</span>
                </li>
              </ol>
              {existingWSSA && (
                <div className="mt-4 p-4 bg-white/50 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Star size={16} className="text-yellow-500 mr-2" />
                    <p className="font-semibold text-blue-800">Editing Mode</p>
                  </div>
                  <p className="text-blue-700 text-sm mb-1">Each book can only have one Word Story Sequencing Activity.</p>
                  <p className="text-blue-700 text-sm">To edit text positions: Click "Edit Positions", drag texts to reorder, then click "Save".</p>
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
            {!passedBookId && !existingWSSA && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Book size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Select Book</h3>
                      <p className="text-sm text-gray-600">Choose the book for your word sequencing activity</p>
                    </div>
                  </div>
                  <select
                    value={selectedBookId}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setSelectedBookId(selected);
                      const book = books.find((b) => b.bookID.toString() === selected);
                      if (book) setTitle(`${book.title} - Word Sequencing Activity`);
                    }}
                    disabled={loading}
                    className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-700 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-300'}`}
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
                      <p className="text-sm text-gray-600">Book chosen for word sequencing activity</p>
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
                    <p className="text-sm text-gray-600">Give your word sequencing activity a descriptive name</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={existingWSSA}
                  className={`w-full border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-700 font-medium ${existingWSSA ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-purple-300'}`}
                  placeholder="Enter activity title (e.g., 'Three Little Pigs - Word Sequencing Activity')"
                />
              </div>
            </div>

            {!existingWSSA && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <Type size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Add Story Parts</h3>
                        <p className="text-sm text-gray-600">Enter text parts for each step in your story sequence</p>
                      </div>
                    </div>
                    <Sparkles size={24} className="text-yellow-500" />
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <textarea
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleAddText();
                        }
                      }}
                      placeholder="Enter a story part (e.g., 'Once upon a time, there were three little pigs...')"
                      className="flex-1 border-2 border-gray-200 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-gray-700 font-medium min-h-[100px] resize-y"
                    />
                    <button
                      onClick={handleAddText}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                    >
                      <Plus size={20} className="mr-2" />
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Tip: Press Ctrl+Enter to quickly add text
                  </p>
                  
                  <div className="p-4 bg-white/50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700">
                        {texts.length > 0
                          ? `${texts.length} story part${texts.length === 1 ? '' : 's'} added`
                          : "No story parts added yet"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {texts.length > 0 && (
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
                          {existingWSSA ? (isEditMode ? "Edit" : "View") : "Arrange"} Story Parts in Sequence
                        </h3>
                        <p className="text-sm text-gray-600">
                          {existingWSSA ? (isEditMode ? "Drag texts to reorder the story sequence" : "Current story sequence order") : "Drag and drop to arrange your story parts"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="text-yellow-400" size={20} />
                      <Heart className="text-red-400" size={20} />
                    </div>
                  </div>
                  
                  {existingWSSA && isEditMode && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <Edit3 size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800">Edit Mode Active</p>
                          <p className="text-blue-700 text-sm">Drag and drop texts to change their positions in the story sequence.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="textList" direction="vertical">
                      {(provided) => (
                        <div
                          className="space-y-4"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {texts.map((text, index) => (
                            <Draggable
                              key={text.id}
                              draggableId={text.id}
                              index={index}
                              isDragDisabled={existingWSSA && !isEditMode}
                            >
                              {(provided, snapshot) => (
                                <div
                                  className={`relative border-2 rounded-2xl overflow-hidden bg-white shadow-lg group transition-all duration-300 hover:shadow-xl ${
                                    (existingWSSA && !isEditMode) 
                                      ? 'cursor-default border-gray-200' 
                                      : 'cursor-move border-purple-200 hover:border-purple-400'
                                  } ${
                                    snapshot.isDragging 
                                      ? 'opacity-100 transform rotate-1 scale-105 shadow-2xl border-purple-500 bg-white z-50' 
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
                                  {!existingWSSA && (
                                    <button
                                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer z-10 transition-all duration-300 hover:scale-110 shadow-lg"
                                      onClick={() => removeText(text.id)}
                                      title="Remove text"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}

                                  <div className="p-4">
                                    <div className="flex items-start gap-3">
                                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex-shrink-0">
                                        #{index + 1}
                                      </div>
                                      <p className="text-gray-800 text-sm font-medium leading-relaxed flex-1">
                                        {text.textContent}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {!(existingWSSA && !isEditMode) && (
                                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200">
                                      <GripVertical size={14} className="text-purple-600" />
                                    </div>
                                  )}
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
              </div>
            )}

            {!existingWSSA && (
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedBookId || texts.length === 0}
                  className={`group px-12 py-4 text-white font-bold rounded-2xl flex items-center transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ${
                    loading || !selectedBookId || texts.length === 0
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
                      <span>Create Word Story Sequencing Activity</span>
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

export default TeacherCreateWordSSA;

