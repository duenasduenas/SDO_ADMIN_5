import { useState } from "react";
import { X, BarChart3, PieChartIcon } from "lucide-react";
import { API_BASE_URL } from "../../../config.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis, 
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function WeeklySummaryModal({ isOpen, onClose }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [folderNames, setFolderNames] = useState({});
  const [categoryNames, setCategoryNames] = useState({});

  if (!isOpen) return null;

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const generateWeeklySummary = (records) => {
    if (!Array.isArray(records) || records.length === 0) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDay = {};
    const categories = {};
    const folders = {};

    records.forEach((r) => {
      const day = r.dateInfo?.dayName ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { weekday: "long" }) : "N/A");
      const fullDate = r.dateInfo?.fullDate ?? (r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "N/A");

      byDay[day] = (byDay[day] || 0) + 1;

      if (!recordsByDay[day]) recordsByDay[day] = { date: fullDate, records: [], categories: {} };
      recordsByDay[day].records.push(r);

      if (r.category) {
        const catId = typeof r.category === "string" ? r.category : r.category._id;
        recordsByDay[day].categories[catId] = (recordsByDay[day].categories[catId] || 0) + 1;
        categories[catId] = (categories[catId] || 0) + 1;
      }

      if (Array.isArray(r.folder) && r.folder.length > 0) {
        r.folder.forEach(f => {
          const folderId = typeof f === "string" ? f : f._id;
          folders[folderId] = (folders[folderId] || 0) + 1;
        });
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
      byDay,  // Added for BarChart
      allCategories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
      allFolders: Object.entries(folders).sort((a, b) => b[1] - a[1]),
      recordsByDay: sortedRecordsByDay
    };
  };

  const fetchWeeklyRecords = async () => {
    if (!week) return alert("Please enter a week number");

    try {
      setLoading(true);
      setAiLoading(true);

      const res = await fetch(`${API_BASE_URL}/record/week-record/${year}/${week}`, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      setWeeklyRecords(records);

      const folderIds = new Set();
      records.forEach(r => {
        if (r.folder) {
          const folders = Array.isArray(r.folder) ? r.folder : [r.folder];
          folders.forEach(f => folderIds.add(typeof f === "string" ? f : f._id));
        }
      });
      const folderNameMap = {};
      if (folderIds.size > 0) {
        const folderRes = await fetch(`${API_BASE_URL}/folder`, {
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        });
        const folderData = await folderRes.json();
        (folderData.folders || []).forEach(f => {
          if (folderIds.has(f._id)) folderNameMap[f._id] = f.name;
        });
      }
      setFolderNames(folderNameMap);

      const categoryIds = new Set();
      records.forEach(r => { if (r.category) categoryIds.add(typeof r.category === "string" ? r.category : r.category._id); });
      const categoryNameMap = {};
      if (categoryIds.size > 0) {
        const catRes = await fetch(`${API_BASE_URL}/category`, {
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        });
        const catData = await catRes.json();
        (catData.categories || []).forEach(c => {
          if (categoryIds.has(c._id)) categoryNameMap[c._id] = c.name;
        });
      }
      setCategoryNames(categoryNameMap);

      const localSummary = generateWeeklySummary(records);
      setSummary(localSummary);

      try {
        const ragRes = await fetch(`${API_BASE_URL}/ai/rag-summary`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ period: "weekly", records })
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

  // Chart data prep
  const getByDayData = () => summary?.byDay ? 
    Object.entries(summary.byDay).map(([day, count]) => ({ name: day, count })) : [];

  const getCategoriesData = () => summary?.allCategories ? 
    summary.allCategories.map(([id, count], idx) => ({
      name: categoryNames[id] || id,
      value: count,
      fill: COLORS[idx % COLORS.length]
    })) : [];

  const getFoldersData = () => summary?.allFolders ? 
    summary.allFolders.map(([id, count], idx) => ({
      name: folderNames[id] || id, 
      count,
      fill: COLORS[idx % COLORS.length]
    })) : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Number (1-53)</label>
              <input 
                type="number" 
                min="1" 
                max="53" 
                value={week} 
                onChange={(e) => setWeek(Number(e.target.value))} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {summary ? (
            <>
              {/* Week Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Week {summary.weekNumber} - {year}</h3>
                </div>
                <p className="text-blue-100 mb-1">{summary.dateRange}</p>
                <p className="text-lg font-semibold">{summary.totalRecords} total records</p>
                <p className="text-sm opacity-90 mt-1">{summary.mostActiveDay}</p>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Records per Day Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Records per Day
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getByDayData()}>
                        <XAxis dataKey="name" stroke="#374151" fontSize={12} />
                        <YAxis stroke="#374151" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" name="Records" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-emerald-600" />
                    Category Distribution
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoriesData()}
                          cx="50%"
                          cy="50%" 
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                        >
                          {getCategoriesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Folders Bar Chart */}
                {getFoldersData().length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition lg:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Records per Folder
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getFoldersData()} layout="vertical" margin={{ right: 40 }}>
                          <XAxis type="number" stroke="#374151" fontSize={12} />
                          <YAxis dataKey="name" type="category" stroke="#374151" fontSize={12} width={120} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366F1" name="Records" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Summary Card */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <PieChartIcon className="w-6 h-6" />
                  <h3 className="text-xl font-bold">AI Weekly Insights</h3>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-3 text-purple-100">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating AI summary...</span>
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{aiSummary || "No AI insights available"}</p>
                )}
              </div>

              {/* Records Details */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Categories Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {summary.allCategories.slice(0, 8).map(([id, count], idx) => (
                      <div key={id} className="p-2 bg-blue-50 rounded text-xs">
                        <div className="font-medium text-gray-900 truncate" title={categoryNames[id] || id}>
                          {categoryNames[id] || id}
                        </div>
                        <div className="text-blue-600 font-semibold">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3">Folders Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {summary.allFolders.slice(0, 8).map(([id, count], idx) => (
                      <div key={id} className="p-2 bg-indigo-50 rounded text-xs">
                        <div className="font-medium text-gray-900 truncate" title={folderNames[id] || id}>
                          {folderNames[id] || id}
                        </div>
                        <div className="text-indigo-600 font-semibold">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div>
                  <h4 className="font-semibold text-lg mb-4 text-gray-900">Daily Breakdown</h4>
                  {summary.recordsByDay.map(({ day, date, records, categories }) => (
                    <div key={day} className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-blue-900">{day}, {date}</h5>
                          <span className="text-sm text-gray-600">({records.length} records)</span>
                        </div>
                      </div>
                      {Object.entries(categories).map(([catId, count]) => (
                        <span key={catId} className="inline-block mr-2 mb-1 px-3 py-1 bg-white text-xs font-medium text-blue-800 border border-blue-200 rounded-full shadow-sm">
                          {categoryNames[catId] || catId}: {count}
                        </span>
                      ))}
                      <div className="mt-3 space-y-1.5">
                        {records.map((r, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border shadow-sm">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">{r.title || "Untitled"}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Cat: {categoryNames[typeof r.category === 'string' ? r.category : r.category?._id] || r.category?.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <BarChart3 className="w-16 h-16 opacity-25 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No Weekly Data</h3>
              <p className="mb-6">Enter year and week number above to generate summary</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            disabled={loading}
          >
            Close
          </button>
          <button 
            onClick={fetchWeeklyRecords} 
            disabled={loading} 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              'Generate Summary'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

