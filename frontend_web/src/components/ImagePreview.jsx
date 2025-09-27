import React, { useState } from "react";
import {
  X,
  ZoomIn,
  Download,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

const ImagePreview = ({
  images,
  onImageSelect,
  onClose,
  title = "Generated Images",
  showSelection = true,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectImage = (imageData, index) => {
    setSelectedImage(index);
  };

  const useSelectedImage = () => {
    if (selectedImage !== null && images[selectedImage]) {
      // Convert base64 to blob and create a file-like object
      const base64Data = images[selectedImage];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Create a file object
      const file = new File([blob], `ai-generated-${Date.now()}.png`, {
        type: "image/png",
      });

      // Call the parent callback with the file
      onImageSelect(file);
      onClose();
    }
  };

  const openFullscreen = (index) => {
    setCurrentImageIndex(index);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const downloadImage = (imageData, index) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageData}`;
    link.download = `ai-generated-${Date.now()}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600">
              {images.length} image{images.length !== 1 ? "s" : ""} generated
            </span>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((imageData, index) => (
            <div
              key={index}
              className={`relative group border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedImage === index
                  ? "border-purple-500 ring-4 ring-purple-200 shadow-2xl scale-105"
                  : "border-gray-200 hover:border-purple-400 hover:shadow-xl"
              }`}
              onClick={() => selectImage(imageData, index)}
            >
              <div className="relative">
                <img
                  src={`data:image/png;base64,${imageData}`}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-40 object-cover"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Image number badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {index + 1}
                </div>

                {/* Selection indicator */}
                {selectedImage === index && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-2 shadow-lg animate-pulse">
                    <Check size={16} />
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFullscreen(index);
                      }}
                      className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                      title="View fullscreen"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(imageData, index);
                      }}
                      className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                      title="Download image"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {showSelection && selectedImage !== null && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {selectedImage + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Image {selectedImage + 1} of {images.length} selected
                  </p>
                  <p className="text-xs text-gray-500">
                    Ready to use this image
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => openFullscreen(selectedImage)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 flex items-center space-x-2 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <ZoomIn size={16} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={useSelectedImage}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Check size={16} />
                  <span>Use Selected Image</span>
                </button>
              </div>
            </div>
          </div>
        )}
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

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative">
              <img
                src={`data:image/png;base64,${images[currentImageIndex]}`}
                alt={`Generated image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              />

              {/* Image overlay info */}
              <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {currentImageIndex + 1}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      Image {currentImageIndex + 1} of {images.length}
                    </div>
                    <div className="text-xs text-gray-300">AI Generated</div>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={() =>
                  downloadImage(images[currentImageIndex], currentImageIndex)
                }
                className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md text-white rounded-full p-3 hover:bg-white/20 transition-all duration-200 border border-white/20"
                title="Download image"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;
