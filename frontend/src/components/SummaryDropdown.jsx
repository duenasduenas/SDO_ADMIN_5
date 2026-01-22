import { useState } from "react";

export default function SummaryDropdown({ apiBaseUrl, onResult }) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const getWeekNumber = (date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date - firstDay) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  };

  const week = getWeekNumber(today);

  const fetchSummary = async (type) => {
    try {
      let url = "";

      if (type === "day") {
        url = `${apiBaseUrl}/record/day-record/${year}/${month}/${day}`;
      } else if (type === "week") {
        url = `${apiBaseUrl}/record/week-record/${year}/${week}`;
      } else if (type === "month") {
        url = `${apiBaseUrl}/record/month-record/${year}/${month}`;
      } else if (type === "all") {
        url = `${apiBaseUrl}/record/`;
      }

      console.log("Fetching from:", url); // Debug log
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Received data:", data); // Debug log
      onResult(data.records || data || []); // Handle different response formats
      setOpen(false);
    } catch (error) {
      console.error("Error fetching summary:", error);
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
}