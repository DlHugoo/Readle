import React from "react";
import { useDroppable } from "@dnd-kit/core";

const TextSlot = ({ id, text, index }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const borderStyle = text ? "border-solid" : "border-dashed";
  const borderColor = isOver ? "border-blue-500" : "border-[#c8a675]";

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`min-h-[120px] w-full border-4 ${borderStyle} ${borderColor} rounded-xl bg-slot-color flex items-center justify-center p-4`}
    >
      {text ? (
        <p className="text-gray-800 text-sm font-medium leading-relaxed text-center">
          {text}
        </p>
      ) : (
        <span className="text-3xl text-seq-text font-bold">{index + 1}</span>
      )}
    </div>
  );
};

export default TextSlot;

