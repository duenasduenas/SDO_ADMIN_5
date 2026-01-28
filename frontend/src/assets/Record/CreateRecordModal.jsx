import React, { useState, useEffect } from "react";
import { X, Loader, FileText, FolderPlus, Tag, Plus, CheckCircle, AlertCircle } from "lucide-react";

export default function CreateRecordModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const [recordTitle, setRecordTitle] = useState("");
  const [recordContent, setRecordContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [categoryMode, setCategoryMode] = useState("existing"); // "existing" or "new"
  const [folderMode, setFolderMode] = useState("existing"); // "existing" or "new"

  const API_BASE_URL = 'https://unoffending-shelley-swingingly.ngrok-free.dev/api';

  // Fetch folders and categories
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [folderRes, categoryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/folder`),
          fetch(`${API_BASE_URL}/category`)
        ]);

        if (!folderRes.ok || !categoryRes.ok) throw new Error("Failed to fetch data");

        const folderData = await folderRes.json();
        const categoryData = await categoryRes.json();

        setFolders(folderData.folders || []);
        setCategories(categoryData.categories || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch folders or categories");
      }
    };

    fetchData();
  }, [isOpen, API_BASE_URL]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId("");
      setNewFolderName("");
      setSelectedCategoryId("");
      setNewCategoryName("");
      setRecordTitle("");
      setRecordContent("");
      setError("");
      setSuccess(false);
      setCategoryMode("existing");
      setFolderMode("existing");
    }
  }, [isOpen]);

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      if (!recordTitle.trim() || !recordContent.trim()) {
        throw new Error("Title and content are required");
      }

      // ---------- CATEGORY ----------
      let categoryId = selectedCategoryId;
      if (categoryMode === "new" && newCategoryName.trim()) {
        const catRes = await fetch(`${API_BASE_URL}/category/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategoryName.trim() })
        });

        if (!catRes.ok) {
          const text = await catRes.text();
          throw new Error(`Failed to create category: ${text}`);
        }

        const newCat = await catRes.json();
        categoryId = newCat._id;
      }

      if (!categoryId && categoryMode === "existing") {
        throw new Error("Please select a category");
      }

      if (!categoryId && categoryMode === "new" && !newCategoryName.trim()) {
        throw new Error("Please enter a category name");
      }

      // ---------- RECORD ----------
      const recordRes = await fetch(`${API_BASE_URL}/record/create-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recordTitle,
          content: recordContent,
          category: categoryId
        })
      });

      if (!recordRes.ok) {
        const text = await recordRes.text();
        throw new Error(`Failed to create record: ${text}`);
      }

      const newRecord = await recordRes.json();

      // ---------- FOLDER ----------
      let folderId = selectedFolderId;
      if (folderMode === "new" && newFolderName.trim()) {
        const folderRes = await fetch(`${API_BASE_URL}/folder/create-folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFolderName.trim() })
        });

        if (!folderRes.ok) {
          const text = await folderRes.text();
          throw new Error(`Failed to create folder: ${text}`);
        }

        const newFolder = await folderRes.json();
        folderId = newFolder._id;
      }

      // Add record to folder if folderId exists
      if (folderId) {
        const addRes = await fetch(`${API_BASE_URL}/folder/create-record/${folderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: newRecord._id })
        });

        if (!addRes.ok) {
          const text = await addRes.text();
          throw new Error(`Failed to add record to folder: ${text}`);
        }
      }

      setSuccess(true);
      onSuccess?.({ folderId, record: newRecord });

      setTimeout(() => {
        onClose?.();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Record</h2>
                <p className="text-blue-100 text-sm mt-0.5">Add a new record to your collection</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 text-sm font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm font-medium">Record created successfully!</p>
            </div>
          )}

          {/* Record Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Record Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter a descriptive title..."
              value={recordTitle}
              onChange={(e) => setRecordTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Record Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Write your content here..."
              value={recordContent}
              onChange={(e) => setRecordContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Category Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-purple-600" />
              <label className="text-sm font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Category Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setCategoryMode("existing");
                  setNewCategoryName("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  categoryMode === "existing"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryMode("new");
                  setSelectedCategoryId("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  categoryMode === "new"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Create New
              </button>
            </div>

            {/* Category Input */}
            {categoryMode === "existing" ? (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">-- Select a category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter new category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            )}
          </div>

          {/* Folder Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FolderPlus className="w-5 h-5 text-yellow-600" />
              <label className="text-sm font-semibold text-gray-700">
                Folder <span className="text-gray-500">(Optional)</span>
              </label>
            </div>

            {/* Folder Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setFolderMode("existing");
                  setNewFolderName("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  folderMode === "existing"
                    ? "bg-yellow-600 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setFolderMode("new");
                  setSelectedFolderId("");
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  folderMode === "new"
                    ? "bg-yellow-600 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Create New
              </button>
            </div>

            {/* Folder Input */}
            {folderMode === "existing" ? (
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
              >
                <option value="">-- None (optional) --</option>
                {folders.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter new folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !recordTitle.trim() || !recordContent.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Record
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}