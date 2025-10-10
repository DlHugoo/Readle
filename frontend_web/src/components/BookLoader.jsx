import React from "react";
import { motion } from "framer-motion";

const BookLoader = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
      <div className="relative">
        {/* Animated Book */}
        <motion.div
          className="relative w-32 h-40"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: [0, 180, 360] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Book Cover - Front */}
          <motion.div
            className="absolute inset-0 rounded-lg shadow-2xl flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #119AD5 0%, #0A96E6 100%)",
            }}
          >
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </motion.div>

          {/* Book Cover - Back */}
          <motion.div
            className="absolute inset-0 rounded-lg shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #0A96E6 0%, #2499e3 100%)",
            }}
          />

          {/* Book Spine */}
          <div
            className="absolute left-0 top-0 w-2 h-full rounded-l-lg shadow-lg"
            style={{
              background: "linear-gradient(180deg, #1174CB 0%, #087AC1 100%)",
            }}
          />
        </motion.div>

        {/* Floating Pages Animation */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute w-24 h-32 bg-white rounded shadow-lg"
              initial={{ y: 0, opacity: 0.8, rotate: 0 }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0.8, 0.3, 0.8],
                rotate: [0, 10, 0],
                x: [0, 10 * (index - 1), 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Sparkles Animation */}
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={`sparkle-${index}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 200 - 50}px`,
              top: `${Math.random() * 200 - 50}px`,
              backgroundColor: "#FCD34D", // yellow-300 for sparkles
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Loading Text */}
        <motion.div
          className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              background: "linear-gradient(90deg, #119AD5 0%, #0A96E6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Opening your book
          </h2>
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={`dot-${index}`}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#0A96E6" }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Reading Progress Bar */}
        <motion.div
          className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #119AD5 0%, #0A96E6 100%)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookLoader;
