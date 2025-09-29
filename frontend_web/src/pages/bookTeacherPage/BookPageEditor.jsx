import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from "../../components/TeacherNav";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
  Wand2,
  BookOpen,
  Sparkles,
  Star,
  Heart,
  Zap,
  Users,
  ArrowDown,
  Image,
  FileText,
  Play,
  Target,
  Brain,
} from "lucide-react";
// Add this import at the top if not already present
import { Link } from "react-router-dom";
import axios from "axios"; // Import axios
import AIImageGenerator from "../../components/AIImageGenerator";
import { getImageUrl } from "../../utils/apiConfig";

const BookPageEditor = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [pageContent, setPageContent] = useState("");
  const [pageImage, setPageImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // Add delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  // Add AI image generator modal state
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/uploads")) {
      return getImageUrl(url);
    }
    return url;
  };

  // Fetch book and its pages
  useEffect(() => {
    const fetchBookAndPages = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Fetch book details
        const bookResponse = await axios.get(`/api/books/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const bookData = bookResponse.data;
        setBook(bookData);

        // Fetch pages for this book
        const pagesResponse = await axios.get(`/api/pages/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const pagesData = pagesResponse.data;

        // Ensure each page has the bookId property for API calls and normalize imageUrl
        const pagesWithBookId = pagesData.map((page) => ({
          ...page,
          bookId: bookId,
          imageUrl: page.imageURL || page.imageUrl, // Normalize to imageUrl for component use
        }));

        setPages(pagesWithBookId);

        // If there are pages, set up the first page for viewing
        if (pagesWithBookId.length > 0) {
          setCurrentPageIndex(0);
          setPageContent(pagesWithBookId[0].content || "");
          setImagePreview(getFullImageUrl(pagesWithBookId[0].imageUrl) || null);
        }
      } catch (err) {
        console.error("Error fetching book data:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookAndPages();
  }, [bookId]);

  // Add these constants at the top of your component
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  // Update the handleImageChange function
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setModalMessage(`File "${file.name}" exceeds the maximum size of 5MB.`);
        setShowModal(true);
        e.target.value = ""; // Reset the file input
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setModalMessage(
          `File "${file.name}" is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`
        );
        setShowModal(true);
        e.target.value = ""; // Reset the file input
        return;
      }

      setPageImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setPageContent(pages[currentPageIndex - 1].content || "");
      setImagePreview(
        getFullImageUrl(
          pages[currentPageIndex - 1].imageUrl ||
            pages[currentPageIndex - 1].imageURL
        ) || null
      );
      setIsEditing(false);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setPageContent(pages[currentPageIndex + 1].content || "");
      setImagePreview(
        getFullImageUrl(
          pages[currentPageIndex + 1].imageUrl ||
            pages[currentPageIndex + 1].imageURL
        ) || null
      );
      setIsEditing(false);
    }
  };

  // Create a new page
  const createNewPage = async () => {
    // Validate that the book has all required fields
    if (!book) {
      setModalTitle("Error");
      setModalMessage("Book information is not available. Please try again.");
      setShowModal(true);
      return;
    }

    // Check for required book fields
    if (!book.title || !book.author || !book.genre || !book.difficultyLevel) {
      setModalTitle("Incomplete Book Information");
      setModalMessage(
        "The book is missing required information. Please make sure the book has a title, author, genre, and difficulty level before adding pages."
      );
      setShowModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/pages/${bookId}`,
        {
          bookId: bookId,
          pageNumber: pages.length + 1,
          content: "",
          imageUrl: null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newPage = response.data;
      // Add bookId to the new page for future API calls
      const newPageWithBookId = {
        ...newPage,
        bookId: bookId,
      };

      setPages([...pages, newPageWithBookId]);
      setCurrentPageIndex(pages.length);
      setPageContent("");
      setImagePreview(null);
      setIsEditing(true);
    } catch (err) {
      console.error("Error creating new page:", err);
      setModalTitle("Error");
      setModalMessage(err.response?.data?.message || err.message);
      setShowModal(true);
    }
  };

  // Delete the current page - now opens the confirmation modal instead of window.confirm
  const deletePage = () => {
    setShowDeleteModal(true);
  };

  // Actual delete function that gets called after confirmation
  const confirmDeletePage = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentPage = pages[currentPageIndex];

      // Use the correct delete endpoint with pageID instead of id
      await axios.delete(
        `/api/pages/${bookId}/page/${currentPage.id || currentPage.pageID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove the page from the array
      const updatedPages = pages.filter(
        (_, index) => index !== currentPageIndex
      );
      setPages(updatedPages);

      // Adjust current page index if needed
      if (updatedPages.length === 0) {
        // No pages left
        setCurrentPageIndex(0);
        setPageContent("");
        setImagePreview(null);
      } else if (currentPageIndex >= updatedPages.length) {
        // If we deleted the last page, go to the new last page
        setCurrentPageIndex(updatedPages.length - 1);
        setPageContent(updatedPages[updatedPages.length - 1].content || "");
        setImagePreview(
          getFullImageUrl(
            updatedPages[updatedPages.length - 1].imageUrl ||
              updatedPages[updatedPages.length - 1].imageURL
          ) || null
        );
      } else {
        // Stay on the same index but update content
        setPageContent(updatedPages[currentPageIndex].content || "");
        setImagePreview(
          getFullImageUrl(
            updatedPages[currentPageIndex].imageUrl ||
              updatedPages[currentPageIndex].imageURL
          ) || null
        );
      }

      setIsEditing(false);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting page:", err);
      setModalTitle("Error");
      setModalMessage(err.response?.data?.message || err.message);
      setShowModal(true);
    }
  };

  // Save the current page
  const savePage = async () => {
    // Validate that the page content is not empty
    if (!pageContent || pageContent.trim() === "") {
      setModalTitle("Empty Content");
      setModalMessage(
        "Page content cannot be empty. Please add some content before saving."
      );
      setShowModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentPage = pages[currentPageIndex];

      // First upload image if there is a new one
      let imageUrl = currentPage.imageUrl || currentPage.imageURL; // Handle both property names
      if (pageImage) {
        try {
          // Convert file to base64
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data: prefix
            reader.onerror = reject;
            reader.readAsDataURL(pageImage);
          });

          // Send as JSON instead of FormData
          const imageResponse = await fetch("/api/books/upload-image-base64", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              file: base64Data,
              filename: pageImage.name,
              contentType: pageImage.type,
              uploadType: "bookcontent"
            })
          });

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            throw new Error(`Upload failed: ${imageResponse.status} - ${errorText}`);
          }

          // The backend now returns file URL (like your old SkillMatch app)
          imageUrl = await imageResponse.text();
        } catch (error) {
          // Handle image upload errors
          console.error("Error uploading image:", error);
          const errorMessage = error.response?.data || "Failed to upload image";
          setModalMessage(`Error uploading image: ${errorMessage}`);
          setShowModal(true);
          return; // Exit the function early
        }
      }

      // Update the page with the correct endpoint and property names
      const response = await axios.put(
        `/api/pages/${bookId}/page/${currentPage.id || currentPage.pageID}`,
        {
          pageID: currentPage.id || currentPage.pageID,
          bookId: bookId,
          pageNumber: currentPage.pageNumber,
          content: pageContent,
          imageURL: imageUrl,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPage = response.data;

      // Ensure bookId is included and normalize imageUrl property
      const updatedPageWithBookId = {
        ...updatedPage,
        bookId: bookId,
        imageUrl: updatedPage.imageURL || updatedPage.imageUrl, // Normalize to imageUrl for component use
      };

      // Update the pages array
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = updatedPageWithBookId;
      setPages(updatedPages);
      setImagePreview(getFullImageUrl(imageUrl)); // Update the image preview with the full URL
      setIsEditing(false);
      setPageImage(null);
    } catch (err) {
      console.error("Error saving page:", err);
      setModalTitle("Error");
      setModalMessage(err.response?.data?.message || err.message);
      setShowModal(true);
    }
  };

  // Go back to classroom content
  const goBackToClassroom = () => {
    navigate(-1);
  };

  // Handle AI generated image selection
  const handleAIImageSelect = (file) => {
    setPageImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setShowAIGenerator(false);
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen pt-20">
        <TeahcerNav />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-500">Loading book pages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen pt-20">
        <TeahcerNav />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-xl text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={goBackToClassroom}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Classroom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Bar - Full Width */}
      <div className="w-full">
        <TeahcerNav />
      </div>

      {/* Main Content - Centered and Wider with top padding to prevent navbar overlap */}
      <div className="p-6 max-w-7xl mx-auto pt-32">
        {/* Floating decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl"></div>
        </div>

        {/* Enhanced Header Section - Landscape Arrangement */}
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
            <button
              onClick={goBackToClassroom}
              className="group flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft size={20} className="text-blue-600 group-hover:text-blue-700" />
              <span className="font-semibold text-blue-600 group-hover:text-blue-700">Back to Classroom</span>
            </button>
            
            {/* Decorative elements */}
            <div className="hidden md:flex items-center space-x-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={20} />
              <Star className="text-purple-500" size={16} />
              <Heart className="text-red-400" size={16} />
            </div>
          </div>
          
          {/* Professional Header */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={32} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                      {book?.title || "Book Editor"}
                    </h1>
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">Author:</span>
                      <span className="font-semibold text-gray-800">{book?.author || "Unknown"}</span>
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Book Stats */}
                <div className="hidden lg:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{pages.length}</div>
                    <div className="text-sm text-gray-500">Pages</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{book?.difficultyLevel || "N/A"}</div>
                    <div className="text-sm text-gray-500">Difficulty</div>
                  </div>
                  <div className="w-px h-12 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{book?.genre || "N/A"}</div>
                    <div className="text-sm text-gray-500">Genre</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Page Editor */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/50 relative z-10">
          {/* Enhanced Page Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Content Creator</h2>
                    <p className="text-indigo-100">Design engaging pages for your students</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Go To Activities Button */}
                  {pages.length > 0 && (
                    <button
                      onClick={() => {
                        document.getElementById('learning-activities').scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }}
                      className="group inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/30"
                    >
                      <ArrowDown size={18} className="mr-2 group-hover:translate-y-1 transition-transform duration-300" />
                      <span className="font-semibold text-sm">Go To Activities</span>
                    </button>
                  )}
                  <div className="hidden md:flex items-center space-x-2">
                    <Star className="text-yellow-300" size={20} />
                    <Heart className="text-pink-300" size={20} />
                    <Sparkles className="text-purple-300" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Page Content Area */}
          <div className="p-8">
            {pages.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <BookOpen size={48} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Start Your Story</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    No pages added yet. Create an engaging learning experience by adding your first page to the book.
                  </p>
                  <button
                    onClick={createNewPage}
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    <Plus size={20} className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-semibold">Add Your First Page</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                {/* Enhanced Image upload/display area */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Image size={16} className="text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Page Image</h3>
                    </div>
                    <Sparkles size={20} className="text-yellow-500" />
                  </div>
                  
                  {isEditing ? (
                    <div className="w-full">
                      {imagePreview ? (
                        <div className="relative w-full max-w-lg mx-auto">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 shadow-inner">
                            <img
                              src={imagePreview}
                              alt="Page preview"
                              className="w-full h-auto max-h-80 object-contain rounded-lg shadow-lg"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setPageImage(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 hover:scale-110 shadow-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-8 border-2 border-dashed border-blue-300 rounded-xl w-full max-w-lg mx-auto bg-gradient-to-br from-blue-50 to-purple-50">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                              <Plus size={24} className="text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 mb-2">Add Page Image</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                            </p>

                            {/* Enhanced File Input */}
                            <label 
                              htmlFor="bookImage" 
                              className="group flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 cursor-pointer transition-all duration-300 hover:border-blue-400"
                            >
                              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Image size={20} className="text-white" />
                              </div>
                              <div className="text-center">
                                <span className="block text-blue-600 font-bold">Choose Image File</span>
                                <span className="block text-gray-500 text-sm">or drag and drop here</span>
                              </div>
                            </label>
                            <input
                              type="file"
                              id="bookImage"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />

                            <div className="text-xs text-gray-400 mb-4 flex items-center">
                              <div className="w-8 h-px bg-gray-300 mr-2"></div>
                              <span>or</span>
                              <div className="w-8 h-px bg-gray-300 ml-2"></div>
                            </div>
                            
                            {/* Enhanced AI Generation Button */}
                            <button
                              onClick={() => setShowAIGenerator(true)}
                              className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                            >
                              <Wand2 size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                              <span className="font-semibold">Generate with AI</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-lg mx-auto">
                      {pages[currentPageIndex]?.imageUrl ? (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 shadow-inner">
                          <img
                            src={getFullImageUrl(pages[currentPageIndex].imageUrl)}
                            alt="Page content"
                            className="w-full h-auto max-h-80 object-contain rounded-lg shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <Image size={48} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">No image for this page</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced Text content area */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <FileText size={16} className="text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">Page Content</h3>
                    </div>
                    <Heart size={20} className="text-red-400" />
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Enter page content here..."
                    />
                  ) : (
                    <div className="w-full min-h-[12rem] p-6 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
                      <div className="text-gray-800 leading-relaxed">
                        {pages[currentPageIndex]?.content || "No content for this page"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Action buttons */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                  <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="group px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                          >
                            <X size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="font-semibold">Cancel</span>
                          </button>
                          <button
                            onClick={savePage}
                            className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                          >
                            <Save size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                            <span className="font-semibold">Save Page</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="group px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                          >
                            <Edit size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                            <span className="font-semibold">Edit Page</span>
                          </button>
                          <button
                            onClick={deletePage}
                            className="group px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                          >
                            <Trash2 size={18} className="mr-2 group-hover:rotate-12 transition-transform duration-300" />
                            <span className="font-semibold">Delete Page</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Navigation and Page Info */}
                    <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
                      {/* Page Counter */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-200">
                        <span className="text-sm font-semibold text-gray-700">
                          Page: <span className="text-blue-600 font-bold">{currentPageIndex + 1}</span> / <span className="text-purple-600 font-bold">{pages.length}</span>
                        </span>
                      </div>
                      
                      {/* Navigation Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPageIndex === 0}
                          className={`group p-3 rounded-xl transition-all duration-300 ${
                            currentPageIndex === 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-110 shadow-lg hover:shadow-xl"
                          }`}
                        >
                          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        </button>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPageIndex === pages.length - 1}
                          className={`group p-3 rounded-xl transition-all duration-300 ${
                            currentPageIndex === pages.length - 1
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-110 shadow-lg hover:shadow-xl"
                          }`}
                        >
                          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                        <button
                          onClick={createNewPage}
                          className="group p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                        >
                          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal for error messages */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-3">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {modalTitle || "Can not Upload File"}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{modalMessage}</p>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-3">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Deletion
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Are you sure you want to delete this page? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeletePage}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Learning Activities Section */}
        {pages.length > 0 && (
          <div id="learning-activities" className="mt-8 relative z-10">
            {/* Enhanced Activities Container */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
              
              {/* Header */}
              <div className="relative z-10 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-gray-800">Learning Activities</h2>
                    <Sparkles size={24} className="text-yellow-500" />
                  </div>
                  <div className="hidden md:flex items-center space-x-2">
                    <Star className="text-yellow-400" size={20} />
                    <Heart className="text-red-400" size={20} />
                    <Zap className="text-purple-500" size={20} />
                  </div>
                </div>
                <p className="text-gray-600 text-lg">
                  Enhance this book with interactive learning activities for students
                </p>
              </div>

              {/* Enhanced Activity Cards */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  to="/teacher-create-ssa"
                  state={{ bookId: bookId, bookTitle: book?.title }}
                  className="group bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 hover:from-purple-100 hover:to-pink-100 transition-all duration-500 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Target size={28} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-purple-800 group-hover:text-purple-900 transition-colors duration-300">
                          Story Sequencing
                        </h3>
                        <p className="text-sm text-purple-600">Interactive Activity</p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Create an engaging activity to arrange story events in chronological order
                    </p>
                    <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm">
                      <Play size={16} className="mr-2" />
                      <span>Start Creating</span>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/snake-questions"
                  state={{ bookId: bookId, bookTitle: book?.title }}
                  className="group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:from-green-100 hover:to-emerald-100 transition-all duration-500 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Brain size={28} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-green-800 group-hover:text-green-900 transition-colors duration-300">
                          Snake Game Questions
                        </h3>
                        <p className="text-sm text-green-600">Quiz Activity</p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Add engaging questions for the snake game activity to test comprehension
                    </p>
                    <div className="mt-4 flex items-center text-green-600 font-semibold text-sm">
                      <Play size={16} className="mr-2" />
                      <span>Start Creating</span>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/create-prediction"
                  state={{ bookId: bookId, bookTitle: book?.title }}
                  className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:from-blue-100 hover:to-indigo-100 transition-all duration-500 transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Users size={28} className="text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-blue-800 group-hover:text-blue-900 transition-colors duration-300">
                          Prediction Checkpoint
                        </h3>
                        <p className="text-sm text-blue-600">Critical Thinking</p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Create prediction activities at specific story points to enhance critical thinking
                    </p>
                    <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                      <Play size={16} className="mr-2" />
                      <span>Start Creating</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AI Image Generator Modal */}
        {showAIGenerator && (
          <AIImageGenerator
            onImageSelect={handleAIImageSelect}
            onClose={() => setShowAIGenerator(false)}
            storyContent={pageContent}
            readingLevel={book?.difficultyLevel}
          />
        )}
      </div>
    </div>
  );
};

export default BookPageEditor;
