// components/Slot.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Slot = ({ id, image }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isOver } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: isOver ? "#3B82F6" : "#CBD5E1",
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="w-28 h-28 md:w-32 md:h-32 border-4 border-dashed rounded-xl bg-white flex items-center justify-center"
    >
      {image ? (
        <img
          src={image.url}
          alt="sequence"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <span className="text-3xl text-gray-300">?</span>
      )}
    </div>
  );
};

export default Slot;
