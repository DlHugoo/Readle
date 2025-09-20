import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeahcerNav from '../../components/TeacherNav';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, Save, AlertCircle } from 'lucide-react';
// Add this import at the top if not already present
import { Link } from 'react-router-dom';
import axios from 'axios'; // Import axios

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
  const [pageContent, setPageContent] = useState('');
  const [pageImage, setPageImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('/uploads')) {
      return `http://localhost:3000${url}`;
    }
    return url;
  };
  
  // Fetch book and its pages
  useEffect(() => {
    const fetchBookAndPages = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch book details
        const bookResponse = await axios.get(`/api/books/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const bookData = bookResponse.data;
        setBook(bookData);
        
        // Fetch pages for this book
        const pagesResponse = await axios.get(`/api/pages/${bookId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const pagesData = pagesResponse.data;
        
        // Ensure each page has the bookId property for API calls and normalize imageUrl
        const pagesWithBookId = pagesData.map(page => ({
          ...page,
          bookId: bookId,
          imageUrl: page.imageURL || page.imageUrl // Normalize to imageUrl for component use
        }));
        
        setPages(pagesWithBookId);
        
        // If there are pages, set up the first page for viewing
        if (pagesWithBookId.length > 0) {
          setCurrentPageIndex(0);
          setPageContent(pagesWithBookId[0].content || '');
          setImagePreview(getFullImageUrl(pagesWithBookId[0].imageUrl) || null);
        }
      } catch (err) {
        console.error('Error fetching book data:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookAndPages();
  }, [bookId]);
  
  // Add these constants at the top of your component
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
        setModalMessage(`File "${file.name}" is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`);
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
      setPageContent(pages[currentPageIndex - 1].content || '');
      setImagePreview(getFullImageUrl(pages[currentPageIndex - 1].imageUrl || pages[currentPageIndex - 1].imageURL) || null);
      setIsEditing(false);
    }
  };
  
  // Navigate to next page
  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setPageContent(pages[currentPageIndex + 1].content || '');
      setImagePreview(getFullImageUrl(pages[currentPageIndex + 1].imageUrl || pages[currentPageIndex + 1].imageURL) || null);
      setIsEditing(false);
    }
  };
  
  // Create a new page
  const createNewPage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/pages/${bookId}`, {
        bookId: bookId,
        pageNumber: pages.length + 1,
        content: '',
        imageUrl: null
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const newPage = response.data;
      // Add bookId to the new page for future API calls
      const newPageWithBookId = {
        ...newPage,
        bookId: bookId
      };
      
      setPages([...pages, newPageWithBookId]);
      setCurrentPageIndex(pages.length);
      setPageContent('');
      setImagePreview(null);
      setIsEditing(true);
    } catch (err) {
      console.error('Error creating new page:', err);
      setError(err.response?.data?.message || err.message);
    }
  };
  
  // Save the current page
  const savePage = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentPage = pages[currentPageIndex];
      
      // First upload image if there is a new one
      let imageUrl = currentPage.imageUrl || currentPage.imageURL; // Handle both property names
      if (pageImage) {
        const formData = new FormData();
        formData.append('file', pageImage);
        
        // Add a parameter to specify the upload directory should be bookcontent
        formData.append('uploadType', 'bookcontent');
        
        try {
          // Use the correct image upload endpoint with actual bookId
          const imageResponse = await axios.post(`/api/books/upload-image`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          imageUrl = imageResponse.data; // Get the image URL from response data
        } catch (error) {
          // Handle image upload errors
          console.error('Error uploading image:', error);
          const errorMessage = error.response?.data || 'Failed to upload image';
          setModalMessage(`Error uploading image: ${errorMessage}`);
          setShowModal(true);
          return; // Exit the function early
        }
      }
      
      // Update the page with the correct endpoint and property names
      const response = await axios.put(`/api/pages/${bookId}/page/${currentPage.id || currentPage.pageID}`, {
        pageID: currentPage.id || currentPage.pageID,
        bookId: bookId,
        pageNumber: currentPage.pageNumber,
        content: pageContent,
        imageURL: imageUrl
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const updatedPage = response.data;
      
      // Ensure bookId is included and normalize imageUrl property
      const updatedPageWithBookId = {
        ...updatedPage,
        bookId: bookId,
        imageUrl: updatedPage.imageURL || updatedPage.imageUrl // Normalize to imageUrl for component use
      };
      
      // Update the pages array
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = updatedPageWithBookId;
      setPages(updatedPages);
      setImagePreview(getFullImageUrl(imageUrl)); // Update the image preview with the full URL
      setIsEditing(false);
      setPageImage(null);
    } catch (err) {
      console.error('Error saving page:', err);
      setError(err.response?.data?.message || err.message);
    }
  };
  
  // Delete the current page
  const deletePage = async () => {
    if (window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const currentPage = pages[currentPageIndex];
        
        // Use the correct delete endpoint with pageID instead of id
        await axios.delete(`/api/pages/${bookId}/page/${currentPage.id || currentPage.pageID}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Remove the page from the array
        const updatedPages = pages.filter((_, index) => index !== currentPageIndex);
        setPages(updatedPages);
        
        // Adjust current page index if needed
        if (updatedPages.length === 0) {
          // No pages left
          setCurrentPageIndex(0);
          setPageContent('');
          setImagePreview(null);
        } else if (currentPageIndex >= updatedPages.length) {
          // If we deleted the last page, go to the new last page
          setCurrentPageIndex(updatedPages.length - 1);
          setPageContent(updatedPages[updatedPages.length - 1].content || '');
          setImagePreview(getFullImageUrl(updatedPages[updatedPages.length - 1].imageUrl || updatedPages[updatedPages.length - 1].imageURL) || null);
        } else {
          // Stay on the same index but update content
          setPageContent(updatedPages[currentPageIndex].content || '');
          setImagePreview(getFullImageUrl(updatedPages[currentPageIndex].imageUrl || updatedPages[currentPageIndex].imageURL) || null);
        }
        
        setIsEditing(false);
      } catch (err) {
        console.error('Error deleting page:', err);
        setError(err.response?.data?.message || err.message);
      }
    }
  };

  // Go back to classroom content
  const goBackToClassroom = () => {
    navigate(-1);
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
    <div className="w-full min-h-screen pt-20">
      <TeahcerNav />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Book title and back button */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={goBackToClassroom}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <ChevronLeft size={20} />
            <span>Back to Classroom</span>
          </button>
          <h1 className="text-2xl font-bold text-center">{book?.title || 'Book Editor'}</h1>
          <div className="w-32"></div> {/* Empty div for flex spacing */}
        </div>
        
        {/* Page editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Page header with controls */}
          <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">Teacher Content Creator</div>
            <button 
              onClick={goBackToClassroom}
              className="text-white hover:text-blue-200"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Page content area */}
          <div className="p-6">
            {pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <p className="text-gray-500 mb-4">This book has no pages yet.</p>
                <button
                  onClick={createNewPage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Add First Page
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Image upload/display area */}
                <div className="mb-4 border rounded-lg p-4 flex flex-col items-center">
                  {isEditing ? (
                    <div className="w-full">
                      {imagePreview ? (
                        <div className="relative w-full max-w-md mx-auto">
                          <img 
                            src={imagePreview} 
                            alt="Page preview" 
                            className="w-full h-auto max-h-64 object-contain mb-2"
                          />
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setPageImage(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg w-full max-w-md mx-auto">
                          <div className="flex flex-col items-center">
                            <Plus size={24} className="text-blue-500 mb-2" />
                            <p className="mb-2">Add page image here</p>
                            <p className="text-xs text-gray-500 mb-2">
                              Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-md mx-auto">
                      {pages[currentPageIndex]?.imageUrl ? (
                        <img 
                          src={getFullImageUrl(pages[currentPageIndex].imageUrl)} 
                          alt="Page content" 
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                          <p className="text-gray-500">No image for this page</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Text content area */}
                <div className="mb-4">
                  {isEditing ? (
                    <textarea
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      className="w-full h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter page content here..."
                    />
                  ) : (
                    <div className="w-full min-h-[12rem] p-4 border rounded-lg bg-gray-50">
                      {pages[currentPageIndex]?.content || 'No content for this page'}
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between items-center">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePage}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                      >
                        <Save size={18} className="mr-2" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      >
                        <Edit size={18} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={deletePage}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                      >
                        <Trash2 size={18} className="mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="mx-4">
                      Page: {currentPageIndex + 1} / {pages.length}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPageIndex === 0}
                        className={`p-2 rounded-md ${
                          currentPageIndex === 0 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                        }`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPageIndex === pages.length - 1}
                        className={`p-2 rounded-md ${
                          currentPageIndex === pages.length - 1 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                        }`}
                      >
                        <ChevronRight size={20} />
                      </button>
                      <button
                        onClick={createNewPage}
                        className="p-2 bg-green-100 text-green-500 rounded-md hover:bg-green-200"
                      >
                        <Plus size={20} />
                      </button>
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
                  <h3 className="text-lg font-medium text-gray-900">Can not Upload File</h3>
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
        
        {/* Activity buttons - Moved outside the main box */}
        {pages.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add Learning Activities</h2>
            <p className="text-gray-600 mb-6">Enhance this book with interactive learning activities for students</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/teacher-create-ssa"
                state={{ bookId: bookId, bookTitle: book?.title }}
                className="flex items-center p-4 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white mr-4 group-hover:bg-purple-600">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700">Story Sequencing Activity</h3>
                  <p className="text-sm text-purple-600">Create an activity to arrange story events in order</p>
                </div>
              </Link>
              
              <Link
                to="/snake-questions"
                state={{ bookId: bookId, bookTitle: book?.title }}
                className="flex items-center p-4 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4 group-hover:bg-green-600">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700">Snake Game Questions</h3>
                  <p className="text-sm text-green-600">Add questions for the snake game activity</p>
                </div>
              </Link>

              <Link
                to="/create-prediction"
                state={{ bookId: bookId, bookTitle: book?.title}}
                className="flex items-center p-4 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4 group-hover:bg-blue-600">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-700">Prediction Checkpoint</h3>
                  <p className="text-sm text-blue-600">Create prediction activities at specific points in the story</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookPageEditor;