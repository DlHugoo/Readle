import React, { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import StackTextCard from "./StackTextCard";
import { ArrowUturnLeftIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const WordSequencingBoard = ({ texts, onSubmit, reshuffleTrigger }) => {
  const [orderedTexts, setOrderedTexts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setOrderedTexts((items) => {
      const oldIndex = items.findIndex((item) => item.uid === active.id);
      const newIndex = items.findIndex((item) => item.uid === over.id);

      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);

      // Update currentIndex for all items
      return newItems.map((item, idx) => ({
        ...item,
        currentIndex: idx,
      }));
    });
  };

  const handleDragCancel = () => {
    setIsDragging(false);
    setActiveId(null);
  };

  const handleClear = () => {
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    const withUid = shuffled.map((text, index) => ({
      ...text,
      uid: uuidv4(),
      originalId: text.id,
      currentIndex: index,
    }));
    setOrderedTexts(withUid);
  };

  const handleSubmit = () => {
    const ids = orderedTexts.map((text) => text.originalId);
    onSubmit(ids);
  };

  const activeItem = orderedTexts.find((item) => item.uid === activeId);

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="max-w-4xl mx-auto">
          {/* Collapsible Instructions */}
          <div className="mb-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <span className="text-blue-700 font-medium">Instructions</span>
              {showInstructions ? (
                <ChevronUpIcon className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-blue-600" />
              )}
            </button>
            
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold text-blue-700">1. Drag to Reorder:</span> Click and hold any story part, then drag it to the correct position.
                      </p>
                      <p>
                        <span className="font-semibold text-blue-700">2. Arrange Chronologically:</span> Place the story parts in the order they appear in the story, from first to last.
                      </p>
                      <p>
                        <span className="font-semibold text-blue-700">3. Submit When Ready:</span> Once you're confident with your arrangement, click Submit to check your answer.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Stack Area - Centered and Focused */}
          <div className="bg-blue-50 rounded-2xl p-8 border-2 border-blue-200 mb-6 min-h-[600px]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Arrange the Story Parts
                </h3>
                <span className="text-sm text-gray-500">
                  {orderedTexts.length} parts
                </span>
              </div>

              <SortableContext
                items={orderedTexts.map((item) => item.uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  <AnimatePresence>
                    {orderedTexts.map((text, index) => (
                      <StackTextCard
                        key={text.uid}
                        id={text.uid}
                        text={text.textContent}
                        index={index}
                        isDragging={isDragging}
                        activeId={activeId}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClear}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center gap-2 font-medium shadow-md"
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
              Shuffle & Reset
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-semibold shadow-md"
            >
              <CheckIcon className="w-5 h-5" />
              Submit Answer
            </motion.button>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="bg-white rounded-xl shadow-2xl p-5 border-2 border-blue-400 transform rotate-1 opacity-95 max-w-md">
              <p className="text-gray-800 text-base font-medium leading-relaxed">
                {activeItem.textContent}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default WordSequencingBoard;
