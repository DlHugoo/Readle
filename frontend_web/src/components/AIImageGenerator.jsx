import React, { useState } from "react";
import { Wand2, Loader2, X, Download, Check } from "lucide-react";
import axios from "axios";

const AIImageGenerator = ({
  onImageSelect,
  onClose,
  storyContent,
  readingLevel,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for the image");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/imagen/generate",
        {
          prompt: prompt,
          numberOfImages: 4,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setGeneratedImages(response.data.images);
      } else {
        setError("Failed to generate images");
      }
    } catch (err) {
      console.error("Error generating images:", err);
      setError(err.response?.data?.error || "Failed to generate images");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromStory = async () => {
    if (!storyContent || !storyContent.trim()) {
      setError("No story content available to generate images from");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/imagen/generate-book-page",
        {
          storyContent: storyContent,
          readingLevel: readingLevel || "elementary",
          numberOfImages: 4,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setGeneratedImages(response.data.images);
      } else {
        setError("Failed to generate images from story");
      }
    } catch (err) {
      console.error("Error generating images from story:", err);
      setError(
        err.response?.data?.error || "Failed to generate images from story"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectImage = (imageData, index) => {
    setSelectedImage(index);
  };

  const useSelectedImage = () => {
    if (selectedImage !== null && generatedImages[selectedImage]) {
      // Convert base64 to blob and create a file-like object
      const base64Data = generatedImages[selectedImage];
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Wand2 className="mr-2 text-purple-500" />
            AI Image Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Story-based generation */}
          {storyContent && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Generate from Story Content
              </h3>
              <p className="text-sm text-blue-600 mb-3">
                Generate images based on the current story content
              </p>
              <button
                onClick={generateFromStory}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                ) : (
                  <Wand2 className="mr-2" size={16} />
                )}
                Generate from Story
              </button>
            </div>
          )}

          {/* Custom prompt generation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              Custom Image Description
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate (e.g., 'A colorful illustration of children reading books in a library')"
              className="w-full h-24 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={generateImages}
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Wand2 className="mr-2" size={16} />
              )}
              Generate Images
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Generated images */}
          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Generated Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((imageData, index) => (
                  <div
                    key={index}
                    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === index
                        ? "border-purple-500 ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                    onClick={() => selectImage(imageData, index)}
                  >
                    <img
                      src={`data:image/png;base64,${imageData}`}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    {selectedImage === index && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Use selected image button */}
              {selectedImage !== null && (
                <div className="flex justify-end">
                  <button
                    onClick={useSelectedImage}
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <Download className="mr-2" size={16} />
                    Use Selected Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImageGenerator;
