import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Star, Crown } from "lucide-react";

const StoryProgressIndicator = ({
  currentPage,
  totalPages,
  theme = "default",
}) => {
  // Calculate how many indicators to show (max 5)
  const maxIndicators = Math.min(totalPages, 5);
  const progressPercentage = (currentPage / totalPages) * 100;

  // Create array of indicators
  const indicators = Array.from({ length: maxIndicators }, (_, index) => {
    // Determine if this indicator is active
    const isActive =
      index < Math.ceil((currentPage / totalPages) * maxIndicators);

    // Determine if this is the last indicator - always show crown
    const isLastPage = currentPage === totalPages;
    const isLastIndicator = index === maxIndicators - 1;
    const showCrown = isLastIndicator; // Always show crown on last indicator

    return { isActive, showCrown, isLastPage };
  });

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          container: "bg-gray-800/50 border-gray-700",
          progress: "bg-gradient-to-r from-purple-500 to-pink-500",
          indicator: "text-gray-300",
          active: "text-yellow-400",
        };
      case "sepia":
        return {
          container: "bg-amber-100/50 border-amber-200",
          progress: "bg-gradient-to-r from-amber-400 to-orange-500",
          indicator: "text-amber-600",
          active: "text-amber-700",
        };
      case "high-contrast":
        return {
          container: "bg-white border-gray-300",
          progress: "bg-gradient-to-r from-blue-600 to-purple-600",
          indicator: "text-gray-600",
          active: "text-blue-700",
        };
      default:
        return {
          container: "bg-blue-100/50 border-blue-200",
          progress: "bg-gradient-to-r from-blue-400 to-blue-500",
          indicator: "text-blue-600",
          active: "text-yellow-500",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <motion.div
      className={`w-full max-w-md mx-auto mb-4 ${themeClasses.container} rounded-2xl p-3 shadow-lg border backdrop-blur-sm relative overflow-hidden`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
        animate={{
          background: [
            "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
            "linear-gradient(90deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
            "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Progress bar */}
      <div className="relative h-10 flex items-center justify-between px-4">
        {/* Background progress bar */}
        <motion.div
          className={`absolute left-0 top-0 h-full ${themeClasses.progress} rounded-full shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Indicators */}
        <div className="flex justify-between w-full relative z-10">
          {indicators.map((indicator, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              {indicator.showCrown ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: indicator.isActive ? 1.2 : 0.8, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.5,
                  }}
                  className="text-2xl"
                  title={
                    indicator.isLastPage
                      ? "Story Completed! 🎉"
                      : "Complete the story"
                  }
                >
                  <Crown
                    className={`w-6 h-6 transition-all duration-300 ${
                      indicator.isActive
                        ? "text-yellow-500 fill-current drop-shadow-lg"
                        : themeClasses.indicator
                    }`}
                    style={
                      indicator.isActive
                        ? {
                            filter:
                              "drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))",
                          }
                        : {}
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{
                    scale: indicator.isActive ? 1.2 : 0.8,
                    opacity: indicator.isActive ? 1 : 0.6,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1,
                  }}
                  className={`${
                    indicator.isActive
                      ? themeClasses.active
                      : themeClasses.indicator
                  } transition-colors duration-300`}
                >
                  {indicator.isActive ? (
                    <Star className="w-5 h-5 fill-current" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StoryProgressIndicator;
