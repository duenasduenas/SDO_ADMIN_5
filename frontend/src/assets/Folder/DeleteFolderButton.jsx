import React, { useState } from "react";
import { Trash } from "lucide-react";

export default function DeleteFolderButton({ folderId, onDeleted, API_BASE_URL }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!folderId) return;
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/folder/${folderId}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to delete folder: ${errorData.message || response.statusText}`);
        return;
      }

      alert("Folder deleted successfully.");

      // Notify parent component to update state
      if (onDeleted) onDeleted(folderId);

    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("An error occurred while deleting the folder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash className="w-8 h-4 inline-block" />
    </button>
  );
}
