import { useState } from "react";
import { X } from "lucide-react";

export default function WeeklySummaryModal({
  isOpen,
  onClose,
  apiBaseUrl
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  // ✅ Calculate ISO week number from date
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // ✅ summary generator (now includes ALL categories AND records by day)
  const generateWeeklySummary = (records) => {
    if (!records.length) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDay = {};
    const categories = {};
    let withFolder = 0;

    records.forEach(r => {
      const day = r.dateInfo.dayName;
      const fullDate = r.dateInfo.fullDate;
      
      byDay[day] = (byDay[day] || 0) + 1;
      
      // Group records by day
      if (!recordsByDay[day]) {
        recordsByDay[day] = { date: fullDate, records: [], categories: {} };
      }
      recordsByDay[day].records.push(r);
      
      // Track categories per day
      if (r.category) {
        recordsByDay[day].categories[r.category] = (recordsByDay[day].categories[r.category] || 0) + 1;
      }

      if (r.category) {
        categories[r.category] = (categories[r.category] || 0) + 1;
      }

      if (r.folder?.length > 0) withFolder++;
    });

    const mostActiveDay = Object.entries(byDay)
      .sort((a, b) => b[1] - a[1])[0];

    const sortedByTime = [...records].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Sort days chronologically
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedRecordsByDay = dayOrder
      .filter(day => recordsByDay[day])
      .map(day => ({ day, ...recordsByDay[day] }));

    // Calculate week number from first record
    const weekNumber = sortedByTime.length > 0 
      ? (sortedByTime[0].dateInfo.weekNumber || getWeekNumber(sortedByTime[0].dateInfo.fullDate))
      : null;

    return {
      totalRecords: total,
      weekNumber: weekNumber,
      dateRange: `${sortedByTime[0].dateInfo.fullDate} – ${sortedByTime.at(-1).dateInfo.fullDate}`,
      mostActiveDay: mostActiveDay
        ? `${mostActiveDay[0]} (${mostActiveDay[1]} records)`
        : "N/A",
      allCategories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1]),
      folderUsage: {
        withFolder,
        withoutFolder: total - withFolder
      },
      latestRecord: sortedByTime.at(-1).title,
      recordsByDay: sortedRecordsByDay
    };
  };

  // ✅ fetch + generate
  const fetchWeeklyRecords = async () => {
    if (!week) return alert("Please enter a week number");

    try {
      setLoading(true);
      const res = await fetch(
        `${apiBaseUrl}/record/week-record/${year}/${week}`
      );
      const data = await res.json();

      setWeeklyRecords(data.records);
      const summaryData = generateWeeklySummary(data.records);
      // Use the inputted week number instead of calculated one
      if (summaryData) {
        summaryData.weekNumber = week;
      }
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to fetch weekly records", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Weekly Summary
        </h2>

        {/* INPUTS */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Week Number</label>
            <input
              type="number"
              min="1"
              max="53"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* SUMMARY OUTPUT */}
        {summary && (
          <div className="mt-6 flex-1 overflow-y-auto">
            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
              {/* Week Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                <h3 className="text-lg font-bold">
                  Week {summary.weekNumber} - {year}
                </h3>
                <p className="text-blue-100 text-sm">
                  {summary.totalRecords} total records
                </p>
              </div>

              {/* Summary Stats */}
              <div className="bg-white p-3 rounded border">
                <p><strong>Date Range:</strong> {summary.dateRange}</p>
                <p><strong>Most Active Day:</strong> {summary.mostActiveDay}</p>
              </div>

              {/* Categories */}
              <div className="bg-white p-3 rounded border">
                <strong>All Categories:</strong>
                {summary.allCategories.length > 0 ? (
                  <ul className="list-disc ml-5 mt-1">
                    {summary.allCategories.map(([cat, count]) => (
                      <li key={cat}>{cat} ({count} records)</li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-5 italic">None</p>
                )}
              </div>

              {/* Folder Usage */}
              <div className="bg-white p-3 rounded border">
                <p>
                  <strong>Folder Usage:</strong>{" "}
                  {summary.folderUsage.withFolder} in folders,{" "}
                  {summary.folderUsage.withoutFolder} not in folders
                </p>
              </div>

              {/* Latest Record */}
              <div className="bg-white p-3 rounded border">
                <p><strong>Latest Record:</strong> {summary.latestRecord}</p>
              </div>

              {/* Records by Day */}
              <div className="bg-white p-3 rounded border">
                <strong className="block mb-3">Records by Day:</strong>
                {summary.recordsByDay && summary.recordsByDay.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recordsByDay.map(({ day, date, records, categories }) => (
                      <div key={day} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                        <p className="font-semibold text-blue-700 mb-2">
                          {day}, {date}
                          <span className="ml-2 text-xs font-normal text-gray-600">
                            ({records.length} record{records.length !== 1 ? 's' : ''})
                          </span>
                        </p>
                        
                        {/* Category breakdown for this day */}
                        {Object.keys(categories).length > 0 && (
                          <div className="mb-2 text-sm">
                            {Object.entries(categories).map(([cat, count]) => (
                              <span key={cat} className="inline-block mr-2 mb-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {cat} ({count})
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {records.map((record, idx) => (
                            <div key={idx} className="text-sm pl-3 py-1 border-l-2 border-blue-300 bg-white rounded">
                              <span className="font-medium text-gray-800">{record.title}</span>
                              {record.category && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {record.category}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ml-5 italic text-gray-500">No records found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={fetchWeeklyRecords}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}