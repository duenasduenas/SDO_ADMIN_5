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

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
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
        const [folderRes, categoryRes] = await Promise.all([
          fetch(`${apiBaseUrl}/folder`),
          fetch(`${apiBaseUrl}/category`)
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
  }, [isOpen, apiBaseUrl]);

  const handleCreate = async () => {
  setLoading(true);
  setError("");

  try {
    if (!recordTitle.trim() || !recordContent.trim()) {
      throw new Error("Title and content are required");
    }

    // ---------- CATEGORY ----------
    let categoryId = selectedCategoryId;
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
      categoryId = newCat._id;
    }

    if (!categoryId) {
      throw new Error("Please select or create a category");
    }

    // ---------- RECORD ----------
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

    // ---------- FOLDER ----------
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

    // Add record to folder if folderId exists
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

    // ---------- RESET ----------
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
    }, 800);

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
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Create Record</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">Record created!</p>}

          {/* Category */}
          <select
            value={selectedCategoryId}
            onChange={e => { setSelectedCategoryId(e.target.value); if(e.target.value) setNewCategoryName(""); }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Category</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input
            placeholder="Or new category"
            value={newCategoryName}
            onChange={e => { setNewCategoryName(e.target.value); if(e.target.value) setSelectedCategoryId(""); }}
            className="w-full border rounded px-3 py-2"
          />

          {/* Folder */}
          <select
            value={selectedFolderId}
            onChange={e => setSelectedFolderId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Folder (optional)</option>
            {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <input
            placeholder="Or new folder"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />

          {/* Record */}
          <input
            placeholder="Record title"
            value={recordTitle}
            onChange={e => setRecordTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            rows={4}
            placeholder="Record content"
            value={recordContent}
            onChange={e => setRecordContent(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
