import { useState } from "react";
import { X } from "lucide-react";

export default function WeeklySummaryModal({ isOpen, onClose, apiBaseUrl }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [folderNames, setFolderNames] = useState({});
  const [categoryNames, setCategoryNames] = useState({});

  // Calculate ISO week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Generate weekly summary
  const generateWeeklySummary = (records) => {
    if (!Array.isArray(records) || records.length === 0) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDay = {};
    const categories = {};
    const folders = {};
    let withFolder = 0;

    records.forEach((r) => {
      const day = r.dateInfo?.dayName ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { weekday: "long" }) : "N/A");
      const fullDate = r.dateInfo?.fullDate ?? (r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "N/A");

      byDay[day] = (byDay[day] || 0) + 1;

      if (!recordsByDay[day]) recordsByDay[day] = { date: fullDate, records: [], categories: {} };
      recordsByDay[day].records.push(r);

      // Categories
      if (r.category) {
        const catId = typeof r.category === "string" ? r.category : r.category._id;
        recordsByDay[day].categories[catId] = (recordsByDay[day].categories[catId] || 0) + 1;
        categories[catId] = (categories[catId] || 0) + 1;
      }

      // Folders
      if (Array.isArray(r.folder) && r.folder.length > 0) {
        r.folder.forEach(f => {
          const folderId = typeof f === "string" ? f : f._id;
          folders[folderId] = (folders[folderId] || 0) + 1;
        });
        withFolder++;
      }
    });

    const mostActiveDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

    const sortedByTime = [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedRecordsByDay = dayOrder
      .filter(day => recordsByDay[day])
      .map(day => ({ day, ...recordsByDay[day] }));

    const weekNumber = sortedByTime.length > 0
      ? (sortedByTime[0].dateInfo?.weekNumber || getWeekNumber(sortedByTime[0].dateInfo?.fullDate))
      : week;

    return {
      totalRecords: total,
      weekNumber,
      dateRange: sortedByTime.length > 0
        ? `${sortedByTime[0].dateInfo?.fullDate ?? "N/A"} – ${sortedByTime.at(-1)?.dateInfo?.fullDate ?? "N/A"}`
        : "N/A",
      mostActiveDay: mostActiveDay ? `${mostActiveDay[0]} (${mostActiveDay[1]} records)` : "N/A",
      allCategories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
      allFolders: Object.entries(folders).sort((a, b) => b[1] - a[1]),
      folderUsage: { withFolder, withoutFolder: total - withFolder },
      latestRecord: sortedByTime.length > 0 ? sortedByTime.at(-1)?.title ?? "N/A" : "N/A",
      recordsByDay: sortedRecordsByDay
    };
  };

  const fetchWeeklyRecords = async () => {
    if (!week) return alert("Please enter a week number");

    try {
      setLoading(true);
      setAiLoading(true);

      // Fetch weekly records
      const res = await fetch(`${apiBaseUrl}/record/week-record/${year}/${week}`);
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      setWeeklyRecords(records);

      // Fetch folders
      const folderIds = new Set();
      records.forEach(r => r.folder?.forEach(f => folderIds.add(typeof f === "string" ? f : f._id)));
      const folderNameMap = {};
      if (folderIds.size > 0) {
        const folderRes = await fetch(`${apiBaseUrl}/folder`);
        const folderData = await folderRes.json();
        (folderData.folders || []).forEach(f => {
          if (folderIds.has(f._id)) folderNameMap[f._id] = f.name;
        });
      }
      setFolderNames(folderNameMap);

      // Fetch categories
      const categoryIds = new Set();
      records.forEach(r => { if (r.category) categoryIds.add(typeof r.category === "string" ? r.category : r.category._id); });
      const categoryNameMap = {};
      if (categoryIds.size > 0) {
        const catRes = await fetch(`${apiBaseUrl}/category`);
        const catData = await catRes.json();
        (catData.categories || []).forEach(c => {
          if (categoryIds.has(c._id)) categoryNameMap[c._id] = c.name;
        });
      }
      setCategoryNames(categoryNameMap);

      // Local summary
      const localSummary = generateWeeklySummary(records);
      setSummary(localSummary);

      // AI summary
      try {
        const ragRes = await fetch(`${apiBaseUrl}/ai/rag-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period: "weekly", year, week, records })
        });
        if (ragRes.ok) {
          const ragData = await ragRes.json();
          setAiSummary(ragData.summary ?? "AI summary not available");
        } else {
          setAiSummary("AI summary not available");
        }
      } catch (err) {
        console.error("RAG AI fetch error:", err);
        setAiSummary("AI summary not available");
      }

    } catch (err) {
      console.error("Failed to fetch weekly records", err);
      setSummary(null);
      setAiSummary(null);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">Weekly Summary</h2>

        {/* INPUTS */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Week Number</label>
            <input type="number" min="1" max="53" value={week} onChange={(e) => setWeek(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        {/* SUMMARY */}
        {summary ? (
          <div className="mt-6 flex-1 overflow-y-auto space-y-4 text-sm">

            {/* Week Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold">Week {summary.weekNumber} - {year}</h3>
              <p className="text-blue-100 text-sm">{summary.totalRecords} total records</p>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg">
              <h3 className="font-semibold mb-1">AI Weekly Insight</h3>
              {aiLoading ? (
                <p className="text-purple-100 italic">Analyzing weekly records...</p>
              ) : (
                <p className="text-sm leading-relaxed">{aiSummary}</p>
              )}
            </div>

            {/* All Folders */}
            <div className="bg-white p-3 rounded border">
              <strong>All Folders:</strong>
              {summary.allFolders.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {summary.allFolders.map(([id, count]) => (
                    <li key={id}>{folderNames[id] ?? id} ({count} records)</li>
                  ))}
                </ul>
              ) : <p className="ml-5 italic">None</p>}
            </div>

            {/* All Categories */}
            <div className="bg-white p-3 rounded border">
              <strong>All Categories:</strong>
              {summary.allCategories.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {summary.allCategories.map(([id, count]) => (
                    <li key={id}>{categoryNames[id] ?? id} ({count} records)</li>
                  ))}
                </ul>
              ) : <p className="ml-5 italic">None</p>}
            </div>

            {/* Records by Day */}
            {summary.recordsByDay.map(({ day, date, records, categories }) => (
              <div key={day} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500 mb-2">
                <p className="font-semibold text-blue-700 mb-2">
                  {day}, {date} ({records.length} record{records.length !== 1 ? 's' : ''})
                </p>

                {/* Categories */}
                {categories && Object.keys(categories).length > 0 && (
                  <div className="mb-2 text-sm">
                    {Object.entries(categories).map(([cat, count]) => (
                      <span key={cat} className="inline-block mr-2 mb-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {categoryNames[cat] ?? cat} ({count})
                      </span>
                    ))}
                  </div>
                )}

                {/* Records */}
                <div className="space-y-1.5">
                  {records.map((record, idx) => (
                    <div key={idx} className="text-sm pl-3 py-1 border-l-2 border-blue-300 bg-white rounded">
                      <span className="font-medium text-gray-800">{record.title ?? "Untitled"}</span>
                      {record.category && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {typeof record.category === "string" ? categoryNames[record.category] ?? record.category : record.category?.name ?? record.category?._id}
                        </span>
                      )}
                      {Array.isArray(record.folder) && record.folder.map(f => (
                        <span key={typeof f === "string" ? f : f._id} className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                          {typeof f === "string" ? folderNames[f] ?? f : f.name ?? f._id}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          </div>
        ) : (
          <p className="text-gray-500 italic mt-4">No summary available. Click "Generate" to fetch data.</p>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Close</button>
          <button onClick={fetchWeeklyRecords} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
