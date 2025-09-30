import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeahcerNav from '../../components/TeacherNav';
import ClassroomSidebar from "../../components/ClassroomSidebar";
import { Menu, ArrowLeft, RotateCcw, Archive, Sparkles, Star, Heart, Zap } from "lucide-react";
import axios from "axios";
import { getImageUrl } from "../../utils/apiConfig";

const ArchivedBooks = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unarchiving, setUnarchiving] = useState(new Set()); // Track which books are being unarchived

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Authentication required.'); setLoading(false); return; }

    const fetchAll = async () => {
      try {
        const [cls, res] = await Promise.all([
          axios.get(`/api/classrooms/${classroomId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          // Updated endpoint
          axios.get(`/api/books/classroom/${classroomId}/archived`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);
        setClassroomName(cls.data.name || 'Classroom');
        setBooks(res.data || []);
        setError(null);
      } catch (e) {
        setError('Failed to load archived books.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [classroomId]);

  const unarchive = async (bookId) => {
    // Prevent multiple clicks
    if (unarchiving.has(bookId)) return;
    
    try {
      setUnarchiving(prev => new Set(prev).add(bookId));
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      await axios.put(`/api/books/${bookId}/unarchive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the archived books list
      const res = await axios.get(`/api/books/classroom/${classroomId}/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data || []);
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error('Error unarchiving book:', e);
      setError('Failed to unarchive book. Please try again.');
    } finally {
      setUnarchiving(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const fullImg = (path) => path ? getImageUrl(path) : '';

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <TeahcerNav />
      <ClassroomSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col pt-20 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Floating decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl"></div>
        </div>
        
        <div className="px-4 sm:px-8 lg:px-12 py-4 max-w-8xl mx-auto w-full relative z-10">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {/* Sidebar Toggle Button */}
              <button 
                onClick={toggleSidebar}
                className="group p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:bg-white/80 transition-all duration-300 hover:scale-105"
              >
                <Menu size={20} className="text-blue-600 group-hover:text-blue-700" />
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
                      <Archive size={32} className="text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        Archived Books
                      </h1>
                      <p className="text-sm text-gray-600 flex items-center">
                        <span className="mr-2">Classroom:</span>
                        <span className="font-semibold text-gray-800">{classroomName}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced Back Button */}
                  <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    <span className="font-semibold">Back to Classroom</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-white/70 backdrop-blur-sm border-2 border-red-200 rounded-xl shadow-lg mb-6 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
              <div className="relative z-10 flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <Zap size={16} className="text-white" />
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                  <p className="text-lg font-semibold text-gray-700">Loading archived books...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we prepare everything</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Enhanced Content Section */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h2 className="text-3xl font-bold text-gray-800">Archived Collection</h2>
                  <Sparkles size={24} className="text-yellow-500" />
                </div>
                <div className="hidden md:flex items-center space-x-2 text-gray-500">
                  <Heart size={16} className="text-red-400" />
                  <span className="text-sm">{books.length} archived books</span>
                </div>
              </div>
              
              {books.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Archive size={48} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">No Archived Books</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      No books have been archived yet. Archived books will appear here for easy restoration.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {books.map(book => (
                    <div key={book.bookID} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-500 relative border border-white/50 hover:shadow-2xl">
                      {/* Floating decorative elements */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse delay-150"></div>

                      {/* Book Cover Image */}
                      <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                        {book.imageURL ? (
                          <img
                            src={fullImg(book.imageURL)}
                            alt={book.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <Archive size={48} className="mb-2" />
                            <span className="text-sm">No Image</span>
                          </div>
                        )}
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Archive badge */}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          Archived
                        </div>
                      </div>

                      {/* Enhanced Book Details */}
                      <div className="p-4 relative">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent truncate mb-2 group-hover:from-gray-700 group-hover:to-gray-800 transition-all duration-300">
                          {book.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500 font-medium">
                            {book.author}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            {book.genre}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Unarchive Button */}
                      <div className="p-4 border-t border-gray-200/50">
                        <button 
                          onClick={() => unarchive(book.bookID)} 
                          disabled={unarchiving.has(book.bookID)}
                          className={`group/btn w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                            unarchiving.has(book.bookID)
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105"
                          }`}
                        >
                          {unarchiving.has(book.bookID) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span className="font-semibold">Unarchiving...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={16} className="group-hover/btn:rotate-180 transition-transform duration-300" />
                              <span className="font-semibold">Unarchive</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivedBooks;


