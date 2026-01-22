import { useState } from "react";

const SummaryDropdown = ({
  apiBaseUrl,
  year,
  week,
  month,
  day,
  onResult,
  categories = [],
  onDeleteCategory,
}) => {
  const [open, setOpen] = useState(false);

  const fetchSummary = async (type, categoryId = null) => {
    let recordsUrl = "";
    let periodLabel = "";

    try {
      // Only fetch day/week/month if year/month/week/day are defined
      if (type === "day" && year && month && day) {
        recordsUrl = `${apiBaseUrl}/record/day-record/${year}/${month}/${day}`;
        periodLabel = "daily";
      } else if (type === "week" && year && week) {
        recordsUrl = `${apiBaseUrl}/record/week-record/${year}/${week}`;
        periodLabel = "weekly";
      } else if (type === "month" && year && month) {
        recordsUrl = `${apiBaseUrl}/record/month-record/${year}/${month}`;
        periodLabel = "monthly";
      } else if (type === "all") {
        recordsUrl = `${apiBaseUrl}/record/`;
        periodLabel = "all-time";
      } else if (type === "category" && categoryId) {
        recordsUrl = `${apiBaseUrl}/record/category/${categoryId}`;
        periodLabel = "category";
      } else {
        console.warn(`Skipping fetch for ${type} because required params are missing`);
        return;
      }

      const res = await fetch(recordsUrl);
      if (!res.ok) throw new Error(`Failed to fetch records: ${res.statusText}`);
      const data = await res.json();
      onResult(data.records || []);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setOpen(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`${apiBaseUrl}/category/${categoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      onDeleteCategory(categoryId);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
        Sort By
      </button>

      {open && (
        <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-200 rounded-lg shadow-md z-20">
          {/* Time Filters */}
          <p className="px-4 py-1 text-xs text-gray-400 uppercase">Time</p>
          <button
            onClick={() => fetchSummary("day")}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Daily
          </button>
          <button
            onClick={() => fetchSummary("week")}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Weekly
          </button>
          <button
            onClick={() => fetchSummary("month")}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            Monthly
          </button>
          <button
            onClick={() => fetchSummary("all")}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
          >
            All
          </button>

          {/* Categories */}
          <p className="px-4 py-1 mt-2 text-xs text-gray-400 uppercase border-t border-gray-200">
            Category
          </p>
          {categories.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-500">No categories</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
              >
                <button
                  onClick={() => fetchSummary("category", cat._id)}
                  className="text-left text-sm text-gray-700 truncate"
                >
                  {cat.name}
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="text-red-500 text-sm hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryDropdown;
