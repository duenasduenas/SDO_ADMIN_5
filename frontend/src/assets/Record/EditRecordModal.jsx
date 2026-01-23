import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditRecordModal({
  record,
  isOpen,
  onClose,
  onSave,
  apiBaseUrl,
  categories = [] // passed from parent
}) {
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    image: "",
    category: ""
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setEditForm({
        title: record.title || "",
        content: record.content || "",
        image: record.image || "",
        category: record.category || ""
      });
      setEditError("");
    }
  }, [record]);

  const handleEditSubmit = async () => {
    if (!editForm.title || !editForm.content) {
      setEditError("Title and Content are required");
      return;
    }

    let categoryId = "";

    // Handle category
    if (editForm.category?._id) {
      // Existing category selected
      categoryId = editForm.category._id;
    } else if (editForm.category?.name) {
      // New category entered
      try {
        const res = await fetch(`${apiBaseUrl}/category/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editForm.category.name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create category");
        categoryId = data._id;
      } catch (err) {
        setEditError(err.message);
        return;
      }
    } else {
      setEditError("Please select or enter a category");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/record/edit-record/${record._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editForm.title,
            content: editForm.content,
            image: editForm.image,
            category: categoryId
          })
        }
      );

      if (!response.ok) throw new Error("Failed to update record");

      const data = await response.json();

      onSave({ ...record, ...editForm, category: { _id: categoryId } });
      onClose();
    } catch (error) {
      console.error("Error updating record:", error);
      setEditError(error.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-medium text-gray-900">Edit Record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Body */}
        <div className="p-6">
          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-red-800 text-sm">{editError}</span>
              <button type="button" onClick={() => setEditError("")} className="text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={editForm.category?._id || "custom"}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setEditForm({ ...editForm, category: { name: "" } });
                  } else {
                    const selected = categories.find((c) => c._id === e.target.value);
                    setEditForm({ ...editForm, category: selected || { name: "" } });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="custom">➕ Add new category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>

              {(!editForm.category?._id || editForm.category.name === "") && (
                <input
                  type="text"
                  placeholder="Enter new category"
                  value={editForm.category?.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, category: { name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleEditSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
