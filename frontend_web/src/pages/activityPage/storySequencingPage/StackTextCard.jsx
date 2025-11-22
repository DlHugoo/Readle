import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

const StackTextCard = ({ id, text, index, isDragging, activeId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  const isActive = activeId === id;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isItemDragging ? 0.5 : 1,
        y: 0,
        scale: isItemDragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={`group relative ${
        isItemDragging ? "z-50" : "z-0"
      }`}
    >
      <div
        className={`
          bg-white rounded-lg shadow-sm p-5 cursor-grab active:cursor-grabbing
          border-2 transition-all duration-200
          ${
            isItemDragging
              ? "border-blue-400 shadow-lg"
              : isActive
              ? "border-blue-300 shadow-md"
              : "border-gray-200 hover:border-blue-200 hover:shadow-md"
          }
          ${isItemDragging ? "opacity-50" : "opacity-100"}
        `}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div
            className={`
              flex-shrink-0 mt-1 p-2 rounded-md transition-colors
              ${
                isItemDragging
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500"
              }
            `}
          >
            <GripVertical size={20} />
          </div>

          {/* Position Indicator */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all
              ${
                isItemDragging
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
              }
            `}
          >
            {index + 1}
          </div>

          {/* Text Content - Main Focus */}
          <div className="flex-1 min-w-0">
            <p
              className={`
                text-gray-800 text-base leading-relaxed
                ${isItemDragging ? "text-gray-600" : ""}
              `}
            >
              {text}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StackTextCard;
