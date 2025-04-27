import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo-face.png";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings } from "lucide-react";

function TeahcerNav() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = () => {
    // Clear user token/session
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    navigate('/profile');
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-blue-500 py-4 px-6 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Readle Logo" className="h-12 drop-shadow-lg" />
        <span className="text-white text-3xl font-bold drop-shadow-sm">Readle Teacher</span>
      </div>
      
      {/* Profile Icon with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <User size={20} />
        </button>
        
        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
            {/*<button 
              onClick={handleProfileClick}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Settings size={16} className="mr-2" />
              Profile Settings
            </button> * Uncomment ra nya ni nako BWHAHAHA */} 
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <LogOut size={16} className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default TeahcerNav;