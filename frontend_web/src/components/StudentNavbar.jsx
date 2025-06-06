import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo-final.png";

function StudentNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("LIBRARY");
  const [showDropdown, setShowDropdown] = useState(false);

  // Map pathname to tab
  useEffect(() => {
    const path = location.pathname;
    const origin = location.state?.from;

    if (path.startsWith("/book/")) {
      // Book page: determine source using state
      if (origin === "CLASSROOM") {
        setActiveTab("CLASSROOM");
      } else if (origin === "LIBRARY") {
        setActiveTab("LIBRARY");
      } else {
        // Fallback if no state (e.g., refresh)
        setActiveTab("LIBRARY"); // or "CLASSROOM", depending on your default preference
      }
    } else if (
      path.startsWith("/student-classrooms") ||
      path.startsWith("/student/classroom-content")
    ) {
      setActiveTab("CLASSROOM");
    } else if (path.startsWith("/library")) {
      setActiveTab("LIBRARY");
    } else if (path.startsWith("/dashboard")) {
      setActiveTab("DASHBOARD");
    } 
    else {
      setActiveTab(""); // fallback
    }
  }, [location]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    const routeMap = {
      LIBRARY: "/library",
      CLASSROOM: "/student-classrooms",
      DASHBOARD: "/dashboard",
     
    };
    navigate(routeMap[tab]);
  };

  const handleLogout = () => {
    console.log("Logging out");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-8 lg:px-32 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-none">
          <button
            onClick={() => navigate("/library")}
            className="focus:outline-none"
          >
            <img
              src={logo}
              alt="Readle Logo"
              className="h-12"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/48?text=R";
              }}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex justify-center">
          <div className="flex space-x-12 mr-16">
            {["LIBRARY", "CLASSROOM", "DASHBOARD"].map((tab) => (
              <button
                key={tab}
                className={`relative text-lg font-semibold transition-colors duration-200 ${
                  activeTab === tab
                    ? "text-logo-blue"
                    : "text-gray-600 hover:text-logo-blue-hover"
                }`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-logo-blue rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User Icon */}
        <div className="flex-none relative">
          <button
            className="rounded-full bg-logo-blue h-10 w-10 flex items-center justify-center text-white text-xl hover:bg-logo-blue-hover transition-colors"
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={() => navigate("/student/badges")}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-5 h-5 mr-2 text-yellow-500"
                  >
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Achievements
                </span>
              </button>
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
