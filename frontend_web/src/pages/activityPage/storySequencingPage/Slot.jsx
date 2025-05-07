import React from "react";
import { useDroppable } from "@dnd-kit/core";

const Slot = ({ id, image, index }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const borderStyle = image ? "border-solid" : "border-dashed";
  const borderColor = isOver ? "border-blue-500" : "border-[#c8a675]";

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`w-28 h-28 md:w-32 md:h-32 border-4 ${borderStyle} ${borderColor} rounded-xl bg-slot-color flex items-center justify-center`}
    >
      {image ? (
        <img
          src={image.url}
          alt="sequence"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <span className="text-3xl text-seq-text font-bold">{index + 1}</span>
      )}
    </div>
  );
};

export default Slot;
