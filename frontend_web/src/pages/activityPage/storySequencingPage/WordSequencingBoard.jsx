import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import StackTextCard from "./StackTextCard";
import { ArrowUturnLeftIcon, CheckIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const WordSequencingBoard = ({ texts, onSubmit, reshuffleTrigger }) => {
  const [orderedTexts, setOrderedTexts] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    // Shuffle texts and assign unique IDs
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    const withUid = shuffled.map((text, index) => ({
      ...text,
      uid: uuidv4(),
      originalId: text.id,
      currentIndex: index,
    }));
    setOrderedTexts(withUid);
  }, [texts, reshuffleTrigger]);

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragEnd = (id, info) => {
    setDraggedId(null);

    // Find the dragged item
    const draggedIndex = orderedTexts.findIndex((item) => item.uid === id);
    if (draggedIndex === -1) return;

    // Calculate new position based on drag distance
    // Each card is approximately 100px tall (including spacing)
    const cardHeight = 100;
    const dragDistance = info.offset.y;

    if (Math.abs(dragDistance) < cardHeight / 2) {
      // Not enough movement, don't reorder
      return;
    }

    const direction = dragDistance > 0 ? 1 : -1;
    const cardsMoved = Math.round(Math.abs(dragDistance) / cardHeight);

    const newIndex = Math.max(
      0,
      Math.min(orderedTexts.length - 1, draggedIndex + direction * cardsMoved)
    );

    if (newIndex === draggedIndex) return;

    // Reorder the array
    setOrderedTexts((items) => {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(newIndex, 0, removed);

      // Update currentIndex for all items
      return newItems.map((item, idx) => ({
        ...item,
        currentIndex: idx,
      }));
    });
  };

  const handleClear = () => {
    // Shuffle the existing items by reordering them, keeping the same uids
    // This prevents AnimatePresence from treating them as new items
    setOrderedTexts((currentItems) => {
      const shuffled = [...currentItems].sort(() => Math.random() - 0.5);
      return shuffled.map((item, index) => ({
        ...item,
        currentIndex: index,
      }));
    });
  };

  const handleSubmit = () => {
    const ids = orderedTexts.map((text) => text.originalId);
    onSubmit(ids);
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto">
        {/* Main Stack Area - Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-white/50 shadow-2xl mb-8 relative overflow-hidden"
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Arrange the Story Parts
                </h3>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                  Drag and drop to reorder the sequence
                </p>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full border border-blue-200">
                <span className="text-sm font-semibold text-blue-700">
                  {orderedTexts.length}{" "}
                  {orderedTexts.length === 1 ? "part" : "parts"}
                </span>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {orderedTexts.map((text, index) => (
                  <StackTextCard
                    key={text.uid}
                    id={text.uid}
                    text={text.textContent}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Modern Design */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl transition-all flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl text-base sm:text-lg"
          >
            <ArrowUturnLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Shuffle & Reset</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl transition-all flex items-center justify-center gap-3 font-bold shadow-lg hover:shadow-xl text-base sm:text-lg relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-3">
              <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>Submit Answer</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WordSequencingBoard;
