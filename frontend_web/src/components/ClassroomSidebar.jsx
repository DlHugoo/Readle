import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X, LogOut, BarChart } from 'lucide-react';

const ClassroomSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { classroomId } = useParams();
  const location = useLocation();
  
  // Determine which page is active
  const isContentPage = location.pathname.includes('classroom-content');
  const isStudentsPage = location.pathname.includes('classroom-students');
  const isProgressPage = location.pathname.includes('classroom-progress');
  
  const handleNavigation = (path) => {
    navigate(path);
  };
  
  return (
    <div 
      className={`fixed left-0 top-[72px] h-[calc(100vh-72px)] bg-white shadow-lg transition-all duration-300 z-40 ${
        isOpen ? 'w-64' : 'w-0 -translate-x-full'
      }`}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Close button */}
          <button 
            onClick={toggleSidebar}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
          
          {/* Navigation items */}
          <div className="flex flex-col mt-8 px-4 space-y-2">
            <button
              onClick={() => handleNavigation(`/classroom-content/${classroomId}`)}
              className={`py-3 px-4 rounded-md text-left font-medium transition-colors ${
                isContentPage 
                  ? 'bg-[#FFD058] text-white' 
                  : 'text-[#FFD058] hover:bg-gray-100'
              }`}
            >
              Contents
            </button>
            
            <button
              onClick={() => handleNavigation(`/classroom-students/${classroomId}`)}
              className={`py-3 px-4 rounded-md text-left font-medium transition-colors ${
                isStudentsPage 
                  ? 'bg-[#FFD058] text-white' 
                  : 'text-[#FFD058] hover:bg-gray-100'
              }`}
            >
              Students
            </button>
            
            <button
              onClick={() => handleNavigation(`/classroom-progress/${classroomId}`)}
              className={`py-3 px-4 rounded-md text-left font-medium transition-colors ${
                isProgressPage 
                  ? 'bg-[#FFD058] text-white' 
                  : 'text-[#FFD058] hover:bg-gray-100'
              }`}
            >
              Progress Dashboard
            </button>
          </div>
          
          {/* Exit Classroom button - positioned at the bottom */}
          <div className="mt-auto px-4 pb-6">
            <button
              onClick={() => navigate('/classroom')}
              className="w-full py-3 px-4 rounded-md text-left font-medium transition-colors flex items-center gap-2 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <LogOut size={18} />
              Exit Classroom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomSidebar;