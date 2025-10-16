import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo-face.png";
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown, BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../api/api";

function TeahcerNav() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  const dropdownRef = useRef(null);
  
  // ✅ Use auth context instead of localStorage
  const { user, logout } = useAuth();

  // ✅ Fetch teacher name using user data from context
  const fetchTeacherName = async () => {
    if (!user || !user.email) return;

    try {
      // ✅ Use apiClient - token sent automatically via cookie
      const response = await apiClient.get(`/api/users/by-email/${encodeURIComponent(user.email)}`);
      setTeacherName(response.data.firstName + ' ' + response.data.lastName);
    } catch (error) {
      console.error("Error fetching teacher name:", error);
      setTeacherName('Teacher');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch teacher name on component mount
  useEffect(() => {
    fetchTeacherName();
  }, [user]);

  const handleLogout = async () => {
    // ✅ Use auth context logout - clears HTTPOnly cookie
    await logout();
    // Navigation is handled by auth context
  };

  // Remove handleProfileClick as we don't have profile pages

  return (
    <nav className="bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 backdrop-blur-sm border-b border-blue-300/50 py-4 px-6 flex justify-between items-center shadow-xl fixed top-0 left-0 right-0 z-50">
      {/* Clean Logo and Branding Section */}
      <div className="flex items-center space-x-4 group">
        <div className="relative">
          <img src={logo} alt="Readle Logo" className="h-12 drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-white text-2xl font-bold drop-shadow-lg">
            Readle Teacher
          </span>
          <div className="hidden md:flex items-center">
            <BookOpen className="text-white/80" size={20} />
          </div>
        </div>
      </div>
      
      {/* Clean Profile Section with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="group flex items-center space-x-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
            <User size={18} className="text-white" />
          </div>
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-white">Welcome</p>
            <p className="text-xs text-blue-100">Dashboard</p>
          </div>
          <ChevronDown 
            size={14} 
            className={`text-white/80 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {/* Simplified Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-blue-100 py-3 z-50 transform animate-in zoom-in-95 duration-200">
            {/* Teacher Name Display */}
            <div className="px-4 py-3 border-b border-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-full flex items-center justify-center shadow-md">
                  <User size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{teacherName}</p>
                  <p className="text-sm text-blue-600 font-medium">Teacher Account</p>
                </div>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <div className="px-2 pt-2">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors duration-200">
                  <LogOut size={16} className="text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Sign Out</p>
                  <p className="text-xs text-gray-500">End your session</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default TeahcerNav;