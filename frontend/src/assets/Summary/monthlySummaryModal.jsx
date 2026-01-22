import { useState } from "react";
import { X } from "lucide-react";

export default function MonthlySummaryModal({
  isOpen,
  onClose,
  apiBaseUrl
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
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

  // ✅ summary generator for monthly data
  const generateMonthlySummary = (records) => {
    if (!records.length) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDate = {};
    const recordsByWeek = {};
    const categories = {};
    const weeklyBreakdown = {};
    let withFolder = 0;

    records.forEach(r => {
      const day = r.dateInfo.dayName;
      const fullDate = r.dateInfo.fullDate;
      
      byDay[day] = (byDay[day] || 0) + 1;
      
      // Group records by full date
      if (!recordsByDate[fullDate]) {
        recordsByDate[fullDate] = { day, records: [], categories: {} };
      }
      recordsByDate[fullDate].records.push(r);
      
      // Track categories per date
      if (r.category) {
        recordsByDate[fullDate].categories[r.category] = (recordsByDate[fullDate].categories[r.category] || 0) + 1;
      }

      // Calculate week number from date
      const weekNum = r.dateInfo.weekNumber || getWeekNumber(fullDate);
      weeklyBreakdown[weekNum] = (weeklyBreakdown[weekNum] || 0) + 1;
      
      if (!recordsByWeek[weekNum]) {
        recordsByWeek[weekNum] = [];
      }
      recordsByWeek[weekNum].push(r);

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

    // Sort dates chronologically
    const sortedRecordsByDate = Object.entries(recordsByDate)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, data]) => ({ date, ...data }));

    // Sort weeks and prepare records by week
    const sortedRecordsByWeek = Object.entries(recordsByWeek)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([week, weekRecords]) => ({
        week,
        count: weekRecords.length,
        records: weekRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }));

    return {
      totalRecords: total,
      dateRange: `${sortedByTime[0].dateInfo.fullDate} – ${sortedByTime.at(-1).dateInfo.fullDate}`,
      mostActiveDay: mostActiveDay
        ? `${mostActiveDay[0]} (${mostActiveDay[1]} records)`
        : "N/A",
      allCategories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1]),
      weeklyBreakdown: Object.entries(weeklyBreakdown)
        .sort((a, b) => Number(a[0]) - Number(b[0])),
      folderUsage: {
        withFolder,
        withoutFolder: total - withFolder
      },
      latestRecord: sortedByTime.at(-1).title,
      recordsByDate: sortedRecordsByDate,
      recordsByWeek: sortedRecordsByWeek,
      averagePerDay: (total / sortedRecordsByDate.length).toFixed(1)
    };
  };

  // ✅ fetch + generate
  const fetchMonthlyRecords = async () => {
    if (!month) return alert("Please enter a month number (1-12)");

    try {
      setLoading(true);
      const res = await fetch(
        `${apiBaseUrl}/record/month-record/${year}/${month}`
      );
      const data = await res.json();

      setMonthlyRecords(data.records);
      setSummary(generateMonthlySummary(data.records));
    } catch (err) {
      console.error("Failed to fetch monthly records", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Monthly Summary
        </h2>

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm text-gray-600 mb-1">Month (1-12)</label>
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* SUMMARY OUTPUT */}
        {summary && (
          <div className="mt-6 flex-1 overflow-y-auto">
            <div className="space-y-3 text-sm">
              {/* Month Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                <h3 className="text-lg font-bold">
                  {monthNames[Number(month) - 1]} {year}
                </h3>
                <p className="text-blue-100 text-sm">
                  {summary.totalRecords} total records • {summary.averagePerDay} avg per day
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600 text-xs mb-1">Date Range</p>
                  <p className="font-semibold">{summary.dateRange}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600 text-xs mb-1">Most Active Day</p>
                  <p className="font-semibold">{summary.mostActiveDay}</p>
                </div>
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

              {/* Weekly Breakdown */}
              <div className="bg-white p-3 rounded border">
                <strong className="block mb-2">Weekly Breakdown:</strong>
                <div className="grid grid-cols-2 gap-2">
                  {summary.weeklyBreakdown.map(([week, count]) => (
                    <div key={week} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                      <span className="text-gray-700">Week {week}</span>
                      <span className="font-semibold text-blue-600">{count} records</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder Usage */}
              <div className="bg-white p-3 rounded border">
                <p>
                  <strong>Folder Usage:</strong>{" "}
                  {summary.folderUsage.withFolder} in folders,{" "}
                  {summary.folderUsage.withoutFolder} not in folders
                </p>
              </div>

              {/* Records by Week */}
              <div className="bg-white p-3 rounded border">
                <strong className="block mb-3">Records by Week:</strong>
                {summary.recordsByWeek && summary.recordsByWeek.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recordsByWeek.map(({ week, count, records }) => (
                      <div key={week} className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                        <p className="font-semibold text-purple-700 mb-2">
                          Week {week}
                          <span className="ml-2 text-xs font-normal text-gray-600">
                            ({count} record{count !== 1 ? 's' : ''})
                          </span>
                        </p>
                        <div className="space-y-1.5">
                          {records.map((record, idx) => (
                            <div key={idx} className="text-sm pl-3 py-1 border-l-2 border-purple-300 bg-white rounded">
                              <span className="text-xs text-gray-500">{record.dateInfo.fullDate} ({record.dateInfo.dayName})</span>
                              <br />
                              <span className="font-medium text-gray-800">{record.title}</span>
                              {record.category && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
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

              {/* Records by Date */}
              <div className="bg-white p-3 rounded border">
                <strong className="block mb-3">Records by Date:</strong>
                {summary.recordsByDate && summary.recordsByDate.length > 0 ? (
                  <div className="space-y-3">
                    {summary.recordsByDate.map(({ date, day, records, categories }) => (
                      <div key={date} className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                        <p className="font-semibold text-green-700 mb-2">
                          {day}, {date}
                          <span className="ml-2 text-xs font-normal text-gray-600">
                            ({records.length} record{records.length !== 1 ? 's' : ''})
                          </span>
                        </p>
                        
                        {/* Category breakdown for this date */}
                        {Object.keys(categories).length > 0 && (
                          <div className="mb-2 text-sm">
                            {Object.entries(categories).map(([cat, count]) => (
                              <span key={cat} className="inline-block mr-2 mb-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {cat} ({count})
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {records.map((record, idx) => (
                            <div key={idx} className="text-sm pl-3 py-1 border-l-2 border-green-300 bg-white rounded">
                              <span className="font-medium text-gray-800">{record.title}</span>
                              {record.category && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
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
            onClick={fetchMonthlyRecords}
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