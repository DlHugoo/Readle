// API Configuration Utility
// This file provides consistent API base URL configuration across the app

// Get the API base URL from environment variable or use empty string for Vercel proxy
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "";
};

// Get the full image URL for uploaded images
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  const apiBase = getApiBaseUrl();
  
  // If imagePath already starts with http, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If we have an API base URL, prepend it
  if (apiBase) {
    return `${apiBase}${imagePath}`;
  }
  
  // For Vercel proxy, use relative URL
  return imagePath;
};

// Get the full API URL for API calls
export const getApiUrl = (endpoint) => {
  const apiBase = getApiBaseUrl();
  
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (apiBase) {
    return `${apiBase}/${cleanEndpoint}`;
  }
  
  // For Vercel proxy, use relative URL
  return `/${cleanEndpoint}`;
};
