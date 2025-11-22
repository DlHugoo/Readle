import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const TextCard = ({ id, text }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useDraggable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-white rounded-xl shadow-md p-4 cursor-move hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-300 min-w-[200px] max-w-[300px]"
    >
      <p className="text-gray-800 text-sm font-medium leading-relaxed">
        {text}
      </p>
    </div>
  );
};

export default TextCard;

