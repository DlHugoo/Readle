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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { v4 as uuidv4 } from "uuid";
import StackTextCard from "./StackTextCard";
import { ArrowUturnLeftIcon, CheckIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const WordSequencingBoard = ({ texts, onSubmit, reshuffleTrigger }) => {
  const [orderedTexts, setOrderedTexts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="w-full max-w-5xl mx-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Stack Area - Left Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                Arrange the Story
              </h3>
              <span className="text-sm text-gray-500">
                {orderedTexts.length} parts
              </span>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 border-orange-200 min-h-[500px]">
              <SortableContext
                items={orderedTexts.map((item) => item.uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
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

          {/* Instructions Area - Right Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Instructions
              </h3>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border-2 border-blue-200"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Drag to Reorder
                    </h4>
                    <p className="text-sm text-gray-600">
                      Click and hold any story part, then drag it to the correct
                      position in the stack.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Arrange Chronologically
                    </h4>
                    <p className="text-sm text-gray-600">
                      Place the story parts in the order they appear in the
                      story, from first to last.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Submit When Ready
                    </h4>
                    <p className="text-sm text-gray-600">
                      Once you're confident with your arrangement, click the
                      Submit button to check your answer.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClear}
                className="w-full px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <ArrowUturnLeftIcon className="w-5 h-5" />
                Shuffle & Reset
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                <CheckIcon className="w-5 h-5" />
                Submit Answer
              </motion.button>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="bg-white rounded-xl shadow-2xl p-4 border-2 border-orange-400 transform rotate-2 opacity-95 max-w-sm">
              <p className="text-gray-800 text-sm font-medium leading-relaxed">
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
