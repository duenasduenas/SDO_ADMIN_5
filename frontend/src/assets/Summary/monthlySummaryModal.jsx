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

export default function MonthlySummaryModal({ isOpen, onClose }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [folderNames, setFolderNames] = useState({});
  const [categoryNames, setCategoryNames] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(),0,1);
    return Math.ceil((((d - yearStart)/86400000) + 1)/7);
  };

  const generateMonthlySummary = (records) => {
    if (!Array.isArray(records) || records.length === 0) return null;

    const total = records.length;
    const byDay = {};
    const recordsByDate = {};
    const recordsByWeek = {};
    const categoriesCount = {};
    const foldersCount = {};
    let withFolder = 0;

    records.forEach((r) => {
      const fullDate = r.dateInfo?.fullDate ?? (r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "N/A");
      const day = r.dateInfo?.dayName ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US",{weekday:"long"}) : "N/A");
      const weekNum = r.dateInfo?.weekNumber ?? getWeekNumber(fullDate);

      byDay[day] = (byDay[day] || 0) + 1;

      if (!recordsByDate[fullDate]) recordsByDate[fullDate] = { day, records: [] };
      recordsByDate[fullDate].records.push(r);

      if (!recordsByWeek[weekNum]) recordsByWeek[weekNum] = [];
      recordsByWeek[weekNum].push(r);

      if (r.category) {
        const catId = typeof r.category === "string" ? r.category : r.category._id;
        categoriesCount[catId] = (categoriesCount[catId] || 0) + 1;
      }

      if (r.folder) {
        const folders = Array.isArray(r.folder) ? r.folder : [r.folder];
        folders.forEach(f => {
          const folderId = typeof f === "string" ? f : f._id;
          foldersCount[folderId] = (foldersCount[folderId] || 0) + 1;
        });
        withFolder++;
      }
    });

    const sortedRecordsByDate = Object.entries(recordsByDate)
      .sort((a,b) => new Date(a[0]) - new Date(b[0]))
      .map(([date,data]) => ({ date, ...data }));

    const sortedRecordsByWeek = Object.entries(recordsByWeek)
      .sort((a,b) => Number(a[0]) - Number(b[0]))
      .map(([week, weekRecords]) => ({
        week,
        count: weekRecords.length,
        records: weekRecords.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt))
      }));

    return {
      totalRecords: total,
      averagePerDay: sortedRecordsByDate.length > 0 ? (total / sortedRecordsByDate.length).toFixed(1) : 0,
      allFolders: Object.entries(foldersCount).sort((a,b)=>b[1]-a[1]),
      allCategories: Object.entries(categoriesCount).sort((a,b)=>b[1]-a[1]),
      recordsByDate: sortedRecordsByDate,
      recordsByWeek: sortedRecordsByWeek,
      folderUsage: { withFolder, withoutFolder: total-withFolder },
      byDay,
    };
  };

  const fetchMonthlyRecords = async () => {
    if (!month || month < 1 || month > 12) return alert("Please enter a valid month (1-12)");
    try {
      setLoading(true);
      setAiLoading(true);

      const res = await fetch(`${API_BASE_URL}/record/month-record/${year}/${month}`, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      setMonthlyRecords(records);

      const folderRes = await fetch(`${API_BASE_URL}/folder`, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });
      const folderData = await folderRes.json();
      const folderMap = {};
      (folderData.folders || []).forEach(f => folderMap[f._id] = f.name);
      setFolderNames(folderMap);

      const categoryRes = await fetch(`${API_BASE_URL}/category`, {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });
      const categoryData = await categoryRes.json();
      const categoryMap = {};
      (categoryData.categories || []).forEach(c => categoryMap[c._id] = c.name);
      setCategoryNames(categoryMap);

      const localSummary = generateMonthlySummary(records);
      setSummary(localSummary);

      try {
        const ragRes = await fetch(`${API_BASE_URL}/ai/rag-summary`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ period: "monthly", records })
        });
        if (ragRes.ok) {
          const ragData = await ragRes.json();
          setAiSummary(ragData.summary ?? "AI summary not available");
        } else {
          setAiSummary("AI summary not available");
        }
      } catch(err) {
        console.error("RAG AI fetch error:", err);
        setAiSummary("AI summary not available");
      }

    } catch(err){
      console.error("Failed to fetch monthly records", err);
      setSummary(null);
      setAiSummary(null);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Chart data preparation
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

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Monthly Summary</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input 
                type="number" 
                value={year} 
                onChange={e => setYear(Number(e.target.value))} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month (1-12)</label>
              <input 
                type="number" 
                min="1" 
                max="12" 
                value={month} 
                onChange={e => setMonth(Number(e.target.value))} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-1">
          <button 
            onClick={fetchMonthlyRecords} 
            disabled={loading} 
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              'Generate Monthly Summary'
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {summary ? (
            <>
              {/* Month Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">{monthNames[month-1]} {year}</h3>
                    <p className="opacity-90">{summary.totalRecords} total records</p>
                    <p className="text-lg font-semibold mt-1">{summary.averagePerDay} avg/day</p>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Day Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Records per Day</h4>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getByDayData()}>
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={13} fontWeight={500} />
                        <YAxis stroke="#6B7280" fontSize={13} />
                        <Tooltip contentStyle={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Records" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <PieChartIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Category Breakdown</h4>
                  </div>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoriesData()}
                          cx="50%" 
                          cy="50%" 
                          innerRadius={40}
                          outerRadius={90}
                          dataKey="value"
                          nameKey="name"
                          cornerRadius={8}
                        >
                          {getCategoriesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Folders Bar Chart - Full Width */}
              {getFoldersData().length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Records per Folder</h4>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getFoldersData()} layout="vertical" margin={{ right: 60, top: 20 }}>
                        <XAxis type="number" stroke="#6B7280" fontSize={13} />
                        <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={13} width={140} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Records" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <PieChartIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold">🤖 AI Monthly Insights</h3>
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-4 text-purple-100 animate-pulse">
                    <div className="w-8 h-8 bg-white/20 rounded-full animate-spin border-2 border-white border-t-transparent"></div>
                    <span className="text-lg">Analyzing your monthly productivity...</span>
                  </div>
                ) : aiSummary ? (
                  <div className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap">
                    {aiSummary}
                  </div>
                ) : (
                  <p className="text-purple-200 italic text-lg">AI insights not available this month</p>
                )}
              </div>

              {/* Quick Stats & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold mb-1">{summary.totalRecords}</div>
                  <div className="text-emerald-100">Total Records</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold mb-1">{summary.averagePerDay}</div>
                  <div className="text-blue-100">Avg per Day</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                  <div className="text-3xl font-bold mb-1">{Object.keys(summary.byDay).length}</div>
                  <div className="text-indigo-100">Active Days</div>
                </div>
              </div>

              {/* Daily Breakdown */}
              {summary.recordsByDate?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    📅 Daily Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.recordsByDate.map(({ date, day, records }, idx) => {
                      const dateCategories = {};
                      records.forEach(r => {
                        if (r.category) {
                          const catId = typeof r.category === "string" ? r.category : r.category._id;
                          dateCategories[catId] = (dateCategories[catId] || 0) + 1;
                        }
                      });

                      return (
                        <div key={idx} className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h5 className="font-bold text-xl text-slate-900">{day}</h5>
                              <p className="text-sm text-slate-600">{date}</p>
                            </div>
                            <div className="font-bold text-2xl text-blue-600">{records.length}</div>
                          </div>
                          
                          {/* Categories */}
                          {Object.entries(dateCategories).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {Object.entries(dateCategories).map(([catId, count]) => (
                                <span key={catId} className="px-3 py-1 bg-white text-xs font-semibold text-blue-800 border border-blue-200 rounded-full shadow-sm">
                                  {categoryNames[catId] || catId}: {count}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Top Records */}
                          <div className="space-y-2">
                            {records.slice(0, 3).map((r, rIdx) => (
                              <div key={r._id} className="flex items-center gap-3 p-3 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all">
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate" title={r.title}>{r.title || "Untitled"}</div>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    {r.category && (
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                        {typeof r.category === "string" ? categoryNames[r.category] : r.category?.name}
                                      </span>
                                    )}
                                    {Array.isArray(r.folder) && r.folder.slice(0,2).map(f => (
                                      <span key={typeof f === "string" ? f : f._id} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                                        {typeof f === "string" ? folderNames[f] : f.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {records.length > 3 && (
                              <div className="text-center py-2 text-sm text-gray-500">
                                +{records.length - 3} more records
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="w-20 h-20 text-gray-300 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Monthly Data</h3>
              <p className="text-gray-500 max-w-md mb-8">Enter year and month above to generate your monthly summary</p>
              <div className="text-sm text-gray-400">Charts will appear here with records per day, categories, and folders</div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-blue-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

