import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import vocabularyService from "../services/vocabularyService";
import WordSelector from "./WordSelector";

const VocabularyHighlighter = ({
  text,
  theme = "default",
  className = "",
  onWordClick = null,
  isVocabularyEnabled = false,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [isWordSelectorVisible, setIsWordSelectorVisible] = useState(false);
  const textRef = useRef(null);

  // Split text into words - no highlighting, just text selection support
  const processText = (text) => {
    if (!text) return [];

    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, "");

      return {
        word,
        cleanWord,
        isHighlightable: false, // No highlighting, only text selection
        definition: null,
        index,
      };
    });
  };

  // Handle text selection - only works when vocabulary is enabled
  const handleTextSelection = () => {
    if (!isVocabularyEnabled) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(selectedText);
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setIsWordSelectorVisible(true);
    }
  };

  // Handle word selector close
  const handleWordSave = (wordData) => {
    // Just close the selector, no vocabulary management
    setIsWordSelectorVisible(false);
    setSelectedText("");
  };

  // Handle word selector close
  const handleWordSelectorClose = () => {
    setIsWordSelectorVisible(false);
    setSelectedText("");
  };

  // Add event listeners for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().trim()) {
          handleTextSelection();
        }
      }, 100);
    };

    if (textRef.current) {
      textRef.current.addEventListener("mouseup", handleMouseUp);
      return () => {
        if (textRef.current) {
          textRef.current.removeEventListener("mouseup", handleMouseUp);
        }
      };
    }
  }, [isVocabularyEnabled]); // Add dependency to re-attach listener when vocabulary state changes

  const getThemeClasses = () => {
    switch (theme) {
      case "dark":
        return {
          highlight:
            "text-blue-300 hover:text-blue-200 cursor-pointer underline decoration-blue-400",
          normal: "text-gray-100",
        };
      case "sepia":
        return {
          highlight:
            "text-amber-600 hover:text-amber-700 cursor-pointer underline decoration-amber-500",
          normal: "text-amber-900",
        };
      case "high-contrast":
        return {
          highlight:
            "text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-blue-500",
          normal: "text-black",
        };
      default:
        return {
          highlight:
            "text-blue-600 hover:text-blue-700 cursor-pointer underline decoration-blue-400",
          normal: "text-gray-800",
        };
    }
  };

  const themeClasses = getThemeClasses();
  const processedWords = processText(text);

  return (
    <>
      <div ref={textRef} className={className}>
        {processedWords.map((wordData, index) => {
          // Always show normal text - no highlighting or clicking
          return (
            <span key={index} className={themeClasses.normal}>
              {wordData.word}
            </span>
          );
        })}
      </div>

      {/* Word Selector */}
      {isWordSelectorVisible && (
        <WordSelector
          selectedText={selectedText}
          position={selectionPosition}
          onClose={handleWordSelectorClose}
          onSave={handleWordSave}
          theme={theme}
        />
      )}
    </>
  );
};

export default VocabularyHighlighter;
