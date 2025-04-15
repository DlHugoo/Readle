// src/components/Navbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo-final.png";

function StudentNavbar() {
  const [activeTab, setActiveTab] = useState("LIBRARY");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // You can add navigation logic here if needed
    // For example: navigate(`/${tab.toLowerCase()}`);
  };

  const handleLogout = () => {
    // Add your logout logic here
    console.log("Logging out");
    // For example: authService.logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-12 py-3 flex items-center">
        {/* Logo on the left */}
        <div className="flex-none">
          <img
            src={logo}
            alt="Readle Logo"
            className="h-12"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/48?text=R";
            }}
          />
        </div>

        {/* Navigation in the center with wide spacing */}
        <div className="flex-1 flex justify-center">
          <div className="flex space-x-24">
            {["LIBRARY", "CLASSROOM", "DASHBOARD"].map((tab) => (
              <button
                key={tab}
                className={`text-lg font-medium ${
                  activeTab === tab ? "text-slate-800" : "text-gray-700"
                } hover:text-slate-900 transition-colors`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* User icon on the right */}
        <div className="flex-none relative">
          <button
            className="rounded-full bg-blue-500 h-10 w-10 flex items-center justify-center text-white text-xl hover:bg-blue-600 transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default StudentNavbar;
