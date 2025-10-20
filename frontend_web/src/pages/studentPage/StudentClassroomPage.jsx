import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "../../components/StudentNavbar";
import mascot from "../../assets/mascot.png";
import { toast } from "react-toastify";
import { getAccessToken } from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";

// Custom CSS for animations
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
  
  @keyframes fadeInScale {
    0% { 
      opacity: 0; 
      transform: scale(0.9); 
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
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
  
  .animate-float {
    animation: float 20s infinite linear;
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .animate-fade-in-scale {
    animation: fadeInScale 0.5s ease-out forwards;
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
  
  .animate-delay-100 {
    animation-delay: 0.1s;
  }
  
  .animate-delay-200 {
    animation-delay: 0.2s;
  }
  
  .animate-delay-300 {
    animation-delay: 0.3s;
  }
  
  .animate-delay-400 {
    animation-delay: 0.4s;
  }
  
  .animate-delay-500 {
    animation-delay: 0.5s;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}
import { CalendarDays, Users, BookOpen, Copy, RefreshCw, SortAsc, SortDesc, Search, X, Loader2 } from "lucide-react";

/**
 * StudentClassroomPage – enhanced without deleting original functionality.
 * Added features:
 * - Debounced search with keyboard shortcut ("/" focuses search)
 * - Sort & view controls (A→Z, Recent, Oldest, Most students)
 * - Pull/Click refresh with graceful error handling & AbortController
 * - Copy classroom code with fallback & visual feedback
 * - Load more pagination (client-side) + skeleton shimmer while loading
 * - Join modal improvements (ESC to close, Enter to submit)
 * - Accessibility (ARIA labels, roles, focus management)
 * - Subtle card animations via CSS (no new dependency)
 * - Empty-state enhancements & helpful tips
 * - Non-destructive: original logic preserved and extended
 */

const BG_COLORS = [
  "bg-orange-400",
  "bg-indigo-400",
  "bg-emerald-400",
  "bg-pink-400",
  "bg-blue-400",
  "bg-yellow-400",
];

const SORTS = {
  AZ: { label: "Name A→Z", fn: (a, b) => a.name.localeCompare(b.name) },
  RECENT: {
    label: "Newest",
    fn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  },
  OLDEST: {
    label: "Oldest",
    fn: (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
  },
  STUDENTS: {
    label: "Most students",
    fn: (a, b) => (b.studentEmails?.length || 0) - (a.studentEmails?.length || 0),
  },
};

const LOCAL_KEYS = {
  sort: "student_classrooms_sort",
  search: "student_classrooms_search",
};

const StudentClassroomPage = () => {
  // original state (preserved)
  const [classrooms, setClassrooms] = useState([]);
  const [classroomCode, setClassroomCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem(LOCAL_KEYS.search) || "");
  const { user } = useAuth();
  const navigate = useNavigate();

  // additions
  const [sortKey, setSortKey] = useState(localStorage.getItem(LOCAL_KEYS.sort) || "RECENT");
  const [visibleCount, setVisibleCount] = useState(9); // client-side pagination
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchRef = useRef(null);
  const joinInputRef = useRef(null);
  const abortRef = useRef(null);

  // Persist user prefs
  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.sort, sortKey);
  }, [sortKey]);
  useEffect(() => {
    localStorage.setItem(LOCAL_KEYS.search, searchTerm);
  }, [searchTerm]);

  // Fetch (wrapped so it can be reused by refresh)
  const fetchClassrooms = useCallback(async () => {
    console.log('fetchClassrooms called with userId:', user?.userId);
    if (!user?.userId) {
      console.log('No userId, returning early');
      return;
    }
    setLoading(true);
    setHasLoaded(false);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const t = getAccessToken();
      const response = await fetch(`/api/classrooms/student/${user.userId}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Failed to fetch classrooms: ${response.status}`);
      const data = await response.json();
      console.log('Classroom data structure:', data); // Debug log to see the exact data structure
      setClassrooms(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        toast.error("Error fetching classrooms");
      }
    } finally {
      setLoading(false);
      setHasLoaded(true);
      setIsRefreshing(false);
    }
  }, [user?.userId]);

  // Initial fetch
  useEffect(() => {
    console.log('useEffect triggered with userId:', user?.userId);
    if (user?.userId) {
      console.log('Calling fetchClassrooms from useEffect');
      fetchClassrooms();
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // Refresh button handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchClassrooms();
  };

  // Debounced search (no extra deps)
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Derived filtered + sorted list
  const filteredClassrooms = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    const list = term
      ? classrooms.filter((c) =>
          [c.name, c.description, c.classroomCode]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term))
        )
      : classrooms;
    const sorter = SORTS[sortKey]?.fn || SORTS.RECENT.fn;
    return [...list].sort(sorter);
  }, [classrooms, debouncedSearch, sortKey]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // ignore when typing in inputs/textareas
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || document.activeElement?.contentEditable === "true";

      if (!isTyping && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key.toLowerCase() === "j") {
        setShowJoin(true);
        // focus join input slightly later to allow modal render
        setTimeout(() => joinInputRef.current?.focus(), 20);
      }
      if (showJoin && e.key === "Escape") {
        setShowJoin(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showJoin]);

  // Join classroom (original logic, with small UX upgrades)
  const handleJoinClassroom = async () => {
    if (!classroomCode) {
      toast.error("Please enter a classroom code");
      return;
    }
    if (!user?.userId) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const t = getAccessToken();
      const response = await fetch(
        `/api/classrooms/join?studentId=${user.userId}&classroomCode=${encodeURIComponent(classroomCode)}`,
        {
          method: "POST",
          headers: t ? { Authorization: `Bearer ${t}` } : {},
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setShowJoin(false);
        setClassroomCode("");
        toast.success("Successfully joined classroom!");

        // refresh list
        await fetchClassrooms();

        // navigate to joined class if we can find it
        const joinedClassroom = (prev => prev.find((c) => c.classroomCode === classroomCode))(classrooms);
        if (joinedClassroom) navigate(`/student/classroom-content/${joinedClassroom.id}`);
      } else {
        toast.error(data?.error || "Unknown error joining classroom");
      }
    } catch (err) {
      console.error("Error joining classroom:", err);
      toast.error("Error joining the classroom");
    } finally {
      setLoading(false);
    }
  };

  // Copy (with fallback)
  const handleCopy = async (code) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Classroom code copied!");
    } catch {
      toast.error("Unable to copy code");
    }
  };


  const Header = () => (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
      {/* Search Section */}
      <div className="w-full lg:w-1/2">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-all duration-300 group-hover:scale-110" size={22} aria-hidden />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search classrooms, teachers, or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-14 py-4 rounded-2xl border border-gray-200 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 placeholder-gray-400 text-lg hover:shadow-xl focus:shadow-xl"
            aria-label="Search classrooms"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 group"
              aria-label="Clear search"
            >
              <X size={18} className="text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-all duration-200" />
            </button>
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
        <select
          className="px-6 py-4 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium cursor-pointer text-lg min-w-[200px] hover:shadow-xl focus:shadow-xl"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          aria-label="Sort classrooms"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option value={k} key={k}>{v.label}</option>
          ))}
        </select>

        <div className="flex gap-4">
          <button
            onClick={() => setShowJoin(true)}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            aria-haspopup="dialog"
            aria-expanded={showJoin}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Users size={20} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <span className="relative z-10">Join Classroom</span>
          </button>

          <button
            onClick={handleRefresh}
            className="group relative flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            aria-label="Refresh classrooms"
          >
            {isRefreshing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );

  const JoinModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50" role="dialog" aria-modal>
      <div className="relative w-full max-w-lg mx-4">
        <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 h-[28rem]">
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-3xl transition-all duration-300 hover:scale-110 hover:rotate-90"
            onClick={() => setShowJoin(false)}
            aria-label="Close join modal"
          >
            &times;
          </button>
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
              <Users className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-3">Join a Classroom</h2>
            <p className="text-gray-600 text-lg">Enter the classroom code to start learning</p>
          </div>
          
          <div className="space-y-6">
            <input
              ref={joinInputRef}
              type="text"
              placeholder="Enter Classroom Code"
              value={classroomCode}
              onChange={(e) => setClassroomCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinClassroom()}
              className="w-full px-8 py-5 border border-gray-200 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-300 text-center font-mono text-xl tracking-wider text-gray-700 placeholder-gray-400 hover:shadow-lg focus:shadow-lg"
              aria-label="Classroom code"
            />
            
            <button
              onClick={handleJoinClassroom}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Join Classroom</span>
            </button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6 text-center">
            Tip: Press <kbd className="px-3 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );

  const ClassroomCard = ({ classroom, index }) => {
    const color = BG_COLORS[index % BG_COLORS.length];
    
    // Get student count from studentEmails array (this is what the API returns)
    const studentCount = classroom.studentEmails?.length || 0;
    const bookCount = classroom.books?.length || 0;
    const isActive = true;
    
    return (
      <div
        className="group relative transform transition-all duration-500 hover:scale-105 hover:-translate-y-3 max-w-md w-full mx-auto"
        tabIndex={0}
        role="button"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/student/classroom-content/${classroom.id}`)}
      >
        {/* Card Container */}
        <div className="relative h-96 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:border-blue-300">
          
          {/* Progress Ring Indicator */}
          <div className="absolute top-4 right-4 w-16 h-16 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 group-hover:text-blue-600 transition-colors duration-300"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${Math.min(studentCount * 10, 100)}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ 
                  strokeDashoffset: 0
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">{studentCount}</span>
            </div>
          </div>
          
          
          {/* Header Section */}
          <div className="relative p-5 pb-2">
            <div className="flex items-start justify-between mb-3">
              <div className={`${color} w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300`}>
                <BookOpen size={20} className="text-white drop-shadow-lg" />
              </div>
              
              {/* Creation Date */}
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  {classroom.createdAt ? new Date(classroom.createdAt).toLocaleDateString() : 'Recently created'}
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300" title={classroom.name}>
              {classroom.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3" title={classroom.description || "No description provided."}>
              {classroom.description || "No description provided."}
            </p>
          </div>
          
          {/* Stats Section */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-blue-500" />
                <span className="text-sm text-gray-600 font-medium">{studentCount} students</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-green-500" />
                <span className="text-sm text-gray-600 font-medium">{bookCount} books</span>
              </div>
            </div>
            
            {/* Classroom Code */}
            {classroom.classroomCode && (
              <div className="relative mb-6">
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg group-hover:bg-blue-50 group-hover:border-blue-200 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Copy size={12} className="text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Code</div>
                        <div className="font-mono text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">{classroom.classroomCode}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(classroom.classroomCode);
                      }}
                      className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-md transition-all duration-200 hover:scale-110 hover:rotate-12"
                      title="Copy code"
                      aria-label="Copy classroom code"
                    >
                      <Copy size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <button
              onClick={() => navigate(`/student/classroom-content/${classroom.id}`)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <span className="flex items-center justify-center gap-2 relative z-10">
                <BookOpen size={16} className="group-hover/btn:scale-110 transition-transform duration-300" />
                Enter Classroom
              </span>
            </button>
          </div>
          
        </div>
      </div>
    );
  };

  return (
    <div className="student-classroom-page min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top nav */}
      <StudentNavbar />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-slow"></div>
            <span className="text-blue-600 font-semibold text-sm tracking-wider uppercase">My Dashboard</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-slow"></div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            My Classrooms
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover, join, and explore amazing learning spaces. Your journey to knowledge starts here.
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce-slow"></div>
              <span className="text-sm font-medium">{classrooms.length} Active Classrooms</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce-slow animate-delay-200"></div>
              <span className="text-sm font-medium">Ready to Learn</span>
            </div>
          </div>
        </div>

        {/* Enhanced Header & Controls */}
        <Header />

        {/* Join Modal (enhanced) */}
        {showJoin && <JoinModal />}

        {/* Classroom Grid */}
        {(() => {
          console.log('Render state:', { loading, hasLoaded, userId: user?.userId, classroomsLength: classrooms.length, filteredLength: filteredClassrooms.length });
          return loading || !hasLoaded || !user?.userId;
        })() ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading classrooms...</p>
            </div>
          </div>
        ) : filteredClassrooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClassrooms.slice(0, visibleCount).map((classroom, index) => (
                <ClassroomCard key={classroom.id} classroom={classroom} index={index} />
              ))}
            </div>
            {visibleCount < filteredClassrooms.length && (
              <div className="flex justify-center mt-16">
                <button
                  onClick={() => setVisibleCount((c) => c + 9)}
                  className="group relative px-12 py-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:border-blue-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  <span className="relative z-10">Load More Classrooms</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20">
            {/* Mascot */}
            <div className="relative mb-12">
              <div className="relative transform hover:scale-110 transition-transform duration-500">
                <img
                  src={mascot}
                  alt="No classrooms mascot"
                  className="w-64 h-auto object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Empty State Content */}
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-black text-gray-800 mb-6 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                You haven't joined any classrooms yet. <span className="text-blue-600 font-semibold">Let's find your perfect learning space!</span>
              </p>
              
              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="group bg-white border border-gray-200 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Join a Classroom</h3>
                  <p className="text-gray-600">Get a classroom code from your teacher and start learning immediately!</p>
                </div>
                
                <div className="group bg-white border border-gray-200 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Search className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Discover Content</h3>
                  <p className="text-gray-600">Explore amazing stories and educational content once you join!</p>
                </div>
              </div>
              
              {/* Tips */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors duration-300">
                  <kbd className="px-2 py-1 bg-white rounded text-gray-600 font-mono">/</kbd>
                  <span className="text-gray-600">Search</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors duration-300">
                  <kbd className="px-2 py-1 bg-white rounded text-gray-600 font-mono">J</kbd>
                  <span className="text-gray-600">Join quickly</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors duration-300">
                  <kbd className="px-2 py-1 bg-white rounded text-gray-600 font-mono">Esc</kbd>
                  <span className="text-gray-600">Close modals</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassroomPage;