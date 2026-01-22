// DeleteCategoryButton.jsx
import React, { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteCategoryButton({ categoryId, categoryName, apiBaseUrl, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/category/${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Cannot delete category");
        return;
      }

      onDeleted(categoryId); // update parent state
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 hover:bg-gray-200 rounded flex items-center gap-1 text-red-600"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
