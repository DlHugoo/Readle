import React, { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import Slot from "./Slot";
import ImageCard from "./ImageCard";

const SequencingBoard = ({ images, onSubmit, reshuffleTrigger }) => {
  const [slots, setSlots] = useState(Array(images.length).fill(null));
  const [availableImages, setAvailableImages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const withUid = shuffled.map((img) => ({
      ...img,
      uid: uuidv4(),
      originalId: img.id,
    }));
    setAvailableImages(withUid);
    setSlots(Array(images.length).fill(null));
  }, [images, reshuffleTrigger]);

  const handleDragEnd = ({ active, over }) => {
    const dragged = findImage(active.id);
    if (!over) {
      removeFromSlots(active.id);
      addToPool(dragged);
      return;
    }

    if (over.id.startsWith("slot-")) {
      const index = Number(over.id.split("-")[1]);

      // If something is already in this slot, return it to the pool
      const newSlots = [...slots];
      const existing = newSlots[index];

      if (existing?.uid !== dragged.uid) {
        if (existing) {
          addToPool(existing);
        }

        removeFromPool(dragged.uid);
        removeFromSlots(dragged.uid);
        newSlots[index] = dragged;
        setSlots(newSlots);
      }
    } else {
      removeFromSlots(active.id);
      addToPool(dragged);
    }
  };

  const findImage = (uid) => {
    return (
      availableImages.find((img) => img.uid === uid) ||
      slots.find((img) => img?.uid === uid)
    );
  };

  const removeFromPool = (uid) => {
    setAvailableImages((prev) => prev.filter((img) => img.uid !== uid));
  };

  const addToPool = (image) => {
    setAvailableImages((prev) =>
      prev.find((img) => img.uid === image.uid) ? prev : [...prev, image]
    );
  };

  const removeFromSlots = (uid) => {
    setSlots((prev) => prev.map((img) => (img?.uid === uid ? null : img)));
  };

  const handleSubmit = () => {
    if (slots.some((s) => !s)) return alert("Fill all slots first.");
    const ids = slots.map((img) => img.originalId);
    onSubmit(ids);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center min-h-[300px]">
        {" "}
        {/* NEW wrapper */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap min-h-[150px]">
          {slots.map((img, index) => (
            <Slot key={index} id={`slot-${index}`} image={img} index={index} />
          ))}
        </div>
        <div
          id="pool"
          className="flex flex-wrap justify-center gap-4 p-4 rounded-xl"
        >
          {availableImages.map((img) => (
            <ImageCard key={img.uid} id={img.uid} url={img.url} />
          ))}
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={slots.some((s) => !s)}
          className={`px-6 py-3 rounded-full text-xl font-bold mt-4 ${
            slots.some((s) => !s)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          Check My Answer
        </button>
      </div>
    </DndContext>
  );
};

export default SequencingBoard;
