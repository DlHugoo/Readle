import React, { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

const StackTextCard = ({ id, text, index, onDragStart, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      layout
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart?.(id);
      }}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        onDragEnd?.(id, info);
      }}
      whileDrag={{
        scale: 1.05,
        boxShadow: "0px 10px 30px rgba(0,0,0,0.3)",
        zIndex: 50,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isDragging ? 0.3 : 1,
        y: 0,
        scale: 1,
      }}
      exit={{ 
        opacity: 0, 
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
      }}
      transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.15 },
        height: { duration: 0.2 },
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="group relative"
    >
      <div
        className={`
          bg-white rounded-lg shadow-sm p-5 cursor-grab active:cursor-grabbing
          border-2 transition-all duration-200
          ${
            isDragging
              ? "border-blue-400 shadow-lg"
              : "border-gray-200 hover:border-blue-200 hover:shadow-md"
          }
        `}
      >
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div
            className={`
              flex-shrink-0 mt-1 p-2 rounded-md transition-colors
              ${
                isDragging
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
                isDragging
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
              }
            `}
          >
            {index + 1}
          </div>

          {/* Text Content - Main Focus */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 text-base leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StackTextCard;
