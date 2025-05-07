import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const ImageCard = ({ id, url }) => {
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
      className="w-24 h-24 md:w-28 md:h-28 bg-white border-2 rounded-xl shadow-md overflow-hidden"
    >
      <img
        src={url}
        alt="option"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );
};

export default ImageCard;
