import React, { useState } from "react";
import { FileText, X, Loader } from "lucide-react";

export function CreateRecord({ apiBaseUrl, onSuccess, folderId, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const API_BASE_URL = 'http://192.168.0.100:5004/api';


  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !category.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
f
    try {
      // Step 1: Create the record
      const res = await fetch(`${API_BASE_URL}/record/create-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.message || "Failed to create record");

      const newRecord = data; // assume backend returns the record

      // Step 2: If folderId is provided, add the record to the folder
      if (folderId) {
        const folderRes = await fetch(`${API_BASE_URL}/folder/add-record/${folderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: newRecord._id }),
        });

        const folderText = await folderRes.text();
        const folderData = folderText ? JSON.parse(folderText) : {};

        if (!folderRes.ok) throw new Error(folderData.message || "Failed to add record to folder");
      }

      // Step 3: Notify parent and reset
      onSuccess?.(newRecord);
      setTitle("");
      setCategory("");
      setContent("");
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        onClose?.();
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Create New Record</h1>
          </div>

          {/* Form */}
          <div className="p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <span className="text-green-800 text-sm font-medium">
                  ✓ Record created successfully!
                </span>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <span className="text-red-800 text-sm">{error}</span>
                <button 
                  onClick={() => setError("")}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Title Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter record title"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Category Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter record category"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Content Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter record content"
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleClear}
                type="button"
                disabled={loading}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                type="button"
                disabled={loading || !title.trim() || !content.trim() || !category.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Record"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">API Configuration</h3>
          <p className="text-sm text-blue-800">
            This component sends a POST request to <code className="bg-blue-100 px-1.5 py-0.5 rounded">/create-record/</code> with the title and content fields.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            Make sure your backend server is running and the endpoint is accessible.
          </p>
        </div>
      </div>
    </div>
  );
}