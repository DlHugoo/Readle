import React, { useState } from "react";
import { X, ZoomIn, Download, Star } from "lucide-react";

const SimpleImagePreview = ({
  imageData,
  alt = "Preview image",
  className = "",
  showActions = true,
  downloadable = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const downloadImage = () => {
    if (!downloadable) return;

    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!imageData) {
    return null;
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <img
            src={`data:image/png;base64,${imageData}`}
            alt={alt}
            className="w-full h-auto object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* AI Generated badge */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
            <Star size={12} />
            <span>AI</span>
          </div>

          {showActions && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex space-x-3">
                <button
                  onClick={openFullscreen}
                  className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                  title="View fullscreen"
                >
                  <ZoomIn size={18} />
                </button>
                {downloadable && (
                  <button
                    onClick={downloadImage}
                    className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                    title="Download image"
                  >
                    <Download size={18} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="relative max-w-6xl max-h-[95vh] w-full mx-4">
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-6 right-6 z-10 bg-white/10 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <div className="relative">
              <img
                src={`data:image/png;base64,${imageData}`}
                alt={alt}
                className="w-full h-auto max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />

              {/* Image overlay info */}
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Star size={12} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      AI Generated Image
                    </div>
                    <div className="text-xs text-gray-300">High Quality</div>
                  </div>
                </div>
              </div>

              {/* Download button */}
              {downloadable && (
                <button
                  onClick={downloadImage}
                  className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                  title="Download image"
                >
                  <Download size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleImagePreview;
