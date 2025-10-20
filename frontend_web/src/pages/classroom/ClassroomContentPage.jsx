import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";
import arrow from "../../assets/arrow.png";
import fallbackImage from "../../assets/not-available.jpeg";
import { getImageUrl as getImageUrlUtil } from "../../utils/apiConfig";
import { getAccessToken } from "../../api/api";
import { BookOpen, Clock, Star, ArrowRight, Sparkles, Zap, Target, Trophy } from "lucide-react";

// Custom CSS for advanced animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  
  @keyframes fadeInUp {
    0% { 
      opacity: 0; 
      transform: translateY(30px); 
    }
    100% { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slideInFromLeft {
    0% { 
      opacity: 0; 
      transform: translateX(-50px); 
    }
    100% { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes slideInFromRight {
    0% { 
      opacity: 0; 
      transform: translateX(50px); 
    }
    100% { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
  
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1); 
    }
    50% { 
      transform: scale(1.05); 
    }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translateY(0);
    }
    40%, 43% {
      transform: translateY(-10px);
    }
    70% {
      transform: translateY(-5px);
    }
    90% {
      transform: translateY(-2px);
    }
  }
  
  @keyframes bookFlip {
    0% { transform: rotateY(0deg) scale(1); }
    50% { transform: rotateY(10deg) scale(1.05); }
    100% { transform: rotateY(0deg) scale(1); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
  }
  
  .animate-float {
    animation: float 20s infinite linear;
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slideInFromLeft 0.6s ease-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInFromRight 0.6s ease-out forwards;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce 2s infinite;
  }
  
  .animate-book-flip {
    animation: bookFlip 0.6s ease-out forwards;
  }
  
  .animate-glow {
    animation: glow 2s infinite;
  }
  
  .book-card-3d {
    transform-style: preserve-3d;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.320, 1);
  }
  
  .book-card-3d:hover {
    transform: rotateY(5deg) rotateX(5deg) translateZ(20px);
  }
  
  .book-spine {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    background: linear-gradient(45deg, #1e40af, #3b82f6);
    transform: rotateY(-90deg);
    transform-origin: left center;
  }
  
  .difficulty-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    box-shadow: 0 8px 32px rgba(251, 191, 36, 0.3);
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const ClassroomContentPage = () => {
  const { classroomId } = useParams();
  const [books, setBooks] = useState([]);
  const [classroomName, setClassroomName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const t = getAccessToken();
        const res = await fetch(`/api/classrooms/${classroomId}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setClassroomName(data.name);
        } else {
          setClassroomName("Unknown Class");
        }
      } catch {
        setClassroomName("Unknown Class");
      }
    };

    const fetchBooks = async () => {
      try {
        const t = getAccessToken();
        const response = await fetch(`/api/classrooms/${classroomId}/books`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to load books.");
        const data = await response.json();

        // Filter out archived books
        const activeBooks = data.filter((book) => !book.archived);
        setBooks(activeBooks);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Could not fetch classroom books.");
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
    fetchBooks();
  }, [classroomId]);

  const getImageUrl = (path) => getImageUrlUtil(path);

  const estimateReadTime = (pageCount) => {
    const pages = parseInt(pageCount);
    if (isNaN(pages) || pages <= 0) return "~1 min read";
    return `~${pages} min read`;
  };

  const sortedBooks = [...books].sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  const groupBooksByDifficulty = (books) => {
    return books.reduce((acc, book) => {
      const level = parseInt(book.difficultyLevel) || 0;
      if (!acc[level]) acc[level] = [];
      acc[level].push(book);
      return acc;
    }, {});
  };

  const groupedBooks = groupBooksByDifficulty(sortedBooks);

  return (
    <>
      <div className="classroom-content-page min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <StudentNavbar />

        {/* Clean Hero Section */}
        <div className="relative overflow-hidden">
          {/* Simple Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600"></div>
          
          <div className="relative container mx-auto px-4 py-20">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-12">
              <Link
                to="/student-classrooms"
                title="Back to My Classrooms"
                className="group flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <img src={arrow} alt="Back" className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-semibold">Back to Classrooms</span>
              </Link>
              
              {/* Classroom Status */}
              <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-2xl">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Live Classroom</span>
              </div>
            </div>

            {/* Hero Content */}
            <div className="text-center text-white">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse-slow"></div>
                <span className="text-blue-300 font-semibold text-sm tracking-wider uppercase">Learning Space</span>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse-slow"></div>
              </div>
              
              <h1 className="text-6xl sm:text-7xl font-black mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
                {classroomName}
              </h1>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <BookOpen size={20} className="text-yellow-400" />
                  <span className="text-white font-semibold">{books.length} Books</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Sparkles size={20} className="text-purple-400" />
                  <span className="text-white font-semibold">Ready to Explore</span>
                </div>
              </div>
              
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                Dive into an incredible collection of stories and adventures. 
                <span className="text-yellow-300 font-semibold"> Your reading journey starts here!</span>
              </p>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-12">
        {/* Books Section */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-6">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-gray-700 font-semibold text-lg mb-2">Loading Amazing Books...</p>
                <p className="text-gray-500 text-sm">Preparing your reading adventure</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h3>
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        ) : books.length > 0 ? (
          <div className="space-y-20">
            {Object.entries(groupedBooks).map(([difficulty, booksAtLevel]) => (
              <div key={difficulty} className="relative">
                {/* Futuristic Difficulty Header */}
                <div className="flex items-center gap-6 mb-12">
                  <div className="flex items-center gap-3">
                    {Array.from({ length: parseInt(difficulty) }).map((_, i) => (
                      <div key={i} className="w-10 h-10 difficulty-badge rounded-full flex items-center justify-center shadow-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                        <Star size={20} className="text-white" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-400 via-orange-500 to-transparent"></div>
                  <div className="difficulty-badge text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl flex items-center gap-3">
                    <Trophy size={24} />
                    Level {difficulty}
                  </div>
                </div>

                {/* Innovative Books Grid - 3D Book Shelf */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                  {booksAtLevel.map((book, index) => (
                    <Link
                      to={`/book/${book.bookID}`}
                      state={{ from: "CLASSROOM" }}
                      key={book.bookID}
                      className="group block"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* 3D Book Card */}
                      <div className="relative book-card-3d h-96 perspective-1000">
                        {/* Book Spine */}
                        <div className="book-spine"></div>
                        
                        {/* Main Book Card - Cover Only */}
                        <div className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden group-hover:shadow-3xl transition-all duration-500 transform group-hover:scale-105 group-hover:-translate-y-4">
                          
                          {/* Difficulty Badge */}
                          <div className="absolute top-4 left-4 z-30">
                            <div className="difficulty-badge text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Level {difficulty}
                            </div>
                          </div>
                          
                          {/* Book Cover - Full Height */}
                          <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                            {/* Cover Image */}
                            <img
                              src={getImageUrl(book.imageURL)}
                              alt={book.title}
                              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackImage;
                              }}
                            />
                            
                            {/* Dynamic Overlay Effects */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            
                            {/* Glow Effect */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-glow"></div>
                          </div>

                          {/* Hover Overlay with Advanced Info */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 text-white">
                            <div className="transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                              <h3 className="text-lg font-bold mb-2 line-clamp-2" title={book.title}>
                                {book.title}
                              </h3>
                              <p className="text-sm text-blue-200 mb-3">by {book.author}</p>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">{book.genre}</span>
                                <span className="bg-yellow-500/20 px-2 py-1 rounded-full text-xs font-medium">{estimateReadTime(book.pageCount)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Zap size={16} className="text-yellow-400" />
                                  <span className="text-sm font-medium">Start Reading</span>
                                </div>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            {/* Clean Empty State */}
            <div className="relative mb-12">
              {/* Simple Mascot */}
              <div className="relative transform hover:scale-110 transition-transform duration-500">
                <img
                  src={mascot}
                  alt="No books mascot"
                  className="w-64 h-auto object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Empty State Content */}
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-slow"></div>
                <span className="text-yellow-400 font-semibold text-sm tracking-wider uppercase">Coming Soon</span>
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse-slow"></div>
              </div>
              
              <h2 className="text-4xl font-black text-gray-800 mb-6 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                No Books Yet
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Your teacher is curating an amazing collection of stories just for you. 
                <span className="text-blue-600 font-semibold"> Something incredible is coming!</span>
              </p>
              
              {/* Clean Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Clock size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Be Patient</h3>
                  <p className="text-gray-600">Amazing content is being prepared just for you!</p>
                </div>
                
                <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Stay Tuned</h3>
                  <p className="text-gray-600">New adventures are being added regularly!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default ClassroomContentPage;
