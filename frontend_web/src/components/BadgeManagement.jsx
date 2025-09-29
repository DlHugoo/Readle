import React, { useState, useEffect } from "react";
import axios from "axios";
import { PlusCircle, Edit, Trash2, Award, Upload, AlertCircle, CheckCircle } from "lucide-react";

const BadgeManagement = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [alertModal, setAlertModal] = useState({ show: false, type: "", message: "" });

  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    badgeType: "BRONZE",
    imageUrl: "",
    achievementCriteria: "",
    thresholdValue: 1
  });

  const [editBadge, setEditBadge] = useState({
    name: "",
    description: "",
    badgeType: "BRONZE",
    imageUrl: "",
    achievementCriteria: "",
    thresholdValue: 1
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Constants for file validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const badgeTypes = ["BRONZE", "SILVER", "GOLD"];
  const achievementCriteriaOptions = [
    "LOGIN_COUNT",
    "BOOKS_COMPLETED", 
    "GENRES_READ",
    "READING_TIME",
    "PAGES_READ",
    "VOCABULARY_MASTERED",
    "QUIZ_SCORE",
    "STREAK_DAYS"
  ];

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/badges", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch badges:", err);
      setError("Failed to fetch badges. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBadge(prev => ({
      ...prev,
      [name]: name === "thresholdValue" ? parseInt(value) || 1 : value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditBadge(prev => ({
      ...prev,
      [name]: name === "thresholdValue" ? parseInt(value) || 1 : value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showAlertModal("error", `File "${file.name}" exceeds the maximum size of 5MB.`);
        e.target.value = "";
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showAlertModal("error", `File "${file.name}" is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`);
        e.target.value = "";
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showAlertModal("error", `File "${file.name}" exceeds the maximum size of 5MB.`);
        e.target.value = "";
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showAlertModal("error", `File "${file.name}" is not a supported image format. Please use JPEG, PNG, GIF, or WebP.`);
        e.target.value = "";
        return;
      }

      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/books/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  };

  const showAlertModal = (type, message) => {
    setAlertModal({ show: true, type, message });
  };

  const closeAlertModal = () => {
    setAlertModal({ show: false, type: "", message: "" });
  };

  const addBadge = async () => {
    const { name, description, badgeType, achievementCriteria, thresholdValue } = newBadge;
    if (!name || !description || !achievementCriteria || !thresholdValue) {
      showAlertModal("error", "Please fill in all required fields.");
      return;
    }

    if (thresholdValue < 1) {
      showAlertModal("error", "Threshold value must be at least 1.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      let imageURL = null;
      if (imageFile) {
        try {
          imageURL = await uploadImage(imageFile);
          showAlertModal("success", "Image uploaded successfully!");
        } catch (error) {
          showAlertModal("error", `Failed to upload image: ${error.message}`);
          return;
        }
      }

      const response = await axios.post("/api/badges", {
        ...newBadge,
        imageUrl: imageURL,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBadges([...badges, response.data]);
      showAlertModal("success", "Badge created successfully!");
      setNewBadge({ name: "", description: "", badgeType: "BRONZE", imageUrl: "", achievementCriteria: "", thresholdValue: 1 });
      setImageFile(null);
      setImagePreview(null);
      setShowAddModal(false);
    } catch (err) {
      console.error("Add badge error:", err);
      const msg = err.response?.data?.message || "Failed to create badge.";
      showAlertModal("error", msg);
    }
  };

  const openEditModal = (badge) => {
    setSelectedBadge(badge);
    setEditBadge({
      name: badge.name,
      description: badge.description,
      badgeType: badge.badgeType,
      imageUrl: badge.imageUrl,
      achievementCriteria: badge.achievementCriteria,
      thresholdValue: badge.thresholdValue
    });
    setEditImagePreview(badge.imageUrl ? `http://localhost:3000${badge.imageUrl}` : null);
    setEditImageFile(null);
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    const { name, description, badgeType, achievementCriteria, thresholdValue } = editBadge;
    if (!name || !description || !achievementCriteria || !thresholdValue) {
      showAlertModal("error", "Please fill in all required fields.");
      return;
    }

    if (thresholdValue < 1) {
      showAlertModal("error", "Threshold value must be at least 1.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let imageURL = editBadge.imageUrl;

      if (editImageFile) {
        try {
          imageURL = await uploadImage(editImageFile);
          showAlertModal("success", "Image uploaded successfully!");
        } catch (error) {
          showAlertModal("error", `Failed to upload image: ${error.message}`);
          return;
        }
      }

      const response = await axios.put(`/api/badges/${selectedBadge.id}`, {
        ...editBadge,
        imageUrl: imageURL,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBadges(prev => prev.map(b => b.id === response.data.id ? response.data : b));
      showAlertModal("success", "Badge updated successfully!");
      setShowEditModal(false);
      setSelectedBadge(null);
    } catch (err) {
      console.error("Failed to update badge:", err);
      showAlertModal("error", "An error occurred while updating the badge.");
    }
  };

  const handleDeleteClick = (badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const confirmDeleteBadge = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/badges/${selectedBadge.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBadges(badges.filter(b => b.id !== selectedBadge.id));
      showAlertModal("success", "Badge deleted successfully!");
      setShowDeleteModal(false);
      setSelectedBadge(null);
    } catch (error) {
      console.error("Failed to delete badge:", error);
      showAlertModal("error", `Failed to delete badge: ${error.response?.data?.message || "An unknown error occurred"}`);
    }
  };

  const getBadgeTypeColor = (type) => {
    switch (type) {
      case "GOLD": return "text-yellow-600 bg-yellow-100";
      case "SILVER": return "text-gray-600 bg-gray-100";
      case "BRONZE": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getBadgeTypeIcon = (type) => {
    switch (type) {
      case "GOLD": return "🥇";
      case "SILVER": return "🥈";
      case "BRONZE": return "🥉";
      default: return "🏅";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading badges...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Admin Information Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl shadow-md mb-5 border border-purple-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-purple-600 mb-1">
              Badge Management
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              Create, edit, and manage achievement badges for students
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center">
          <Award size={20} className="mr-2 text-purple-500" />
          <span>Badges Library</span>
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <PlusCircle size={20} />
          <span>Create New Badge</span>
        </button>
      </div>

      {/* Badges Grid */}
      {badges.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No badges available yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <PlusCircle size={16} className="mr-2" />
            Create Your First Badge
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300"
            >
              {/* Badge Image */}
              <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                {badge.imageUrl ? (
                  <img
                    src={`http://localhost:3000${badge.imageUrl}`}
                    alt={badge.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Award size={48} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                
                {/* Badge Type Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${getBadgeTypeColor(badge.badgeType)}`}>
                  {getBadgeTypeIcon(badge.badgeType)} {badge.badgeType}
                </div>
              </div>

              {/* Badge Details */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{badge.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{badge.description}</p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div><strong>Criteria:</strong> {badge.achievementCriteria}</div>
                  <div><strong>Threshold:</strong> {badge.thresholdValue}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(badge)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(badge)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Badge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-purple-600">Create New Badge</h2>

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Badge Name"
                value={newBadge.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <textarea
                name="description"
                placeholder="Badge Description"
                value={newBadge.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <select
                name="badgeType"
                value={newBadge.badgeType}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {badgeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                name="achievementCriteria"
                value={newBadge.achievementCriteria}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Achievement Criteria</option>
                {achievementCriteriaOptions.map(criteria => (
                  <option key={criteria} value={criteria}>{criteria}</option>
                ))}
              </select>

              <input
                type="number"
                name="thresholdValue"
                placeholder="Threshold Value"
                value={newBadge.thresholdValue}
                onChange={handleChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              {/* Image Preview */}
              {imagePreview && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Badge Image Preview:</p>
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Badge Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Badge Image (Optional)</p>
                <p className="text-xs text-gray-500 mb-2">
                  Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                </p>
                <label 
                  htmlFor="badgeImage" 
                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                >
                  <Upload size={20} className="text-purple-500" />
                  <span className="text-purple-600 font-medium">Choose Image File</span>
                </label>
                <input
                  type="file"
                  id="badgeImage"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addBadge}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
              >
                Create Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Badge Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Edit Badge</h2>

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Badge Name"
                value={editBadge.name}
                onChange={handleEditChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <textarea
                name="description"
                placeholder="Badge Description"
                value={editBadge.description}
                onChange={handleEditChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <select
                name="badgeType"
                value={editBadge.badgeType}
                onChange={handleEditChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {badgeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                name="achievementCriteria"
                value={editBadge.achievementCriteria}
                onChange={handleEditChange}
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {achievementCriteriaOptions.map(criteria => (
                  <option key={criteria} value={criteria}>{criteria}</option>
                ))}
              </select>

              <input
                type="number"
                name="thresholdValue"
                placeholder="Threshold Value"
                value={editBadge.thresholdValue}
                onChange={handleEditChange}
                min="1"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Current Image Preview */}
              {editImagePreview && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Badge Image:</p>
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={editImagePreview} 
                      alt="Current Badge Image" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* File Upload for Edit */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Change Badge Image</p>
                <p className="text-xs text-gray-500 mb-2">
                  Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                </p>
                <label 
                  htmlFor="editBadgeImage" 
                  className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  <Upload size={20} className="text-blue-500" />
                  <span className="text-blue-600 font-medium">Choose New Image</span>
                </label>
                <input
                  type="file"
                  id="editBadgeImage"
                  accept="image/*"
                  onChange={handleEditImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete the badge "{selectedBadge?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBadge}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center mb-4">
              {alertModal.type === "success" ? (
                <CheckCircle className="text-green-500 mr-3" size={24} />
              ) : (
                <AlertCircle className="text-red-500 mr-3" size={24} />
              )}
              <h3 className="text-lg font-medium">
                {alertModal.type === "success" ? "Success" : "Error"}
              </h3>
            </div>
            <p className="mb-6">{alertModal.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closeAlertModal}
                className={`px-4 py-2 rounded text-white ${
                  alertModal.type === "success" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeManagement;
