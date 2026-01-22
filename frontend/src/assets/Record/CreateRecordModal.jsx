import React, { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";

export default function CreateRecordModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl = "http://localhost:5001/api"
}) {
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(""); // now store category _id
  const [newCategoryName, setNewCategoryName] = useState("");

  const [recordTitle, setRecordTitle] = useState("");
  const [recordContent, setRecordContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch folders and categories
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        // Folders
        const folderRes = await fetch(`${apiBaseUrl}/folder`);
        if (!folderRes.ok) throw new Error(await folderRes.text());
        const folderData = await folderRes.json();
        setFolders(Array.isArray(folderData.folders) ? folderData.folders : []);

        // Categories
        const catRes = await fetch(`${apiBaseUrl}/category`);
        if (!catRes.ok) throw new Error(await catRes.text());
        const catData = await catRes.json();
        setCategories(Array.isArray(catData.categories) ? catData.categories : []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch folders or categories");
      }
    };

    fetchData();
  }, [isOpen, apiBaseUrl]);

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      if (!recordTitle.trim() || !recordContent.trim()) {
        throw new Error("Please fill in title and content");
      }

      let categoryId = selectedCategoryId;
      // If creating a new category
      if (!categoryId && newCategoryName.trim()) {
        const catRes = await fetch(`${apiBaseUrl}/category/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategoryName.trim() })
        });
        if (!catRes.ok) {
          const text = await catRes.text();
          throw new Error(`Failed to create category: ${text}`);
        }
        const newCat = await catRes.json();
        categoryId = newCat._id; // Use the ObjectId returned by backend
      }

      if (!categoryId) {
        throw new Error("Please select or create a category");
      }

      // Create the record
      const recordRes = await fetch(`${apiBaseUrl}/record/create-record`, {
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

      // Handle folder
      let folderId = selectedFolderId;
      if (!folderId && newFolderName.trim()) {
        const folderRes = await fetch(`${apiBaseUrl}/folder/create-folder`, {
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

      if (folderId) {
        const addRes = await fetch(`${apiBaseUrl}/folder/create-record/${folderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: newRecord._id })
        });
        if (!addRes.ok) {
          const text = await addRes.text();
          throw new Error(`Failed to add record to folder: ${text}`);
        }
      }

      setSelectedFolderId("");
      setNewFolderName("");
      setSelectedCategoryId("");
      setNewCategoryName("");
      setRecordTitle("");
      setRecordContent("");
      setSuccess(true);

      onSuccess?.({ folderId, record: newRecord });

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Create Record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">Record created successfully!</p>}

          {/* Select existing category */}
          <select
            value={selectedCategoryId}
            onChange={e => {
              setSelectedCategoryId(e.target.value);
              if (e.target.value) setNewCategoryName("");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Existing Category --</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <p className="text-center text-gray-400 text-sm">OR</p>

          <input
            type="text"
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={e => {
              setNewCategoryName(e.target.value);
              if (e.target.value) setSelectedCategoryId("");
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <hr className="my-2 border-gray-200" />

          {/* Folders */}
          <select
            value={selectedFolderId}
            onChange={e => setSelectedFolderId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Existing Folder --</option>
            {folders.map(f => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>

          <p className="text-center text-gray-400 text-sm">OR</p>

          <input
            type="text"
            placeholder="New Folder Name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Record fields */}
          <input
            type="text"
            placeholder="Record Title"
            value={recordTitle}
            onChange={e => setRecordTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows={4}
            placeholder="Record Content"
            value={recordContent}
            onChange={e => setRecordContent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
