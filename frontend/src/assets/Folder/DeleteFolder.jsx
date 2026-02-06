import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteFolder({ id, folders, setFolders, setSelectedFolder, API_BASE_URL = "http://192.168.0.100:5004/api" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteFolder = async () => {
    if (!confirm("Are you sure you want to delete this folder?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/folder/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFolders(folders.filter(f => f._id !== id));
        setSelectedFolder(null);
      } else {
        setError("Failed to delete folder");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      setError("Error deleting folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={deleteFolder}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded transition-colors"
      >
        <Trash2 size={18} />
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
}