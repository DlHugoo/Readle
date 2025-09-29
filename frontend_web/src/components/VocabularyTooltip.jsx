import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Volume2, X } from "lucide-react";

const VocabularyTooltip = ({
  word,
  definition,
  pronunciation,
  example,
  isVisible,
  position,
  onClose,
  theme = "default",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const tooltipRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Text-to-speech functionality
  const speakWord = () => {
    if ("speechSynthesis" in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          container: "bg-gray-800 border-gray-700 text-gray-100",
          header: "bg-gray-700 text-gray-200",
          button: "bg-gray-600 hover:bg-gray-500 text-gray-200",
          closeButton: "text-gray-400 hover:text-gray-200",
        };
      case "sepia":
        return {
          container: "bg-amber-50 border-amber-300 text-amber-900",
          header: "bg-amber-100 text-amber-800",
          button: "bg-amber-200 hover:bg-amber-300 text-amber-800",
          closeButton: "text-amber-600 hover:text-amber-800",
        };
      case "high-contrast":
        return {
          container: "bg-white border-gray-400 text-black",
          header: "bg-gray-100 text-black",
          button: "bg-gray-200 hover:bg-gray-300 text-black",
          closeButton: "text-gray-600 hover:text-black",
        };
      default:
        return {
          container: "bg-white border-gray-200 text-gray-800",
          header: "bg-blue-50 text-blue-800",
          button: "bg-blue-100 hover:bg-blue-200 text-blue-800",
          closeButton: "text-gray-500 hover:text-gray-700",
        };
    }
  };

  const themeClasses = getThemeClasses();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.2 }}
        className={`fixed z-50 max-w-sm rounded-lg shadow-2xl border ${themeClasses.container}`}
        style={{
          left: position.x,
          top: position.y - 10,
          transform: "translateX(-50%)",
        }}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 rounded-t-lg border-b ${themeClasses.header}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <span className="font-semibold text-lg">{word}</span>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full hover:bg-opacity-20 transition-colors ${themeClasses.closeButton}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Pronunciation */}
          {pronunciation && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Pronunciation:</span>
              <span className="text-sm italic">{pronunciation}</span>
              <button
                onClick={speakWord}
                disabled={isPlaying}
                className={`p-1 rounded-full transition-colors ${
                  themeClasses.button
                } ${isPlaying ? "opacity-50" : ""}`}
                title="Listen to pronunciation"
              >
                <Volume2 size={14} />
              </button>
            </div>
          )}

          {/* Definition */}
          <div>
            <span className="text-sm font-medium">Definition:</span>
            <p className="text-sm mt-1 leading-relaxed">{definition}</p>
          </div>

          {/* Example */}
          {example && (
            <div>
              <span className="text-sm font-medium">Example:</span>
              <p className="text-sm mt-1 italic text-gray-600 dark:text-gray-300">
                "{example}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-opacity-50 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click outside to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VocabularyTooltip;
