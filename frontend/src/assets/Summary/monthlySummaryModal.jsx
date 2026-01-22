import { useState } from "react";
import { X } from "lucide-react";

export default function MonthlySummaryModal({ isOpen, onClose, apiBaseUrl }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [folderNames, setFolderNames] = useState({});

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const generateMonthlySummary = (records) => {
    if (!Array.isArray(records) || records.length === 0) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDate = {};
    const recordsByWeek = {};
    const categories = {};
    const folders = {};
    const weeklyBreakdown = {};
    let withFolder = 0;

    records.forEach(r => {
      const day = r.dateInfo?.dayName || "Unknown";
      const fullDate = r.dateInfo?.fullDate || "Unknown";

      byDay[day] = (byDay[day] || 0) + 1;

      if (!recordsByDate[fullDate]) recordsByDate[fullDate] = { day, records: [], categories: {} };
      recordsByDate[fullDate].records.push(r);

      if (r.category) {
        recordsByDate[fullDate].categories[r.category] =
          (recordsByDate[fullDate].categories[r.category] || 0) + 1;
        categories[r.category] = (categories[r.category] || 0) + 1;
      }

      if (r.folder?.length > 0) {
        r.folder.forEach(f => {
          const folderId = typeof f === "string" ? f : f._id;
          folders[folderId] = (folders[folderId] || 0) + 1;
        });
        withFolder++;
      }

      const weekNum = r.dateInfo?.weekNumber || getWeekNumber(fullDate);
      weeklyBreakdown[weekNum] = (weeklyBreakdown[weekNum] || 0) + 1;

      if (!recordsByWeek[weekNum]) recordsByWeek[weekNum] = [];
      recordsByWeek[weekNum].push(r);
    });

    const mostActiveDay = Object.entries(byDay)
      .sort((a, b) => b[1] - a[1])[0];

    const sortedByTime = [...records].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const sortedRecordsByDate = Object.entries(recordsByDate)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    const sortedRecordsByWeek = Object.entries(recordsByWeek)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([week, weekRecords]) => ({
        week,
        count: weekRecords.length,
        records: weekRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }));

    return {
      totalRecords: total,
      dateRange: sortedByTime.length > 0
        ? `${sortedByTime[0]?.dateInfo?.fullDate || "N/A"} – ${sortedByTime.at(-1)?.dateInfo?.fullDate || "N/A"}`
        : "N/A",
      mostActiveDay: mostActiveDay ? `${mostActiveDay[0]} (${mostActiveDay[1]} records)` : "N/A",
      allCategories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
      allFolders: Object.entries(folders).sort((a, b) => b[1] - a[1]),
      weeklyBreakdown: Object.entries(weeklyBreakdown)
        .sort((a, b) => Number(a[0]) - Number(b[0])),
      folderUsage: { withFolder, withoutFolder: total - withFolder },
      latestRecord: sortedByTime.length > 0 ? sortedByTime.at(-1)?.title || "N/A" : "N/A",
      recordsByDate: sortedRecordsByDate,
      recordsByWeek: sortedRecordsByWeek,
      averagePerDay: sortedRecordsByDate.length > 0
        ? (total / sortedRecordsByDate.length).toFixed(1)
        : "0"
    };
  };

  const fetchMonthlyRecords = async () => {
    if (!month) return alert("Please enter a month number (1-12)");

    try {
      setLoading(true);

      const res = await fetch(`${apiBaseUrl}/record/month-record/${year}/${month}`);
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      setMonthlyRecords(records);

      // Fetch folder names
      const folderIds = new Set();
      records.forEach(r => {
        if (r.folder?.length > 0) {
          r.folder.forEach(f => folderIds.add(typeof f === "string" ? f : f._id));
        }
      });

      const folderNameMap = {};
      if (folderIds.size > 0) {
        try {
          const folderRes = await fetch(`${apiBaseUrl}/folder`);
          const folderData = await folderRes.json();
          if (Array.isArray(folderData.folders)) {
            folderData.folders.forEach(folder => {
              if (folderIds.has(folder._id)) {
                folderNameMap[folder._id] = folder.name;
              }
            });
          }
        } catch (err) {
          console.error("Failed to fetch folder names:", err);
        }
      }
      setFolderNames(folderNameMap);

      const localSummary = generateMonthlySummary(records) || {};

      let aiSummary = null;
      let keywords = [];
      try {
        const ragRes = await fetch(`${apiBaseUrl}/ai/rag-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period: "monthly", records })
        });

        if (ragRes.ok) {
          const ragData = await ragRes.json();
          aiSummary = ragData.summary || null;
          keywords = Array.isArray(ragData.keywords) ? ragData.keywords : [];
        } else {
          console.warn("RAG API returned status:", ragRes.status);
        }
      } catch (err) {
        console.error("RAG API error:", err);
      }

      setSummary({ ...localSummary, aiSummary, keywords });
    } catch (err) {
      console.error("Failed to fetch monthly records", err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month (1-12)</label>
            <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        {/* SUMMARY OUTPUT */}
        {summary ? (
          <div className="mt-6 flex-1 overflow-y-auto space-y-4 text-sm">

            {/* Month Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold">{monthNames[Number(month) - 1] || "Unknown"} {year}</h3>
              <p className="text-blue-100 text-sm">{summary.totalRecords || 0} total records • {summary.averagePerDay} avg per day</p>
            </div>

            {/* AI RAG Summary */}
            {summary.aiSummary && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm font-semibold text-yellow-800 mb-1">AI Monthly Insight</p>
                <p className="text-sm text-gray-700 leading-relaxed">{summary.aiSummary}</p>
                {summary.keywords?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {summary.keywords.map(k => (
                      <span key={k} className="px-2 py-1 text-xs bg-yellow-200 text-yellow-900 rounded">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Folders */}
            <div className="bg-white p-3 rounded border">
              <strong>All Folders:</strong>
              {Array.isArray(summary.allFolders) && summary.allFolders.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {summary.allFolders.map(([folderId, count]) => (
                    <li key={folderId}>{folderNames[folderId] || folderId} ({count} records)</li>
                  ))}
                </ul>
              ) : (<p className="ml-5 italic">None</p>)}
            </div>

            {/* Records by Week */}
            {Array.isArray(summary.recordsByWeek) && summary.recordsByWeek.length > 0 ? (
              summary.recordsByWeek.map(({ week, count, records }) => (
                <div key={week} className="p-3 bg-purple-50 rounded border-l-4 border-purple-500 mb-3">
                  <p className="font-semibold text-purple-700 mb-2">
                    Week {week} <span className="ml-2 text-xs font-normal text-gray-600">({count} record{count !== 1 ? 's' : ''})</span>
                  </p>
                  <div className="space-y-1.5">
                    {Array.isArray(records) && records.map((record, idx) => (
                      <div key={idx} className="text-sm pl-3 py-1 border-l-2 border-purple-300 bg-white rounded">
                        <span className="text-xs text-gray-500">{record.dateInfo?.fullDate || "N/A"} ({record.dateInfo?.dayName || "N/A"})</span>
                        <br />
                        <span className="font-medium text-gray-800">{record.title || "Untitled"}</span>
                        {/* Folders */}
                        {Array.isArray(record.folder) && record.folder.map(f => {
                          const folderName = typeof f === "string" ? folderNames[f] || f : f.name;
                          return (
                            <span key={typeof f === "string" ? f : f._id} className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {folderName}
                            </span>
                          );
                        })}
                        {record.category && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded">{record.category}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="ml-5 italic text-gray-500">No records found</p>
            )}


          </div>
        ) : (
          <p className="text-gray-500 italic mt-4">No summary available. Click "Generate" to fetch data.</p>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Close</button>
          <button onClick={fetchMonthlyRecords} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>

      </div>
    </div>
  );
}
