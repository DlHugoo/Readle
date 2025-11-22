import React, { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import TextSlot from "./TextSlot";
import TextCard from "./TextCard";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/solid";

const WordSequencingBoard = ({ texts, onSubmit, reshuffleTrigger }) => {
  const [slots, setSlots] = useState(Array(texts.length).fill(null));
  const [availableTexts, setAvailableTexts] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const shuffled = [...texts].sort(() => Math.random() - 0.5);
    const withUid = shuffled.map((text) => ({
      ...text,
      uid: uuidv4(),
      originalId: text.id,
    }));
    setAvailableTexts(withUid);
    setSlots(Array(texts.length).fill(null));
  }, [texts, reshuffleTrigger]);

  const handleDragEnd = ({ active, over }) => {
    const dragged = findText(active.id);
    if (!over) {
      removeFromSlots(active.id);
      addToPool(dragged);
      return;
    }

    if (over.id.startsWith("slot-")) {
      const index = Number(over.id.split("-")[1]);

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

  const findText = (uid) => {
    return (
      availableTexts.find((text) => text.uid === uid) ||
      slots.find((text) => text?.uid === uid)
    );
  };

  const removeFromPool = (uid) => {
    setAvailableTexts((prev) => prev.filter((text) => text.uid !== uid));
  };

  const addToPool = (text) => {
    setAvailableTexts((prev) => [...prev, text]);
  };

  const removeFromSlots = (uid) => {
    setSlots((prev) => prev.map((text) => (text?.uid === uid ? null : text)));
  };

  const handleClear = () => {
    const textsToReturn = slots.filter((text) => text !== null);
    setAvailableTexts((prev) => [...prev, ...textsToReturn]);
    setSlots(Array(slots.length).fill(null));
  };

  const handleSubmit = () => {
    if (slots.some((s) => !s)) return alert("Fill all slots first.");
    const ids = slots.map((text) => text.originalId);
    onSubmit(ids);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center min-h-[300px]">
        <div className="flex flex-col gap-4 mb-10 w-full max-w-4xl">
          {slots.map((text, index) => (
            <TextSlot key={index} id={`slot-${index}`} text={text} index={index} />
          ))}
        </div>
        <div
          id="pool"
          className="flex flex-wrap justify-center gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm shadow-lg mx-auto border border-white/20 w-full max-w-4xl"
        >
          {availableTexts.map((text) => (
            <TextCard key={text.uid} id={text.uid} text={text.textContent} />
          ))}
        </div>
      </div>

      <div className="text-center mt-6 flex justify-center gap-2">
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
          Clear All
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit
        </button>
      </div>
    </DndContext>
  );
};

export default WordSequencingBoard;

