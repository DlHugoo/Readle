import React from "react";
import { motion } from "framer-motion";

const StoryProgressIndicator = ({ currentPage, totalPages }) => {
  // Calculate how many indicators to show (max 5)
  const maxIndicators = Math.min(totalPages, 5);
  
  // Create array of indicators
  const indicators = Array.from({ length: maxIndicators }, (_, index) => {
    // Determine if this indicator is active
    const isActive = index < Math.ceil((currentPage / totalPages) * maxIndicators);
    
    // Determine if this is the last indicator and we're on the last page
    const isLastPage = currentPage === totalPages;
    const isLastIndicator = index === maxIndicators - 1;
    const showCrown = isLastIndicator && isLastPage;
    
    return { isActive, showCrown };
  });

  return (
    <div className="w-full max-w-md mx-auto mb-4 bg-blue-100 rounded-full p-2 shadow-md relative">
      {/* Title overlay */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-sm">
        <span className="font-bold text-gray-800">STORY PROGRESS</span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-8 flex items-center justify-between px-4">
        {/* Background progress bar */}
        <motion.div 
          className="absolute left-0 top-0 h-full bg-blue-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(currentPage / totalPages) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Indicators */}
        <div className="flex justify-between w-full relative z-10">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex flex-col items-center justify-center">
              {indicator.showCrown ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-2xl"
                  title="Completed!"
                >
                  👑
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: indicator.isActive ? 1 : 0.7,
                    opacity: indicator.isActive ? 1 : 0.5
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-xl"
                >
                  {indicator.isActive ? "⭐" : "☆"}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Removed the page counter from here */}
    </div>
  );
};

export default StoryProgressIndicator;