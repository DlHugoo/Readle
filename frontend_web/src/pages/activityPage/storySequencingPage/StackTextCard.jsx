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
        scale: isItemDragging ? 1.05 : 1,
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
          bg-white rounded-xl shadow-md p-4 cursor-grab active:cursor-grabbing
          border-2 transition-all duration-200
          ${
            isItemDragging
              ? "border-orange-400 shadow-2xl scale-105 rotate-1"
              : isActive
              ? "border-orange-300 shadow-lg"
              : "border-gray-200 hover:border-orange-200 hover:shadow-lg"
          }
          ${isItemDragging ? "opacity-50" : "opacity-100"}
        `}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            className={`
              flex-shrink-0 mt-1 p-1 rounded-lg transition-colors
              ${
                isItemDragging
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500"
              }
            `}
          >
            <GripVertical size={18} />
          </div>

          {/* Position Indicator */}
          <div
            className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all
              ${
                isItemDragging
                  ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white scale-110"
                  : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 group-hover:from-orange-200 group-hover:to-amber-200 group-hover:text-orange-700"
              }
            `}
          >
            {index + 1}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`
                text-gray-800 text-sm font-medium leading-relaxed
                ${isItemDragging ? "text-gray-600" : ""}
              `}
            >
              {text}
            </p>
          </div>
        </div>

        {/* Hover Effect Indicator */}
        {!isItemDragging && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 pointer-events-none"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default StackTextCard;

