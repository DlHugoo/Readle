import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Loader2, Volume2 } from "lucide-react";
import vocabularyService from "../services/vocabularyService";

const WordSelector = ({
  selectedText,
  position,
  onClose,
  onSave,
  theme = "default",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState(null);
  const selectorRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Fetch word definition when component mounts
  useEffect(() => {
    if (selectedText) {
      fetchWordDefinition(selectedText);
    }
  }, [selectedText]);

  const fetchWordDefinition = async (word) => {
    setIsLoading(true);
    setError(null);

    try {
      const definition = await vocabularyService.getWordDefinition(word);
      if (definition) {
        setWordData(definition);
      } else {
        setError("Word not found in dictionary");
      }
    } catch (err) {
      setError("Failed to fetch word definition");
      console.error("Error fetching word definition:", err);
    } finally {
      setIsLoading(false);
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
          error: "text-red-400",
        };
      case "sepia":
        return {
          container: "bg-amber-50 border-amber-300 text-amber-900",
          header: "bg-amber-100 text-amber-800",
          button: "bg-amber-200 hover:bg-amber-300 text-amber-800",
          closeButton: "text-amber-600 hover:text-amber-800",
          error: "text-red-600",
        };
      case "high-contrast":
        return {
          container: "bg-white border-gray-400 text-black",
          header: "bg-gray-100 text-black",
          button: "bg-gray-200 hover:bg-gray-300 text-black",
          closeButton: "text-gray-600 hover:text-black",
          error: "text-red-600",
        };
      default:
        return {
          container: "bg-white border-gray-200 text-gray-800",
          header: "bg-blue-50 text-blue-800",
          button: "bg-blue-100 hover:bg-blue-200 text-blue-800",
          closeButton: "text-gray-500 hover:text-gray-700",
          error: "text-red-600",
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <AnimatePresence>
      <motion.div
        ref={selectorRef}
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
              <span className="font-semibold text-lg">{selectedText}</span>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin" />
              <span className="ml-2">Loading definition...</span>
            </div>
          ) : error ? (
            <div className={`text-center py-4 ${themeClasses.error}`}>
              <p className="text-sm">{error}</p>
            </div>
          ) : wordData ? (
            <>
              {/* Pronunciation */}
              {wordData.pronunciation && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Pronunciation:</span>
                  <span className="text-sm italic">
                    {wordData.pronunciation}
                  </span>
                  <button
                    onClick={() => {
                      if (wordData.audio) {
                        try {
                          // Handle both relative and absolute URLs
                          const audioUrl = wordData.audio.startsWith("http")
                            ? wordData.audio
                            : `https:${wordData.audio}`;
                          const audio = new Audio(audioUrl);
                          audio.play().catch((error) => {
                            console.error("Error playing audio:", error);
                            // Fallback to text-to-speech if audio fails
                            if ("speechSynthesis" in window) {
                              const utterance = new SpeechSynthesisUtterance(
                                selectedText
                              );
                              speechSynthesis.speak(utterance);
                            }
                          });
                        } catch (error) {
                          console.error("Error with audio:", error);
                          // Fallback to text-to-speech
                          if ("speechSynthesis" in window) {
                            const utterance = new SpeechSynthesisUtterance(
                              selectedText
                            );
                            speechSynthesis.speak(utterance);
                          }
                        }
                      } else {
                        // Use text-to-speech as fallback
                        if ("speechSynthesis" in window) {
                          const utterance = new SpeechSynthesisUtterance(
                            selectedText
                          );
                          speechSynthesis.speak(utterance);
                        }
                      }
                    }}
                    className={`p-1 rounded-full transition-colors ${themeClasses.button}`}
                    title="Listen to pronunciation"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              )}

              {/* Definition */}
              <div>
                <span className="text-sm font-medium">Definition:</span>
                <p className="text-sm mt-1 leading-relaxed">
                  {wordData.definition}
                </p>
              </div>

              {/* Example */}
              {wordData.example && (
                <div>
                  <span className="text-sm font-medium">Example:</span>
                  <p className="text-sm mt-1 italic text-gray-600 dark:text-gray-300">
                    "{wordData.example}"
                  </p>
                </div>
              )}

              {/* Part of Speech */}
              {wordData.partOfSpeech && (
                <div>
                  <span className="text-sm font-medium">Part of Speech:</span>
                  <span className="text-sm ml-2 italic">
                    {wordData.partOfSpeech}
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-opacity-50 rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select any word to see its definition
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WordSelector;
