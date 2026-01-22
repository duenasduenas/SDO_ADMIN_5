// SummaryDropdown.jsx
import { useState } from "react";

// Define the component as a function
const SummaryDropdown = ({ apiBaseUrl, year, week, month, day, onResult }) => {  // Add props as needed (e.g., for apiBaseUrl, year, etc.)
  const [open, setOpen] = useState(false);

  const fetchSummary = async (type) => {
    let recordsUrl = "";
    let periodLabel = "";

    if (type === "day") {
      recordsUrl = `${apiBaseUrl}/record/day-record/${year}/${month}/${day}`;
      periodLabel = "daily";
    } else if (type === "week") {
      recordsUrl = `${apiBaseUrl}/record/week-record/${year}/${week}`;
      periodLabel = "weekly";
    } else if (type === "month") {
      recordsUrl = `${apiBaseUrl}/record/month-record/${year}/${month}`;
      periodLabel = "monthly";
    } else if (type === "all") {
      recordsUrl = `${apiBaseUrl}/record/all-records`;  // Adjust URL if needed
      periodLabel = "all-time";
    }

    try {
      const res = await fetch(recordsUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch records: ${res.statusText}`);
      }
      const data = await res.json();

      onResult(data.records || []);

      if (data.records && data.records.length > 0) {
        const aiRes = await fetch(`${apiBaseUrl}/ai/summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records: data.records,
            period: periodLabel
          })
        });

        if (!aiRes.ok) {
          throw new Error(`AI summary failed: ${aiRes.statusText}`);
        }

        const aiData = await aiRes.json();
        console.log("AI Summary:", aiData.summary);
        // Optionally, handle aiData.summary (e.g., display it in the UI)
      } else {
        console.log("No records to summarize.");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      // Optionally, show an error message to the user
    } finally {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="
          px-4 py-2 text-sm font-medium
          text-gray-600 hover:text-gray-900
          transition
        "
      >
        Sort By
      </button>

      {open && (
        <div
          className="
            absolute left-0 mt-0 w-36
            bg-white border border-gray-200
            rounded-lg shadow-md z-20
          "
        >
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
        </div>
      )}
    </div>
  );
};

export default SummaryDropdown;