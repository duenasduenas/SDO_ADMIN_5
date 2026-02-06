import { useState } from 'react';
import { Eye } from 'lucide-react';

export default function OpenFolder({ folder, onFolderOpen, onRecordsLoaded, children }) {
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = 'http://192.168.0.100:5004/api';

  // Fetch folders and categories

  const handleOpenFolder = async (e) => {
    if (e) {
      e.stopPropagation();
    }

    console.log("📂 Opening folder:", folder);
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/folder/${folder._id}`;
      console.log("🔗 Fetching from:", url);
      
      const response = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });
      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        const text = await response.text();
        console.log("📝 Response text:", text);
        
        const data = text ? JSON.parse(text) : null;
        console.log("📊 Parsed data:", data);

        // Check for both 'records' and 'record' (singular) due to potential database inconsistency
        const recordsArray = data?.folder?.records || data?.folder?.record || [];
        console.log("📋 Records array:", recordsArray);

        if (Array.isArray(recordsArray)) {
          const normalizedRecords = recordsArray.map(r => ({
            ...r,
            _id: r._id || r.id,
          }));
          console.log("✅ Normalized records:", normalizedRecords);
          onRecordsLoaded(normalizedRecords);
        } else {
          console.log("❌ No records array found");
          onRecordsLoaded([]);
        }

        onFolderOpen(folder);
        console.log("✅ Folder opened successfully");
      } else {
        console.error("❌ Response not ok, status:", response.status);
        const text = await response.text();
        console.error("❌ Error response:", text);
        onRecordsLoaded([]);
      }
    } catch (error) {
      console.error("❌ Error fetching folder details:", error);
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
        className={`cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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