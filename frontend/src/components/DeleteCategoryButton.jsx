import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteCategoryButton({ categoryName, categories, setCategories, apiBaseUrl }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete category "${categoryName}"?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/category/${categoryName}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setCategories(categories.filter(c => c !== categoryName));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1 p-1 text-red-600 hover:bg-red-100 rounded"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
