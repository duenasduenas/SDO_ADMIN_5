import { useState } from 'react';
import { Eye } from 'lucide-react';

export default function OpenFolder({ folder, API_BASE_URL, onFolderOpen, onRecordsLoaded, children }) {
  const [loading, setLoading] = useState(false);

  const handleOpenFolder = async (e) => {
    if (e) {
      e.stopPropagation();
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/folder/${folder._id}`);
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        console.log("Folder API Response:", data);
        console.log("Folder records:", data?.folder?.records);
        console.log("Folder record (singular):", data?.folder?.record);

        // Check for both 'records' and 'record' (singular) due to potential database inconsistency
        const recordsArray = data?.folder?.records || data?.folder?.record || [];

        if (Array.isArray(recordsArray) && recordsArray.length > 0) {
          // Ensure each record has a valid _id
          const normalizedRecords = recordsArray.map(r => ({
            ...r,
            _id: r._id || r.id, // fallback for missing _id
          }));
          console.log("Normalized records:", normalizedRecords);
          onRecordsLoaded(normalizedRecords);
        } else {
          console.log("No records array found or data structure issue");
          onRecordsLoaded([]);
        }

        onFolderOpen(folder);
      }
    } catch (error) {
      console.error("Error fetching folder details:", error);
      onRecordsLoaded([]);
    } finally {
      setLoading(false);
    }
  };

  // If children are provided, make the entire container clickable
  if (children) {
    return (
      <div
        onClick={handleOpenFolder}
        className="cursor-pointer"
        disabled={loading}
      >
        {children}
      </div>
    );
  }

  // Otherwise, render as a button
  return (
    <button
      onClick={handleOpenFolder}
      disabled={loading}
      className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 transition"
      title="Open folder"
    >
      <Eye className="w-4 h-4 text-gray-500" />
    </button>
  );
}