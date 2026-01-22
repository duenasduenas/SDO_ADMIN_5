import React, { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";

export default function CreateRecordModal({ isOpen, onClose, onSuccess, apiBaseUrl = "http://localhost:5001/api" }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  const [recordTitle, setRecordTitle] = useState("");
  const [recordCategory, setRecordCategory] = useState("");
  const [recordContent, setRecordContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch existing folders when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchFolders = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/folder`);
        if (!res.ok) throw new Error("Failed to fetch folders");

        const data = await res.json();
        // Expecting backend returns { folders: [...] }
        setFolders(Array.isArray(data.folders) ? data.folders : []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchFolders();
  }, [isOpen, apiBaseUrl]);

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      // Decide folder ID
      let folderId = selectedFolderId;

      // Create new folder if name is entered
      if (newFolderName.trim()) {
        const folderRes = await fetch(`${apiBaseUrl}/folder/create-folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFolderName }),
        });

        const folderData = await folderRes.json();
        if (!folderRes.ok) throw new Error(folderData.message || "Failed to create folder");
        folderId = folderData._id;
      }

      if (!folderId) {
        throw new Error("Select an existing folder or enter a new folder name");
      }

      // Create record if fields are filled
      let newRecord = null;
      if (recordTitle.trim() && recordCategory.trim() && recordContent.trim()) {
        const recordRes = await fetch(`${apiBaseUrl}/record/create-record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: recordTitle, category: recordCategory, content: recordContent }),
        });

        const recordData = await recordRes.json();
        if (!recordRes.ok) throw new Error(recordData.message || "Failed to create record");
        newRecord = recordData;

        // Add record to folder
        const addRes = await fetch(`${apiBaseUrl}/folder/add-record/${folderId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: newRecord._id }),
        });

        const addData = await addRes.json();
        if (!addRes.ok) throw new Error(addData.message || "Failed to add record to folder");
      }

      // Success
      setSelectedFolderId("");
      setNewFolderName("");
      setRecordTitle("");
      setRecordCategory("");
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

          {/* Select existing folder */}
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Existing Folder --</option>
            {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>

          <p className="text-center text-gray-400 text-sm">OR</p>

          {/* New folder input */}
          <input
            type="text"
            placeholder="New Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <hr className="my-2 border-gray-200" />

          {/* Record fields */}
          <input
            type="text"
            placeholder="Record Title"
            value={recordTitle}
            onChange={(e) => setRecordTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Record Category"
            value={recordCategory}
            onChange={(e) => setRecordCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            rows={4}
            placeholder="Record Content"
            value={recordContent}
            onChange={(e) => setRecordContent(e.target.value)}
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
