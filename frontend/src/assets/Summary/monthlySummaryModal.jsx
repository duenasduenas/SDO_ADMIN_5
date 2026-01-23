import { useState } from "react";
import { X } from "lucide-react";

export default function MonthlySummaryModal({ isOpen, onClose, apiBaseUrl }) {
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

      if (Array.isArray(r.folder) && r.folder.length > 0) {
        r.folder.forEach(f => {
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

      // 1️⃣ Fetch records
      const res = await fetch(`${apiBaseUrl}/record/month-record/${year}/${month}`);
      const data = await res.json();
      const records = Array.isArray(data.records) ? data.records : [];
      setMonthlyRecords(records);

      // 2️⃣ Fetch folder names
      const folderRes = await fetch(`${apiBaseUrl}/folder`);
      const folderData = await folderRes.json();
      const folderMap = {};
      (folderData.folders || []).forEach(f => folderMap[f._id] = f.name);
      setFolderNames(folderMap);

      // 3️⃣ Fetch category names
      const categoryRes = await fetch(`${apiBaseUrl}/category`);
      const categoryData = await categoryRes.json();
      const categoryMap = {};
      (categoryData.categories || []).forEach(c => categoryMap[c._id] = c.name);
      setCategoryNames(categoryMap);

      // 4️⃣ Local summary
      const localSummary = generateMonthlySummary(records);
      setSummary(localSummary);

      // 5️⃣ AI summary
      try {
        const ragRes = await fetch(`${apiBaseUrl}/ai/rag-summary`,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period: "monthly", year, month, records })
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

  if(!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X />
        </button>

        <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month (1-12)</label>
            <input type="number" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2"/>
          </div>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end gap-3 mb-4">
          <button onClick={fetchMonthlyRecords} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Loading..." : "Generate"}
          </button>
        </div>

        {/* SUMMARY */}
        {summary ? (
          <div className="space-y-4 text-sm">

            {/* Month Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
              <h3 className="text-lg font-bold">{monthNames[month-1]} {year}</h3>
              <p>{summary.totalRecords} total records • {summary.averagePerDay} avg per day</p>
            </div>

            {/* AI SUMMARY */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm font-semibold text-yellow-800 mb-1">AI Monthly Insight</p>
              {aiLoading ? (
                <p className="text-yellow-700 italic">Analyzing monthly records...</p>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
              )}
            </div>

            {/* Folders */}
            <div className="bg-white p-3 rounded border">
              <strong>All Folders:</strong>
              {summary.allFolders?.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {summary.allFolders.map(([id,count])=>(
                    <li key={id}>{folderNames[id] ?? id} ({count} records)</li>
                  ))}
                </ul>
              ) : <p className="ml-5 italic">None</p>}
            </div>

            {/* Categories */}
            <div className="bg-white p-3 rounded border">
              <strong>All Categories:</strong>
              {summary.allCategories?.length > 0 ? (
                <ul className="list-disc ml-5 mt-1">
                  {summary.allCategories.map(([id,count])=>(
                    <li key={id}>{categoryNames[id] ?? id} ({count} records)</li>
                  ))}
                </ul>
              ) : <p className="ml-5 italic">None</p>}
            </div>

            {/* Records by Week */}
            {summary.recordsByWeek?.map(({ week, records }) => (
              <div key={week} className="p-3 bg-purple-50 rounded border-l-4 border-purple-500 mb-3">
                <p className="font-semibold text-purple-700 mb-2">
                  Week {week} ({records?.length || 0} record{(records?.length || 0) !== 1 ? 's' : ''})
                </p>

                {records?.map(r => (
                  <div key={r._id ?? r.title} className="text-sm pl-3 py-1 border-l-2 border-purple-300 bg-white rounded mb-1">
                    <span className="text-xs text-gray-500">
                      {r.dateInfo?.fullDate ?? (r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "N/A")}
                      ({r.dateInfo?.dayName ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US",{weekday:"long"}) : "N/A")})
                    </span>
                    <br/>
                    <span className="font-medium text-gray-800">{r.title ?? "Untitled"}</span>
                    {Array.isArray(r.folder) && r.folder.map(f=>(
                      <span key={typeof f === "string" ? f : f._id} className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        {typeof f === "string" ? folderNames[f] ?? f : f.name ?? f._id}
                      </span>
                    ))}
                    {r.category && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded">
                        {typeof r.category === "string" ? categoryNames[r.category] ?? r.category : r.category?.name ?? r.category?._id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

          </div>
        ) : (
          <p className="text-gray-500 italic mt-4">No summary yet. Click "Generate" to fetch data.</p>
        )}

      </div>
    </div>
  );
}
