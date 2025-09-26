import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X, LogOut, BarChart, BookOpen, Users, TrendingUp, Home } from 'lucide-react';

const ClassroomSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const location = useLocation();
  
  // Internal state for sidebar visibility (always open by default)
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  
  // Determine which page is active
  const isContentPage = location.pathname.includes('classroom-content');
  const isStudentsPage = location.pathname.includes('classroom-students');
  const isProgressPage = location.pathname.includes('classroom-progress');
  
  // Always use internal state for default behavior (always open)
  // External state only overrides when explicitly provided
  const sidebarIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  
  // Enhanced toggle function that works with both internal and external state
  const handleToggleSidebar = () => {
    if (toggleSidebar) {
      // Use external toggle if provided
      toggleSidebar();
    } else {
      // Use internal toggle
      setInternalIsOpen(!internalIsOpen);
    }
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    // Keep sidebar open during navigation (always visible by default)
    if (isOpen === undefined) {
      setInternalIsOpen(true);
    }
  };
  
  return (
    <div 
      className={`fixed left-0 top-[72px] h-[calc(100vh-72px)] bg-gradient-to-b from-blue-50 via-white to-blue-50 backdrop-blur-sm shadow-2xl border-r border-blue-100/50 transition-all duration-150 ease-out z-40 ${
        sidebarIsOpen ? 'w-72' : 'w-0 -translate-x-full'
      }`}
    >
      {sidebarIsOpen && (
        <div className="flex flex-col h-full relative">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-sky-500/5 pointer-events-none" />
          
          {/* Close button with modern styling */}
          <button 
            onClick={handleToggleSidebar}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-500 hover:text-gray-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-colors duration-100 ease-out"
          >
            <X size={16} />
          </button>
          
          {/* Header section */}
          <div className="px-6 py-8 border-b border-blue-100/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Classroom</h2>
                <p className="text-sm text-blue-600 font-medium">Management Hub</p>
              </div>
            </div>
          </div>
          
          {/* Navigation items */}
          <div className="flex flex-col px-4 py-6 space-y-3 flex-1">
            <button
              onClick={() => handleNavigation(`/classroom-content/${classroomId}`)}
              className={`group relative py-4 px-4 rounded-xl text-left font-medium transition-colors duration-100 ease-out ${
                isContentPage 
                  ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-gray-700 hover:bg-white/70 hover:shadow-lg border border-transparent hover:border-blue-200/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-100 ease-out ${
                  isContentPage 
                    ? 'bg-white/20' 
                    : 'bg-blue-50 group-hover:bg-blue-100'
                }`}>
                  <BookOpen size={18} className={isContentPage ? 'text-white' : 'text-blue-600'} />
                </div>
                <div>
                  <p className="font-semibold">Contents</p>
                  <p className={`text-xs ${isContentPage ? 'text-blue-100' : 'text-gray-500'}`}>
                    Manage books & materials
                  </p>
                </div>
              </div>
              {isContentPage && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl opacity-10" />
              )}
            </button>
            
            <button
              onClick={() => handleNavigation(`/classroom-students/${classroomId}`)}
              className={`group relative py-4 px-4 rounded-xl text-left font-medium transition-colors duration-100 ease-out ${
                isStudentsPage 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'text-gray-700 hover:bg-white/70 hover:shadow-lg border border-transparent hover:border-emerald-200/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-100 ease-out ${
                  isStudentsPage 
                    ? 'bg-white/20' 
                    : 'bg-emerald-50 group-hover:bg-emerald-100'
                }`}>
                  <Users size={18} className={isStudentsPage ? 'text-white' : 'text-emerald-600'} />
                </div>
                <div>
                  <p className="font-semibold">Students</p>
                  <p className={`text-xs ${isStudentsPage ? 'text-emerald-100' : 'text-gray-500'}`}>
                    View & manage students
                  </p>
                </div>
              </div>
              {isStudentsPage && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-10" />
              )}
            </button>
            
            <button
              onClick={() => handleNavigation(`/classroom-progress/${classroomId}`)}
              className={`group relative py-4 px-4 rounded-xl text-left font-medium transition-colors duration-100 ease-out ${
                isProgressPage 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25' 
                  : 'text-gray-700 hover:bg-white/70 hover:shadow-lg border border-transparent hover:border-purple-200/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-100 ease-out ${
                  isProgressPage 
                    ? 'bg-white/20' 
                    : 'bg-purple-50 group-hover:bg-purple-100'
                }`}>
                  <TrendingUp size={18} className={isProgressPage ? 'text-white' : 'text-purple-600'} />
                </div>
                <div>
                  <p className="font-semibold">Progress Dashboard</p>
                  <p className={`text-xs ${isProgressPage ? 'text-purple-100' : 'text-gray-500'}`}>
                    Track learning analytics
                  </p>
                </div>
              </div>
              {isProgressPage && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-10" />
              )}
            </button>
          </div>
          
          {/* Exit Classroom button - positioned at the bottom */}
          <div className="px-4 pb-6 border-t border-blue-100/50 pt-4">
            <button
              onClick={() => navigate('/classroom')}
              className="group w-full py-4 px-4 rounded-xl text-left font-medium transition-colors duration-100 ease-out flex items-center gap-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25 border border-transparent hover:border-red-200/50"
            >
              <div className="w-10 h-10 bg-red-50 group-hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors duration-100 ease-out">
                <LogOut size={18} className="text-red-600 group-hover:text-white" />
              </div>
              <div>
                <p className="font-semibold">Exit Classroom</p>
                <p className="text-xs text-gray-500 group-hover:text-red-100">
                  Return to classroom list
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomSidebar;