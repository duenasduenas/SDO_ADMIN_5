import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Loader2, CheckCircle, AlertCircle, Search, X } from "lucide-react";

export default function AddRecord() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [recordId, setRecordId] = useState("");
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);
    const [fetchingRecords, setFetchingRecords] = useState(true);
    const [mode, setMode] = useState("existing"); // "existing" or "new"
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    useEffect(() => {
        if (!folderId) {
            setMessage({ type: "error", text: "Invalid folder ID" });
            return;
        }
        fetchData();
    }, [folderId]);

    useEffect(() => {
        // Filter records based on search term and category
        let filtered = records;

        if (searchTerm.trim()) {
            filtered = filtered.filter(record => 
                record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterCategory) {
            filtered = filtered.filter(record => record.category === filterCategory);
        }

        setFilteredRecords(filtered);
    }, [searchTerm, filterCategory, records]);

    const fetchData = async () => {
        setFetchingRecords(true);
        try {
            const [recordsRes, categoriesRes] = await Promise.all([
                fetch("http://localhost:5001/api/record"),
                fetch("http://localhost:5001/api/category")
            ]);

            const recordsData = await recordsRes.json();
            const categoriesData = await categoriesRes.json();

            const recordsList = Array.isArray(recordsData.records) ? recordsData.records : [];
            setRecords(recordsList);
            setFilteredRecords(recordsList);
            setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setMessage({ type: "error", text: "Failed to load data" });
        } finally {
            setFetchingRecords(false);
        }
    };

    const addExistingRecord = async () => {
        if (!recordId) {
            setMessage({ type: "error", text: "Please select a record" });
            return;
        }

        // Find the selected record to get its title
        const selectedRecord = records.find(r => r._id === recordId);
        if (!selectedRecord) {
            setMessage({ type: "error", text: "Record not found" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(
                `http://localhost:5001/api/folder/add-record/${folderId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: selectedRecord.title })
                }
            );

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: data.message || "Record added successfully!" });
                setTimeout(() => navigate(-1), 1500);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to add record" });
            }
        } catch (err) {
            console.error("Server error:", err);
            setMessage({ type: "error", text: "Server error occurred" });
        } finally {
            setLoading(false);
        }
    };

    const createAndAddRecord = async () => {
        if (!title.trim()) {
            setMessage({ type: "error", text: "Title is required" });
            return;
        }

        if (!category) {
            setMessage({ type: "error", text: "Category is required" });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const createRes = await fetch("http://localhost:5001/api/record/create-record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    content: description.trim() || "No description provided",
                    category
                })
            });

            const createData = await createRes.json();
            console.log("Create response:", { status: createRes.status, data: createData });

            if (createRes.ok) {
                // Now add the newly created record to the folder
                const newRecordId = createData._id;
                const addRes = await fetch(
                    `http://localhost:5001/api/folder/add-record/${folderId}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ recordId: newRecordId })
                    }
                );

                if (addRes.ok) {
                    setMessage({ type: "success", text: "Record created and added to folder!" });
                    setTimeout(() => navigate(-1), 1500);
                } else {
                    const addError = await addRes.json();
                    setMessage({ type: "error", text: addError.message || "Failed to add record to folder" });
                }
            } else {
                setMessage({ type: "error", text: createData.message || "Failed to create record" });
            }
        } catch (err) {
            console.error("Server error:", err);
            setMessage({ type: "error", text: "Server error occurred: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "existing") {
            addExistingRecord();
        } else {
            createAndAddRecord();
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        setFilterCategory("");
    };

    const getCategoryName = (category) => {
        // Handle if category is an object (populated from backend) or just an ID
        if (!category) return "Uncategorized";
        if (typeof category === 'object' && category.name) return category.name;
        if (typeof category === 'string') {
            const cat = categories.find(c => c._id === category);
            return cat ? cat.name : "Uncategorized";
        }
        return "Uncategorized";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-3xl font-bold text-slate-800">Add Record to Folder</h1>
                    <p className="text-slate-600 mt-2">Choose an existing record or create a new one</p>
                </div>

                {/* Mode Toggle */}
                {/* <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setMode("existing")}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                                mode === "existing"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Add Existing Record
                        </button>
                        <button
                            onClick={() => setMode("new")}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                                mode === "new"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Create New Record
                        </button>
                    </div>
                </div> */}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    {fetchingRecords ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-slate-600">Loading...</span>
                        </div>
                    ) : (
                        <>
                            {mode === "existing" ? (
                                <>
                                    {/* Search & Filter Section */}
                                    <div className="mb-4 space-y-3">
                                        <label className="block text-sm font-semibold text-slate-700">
                                            Find Record
                                        </label>
                                        
                                        {/* Search Input */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by title or description..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full border border-slate-300 pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={loading}
                                            />
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchTerm("")}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Category Filter */}
                                        <div className="flex gap-2">
                                            <select
                                                value={filterCategory}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                                className="flex-1 border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={loading}
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {(searchTerm || filterCategory) && (
                                                <button
                                                    type="button"
                                                    onClick={clearSearch}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>

                                        {/* Results Count */}
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span>
                                                {filteredRecords.length} of {records.length} records
                                            </span>
                                            {(searchTerm || filterCategory) && (
                                                <span className="text-blue-600 font-medium">
                                                    Filtered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Records List/Select */}
                                    <div className="mb-4">
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Select Record
                                        </label>
                                        
                                        {filteredRecords.length === 0 ? (
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                                                <p className="text-slate-600">
                                                    {searchTerm || filterCategory 
                                                        ? "No records match your search" 
                                                        : "No records available"}
                                                </p>
                                                {(searchTerm || filterCategory) && (
                                                    <button
                                                        type="button"
                                                        onClick={clearSearch}
                                                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="max-h-96 overflow-y-auto border border-slate-300 rounded-lg">
                                                {filteredRecords.map((record) => (
                                                    <label
                                                        key={record._id}
                                                        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition border-b border-slate-200 last:border-b-0 ${
                                                            recordId === record._id ? "bg-blue-50" : ""
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="recordSelect"
                                                            value={record._id}
                                                            checked={recordId === record._id}
                                                            onChange={(e) => setRecordId(e.target.value)}
                                                            className="mt-1"
                                                            disabled={loading}
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-800">
                                                                {record.title}
                                                            </p>
                                                            {record.description && (
                                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                                    {record.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                                                    {getCategoryName(record.category)}
                                                                </span>
                                                                {record.date && (
                                                                    <span className="text-xs text-slate-500">
                                                                        {new Date(record.date).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Show selected record details */}
                                    {recordId && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <p className="text-sm font-semibold text-blue-900">Selected Record:</p>
                                            <p className="text-sm text-blue-700 mt-1">
                                                {records.find((r) => r._id === recordId)?.title}
                                            </p>
                                            {records.find((r) => r._id === recordId)?.description && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    {records.find((r) => r._id === recordId)?.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter record title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Description
                                        </label>
                                        <textarea
                                            placeholder="Enter record description (optional)"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={loading}
                                        >
                                            <option value="">-- Select a category --</option>
                                            {categories.length === 0 ? (
                                                <option disabled>No categories available</option>
                                            ) : (
                                                categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>
                                                        {cat.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Message */}
                            {message.text && (
                                <div
                                    className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${
                                        message.type === "success"
                                            ? "bg-green-50 border border-green-200 text-green-800"
                                            : "bg-red-50 border border-red-200 text-red-800"
                                    }`}
                                >
                                    {message.type === "success" ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !folderId || (mode === "existing" && !recordId) || (mode === "new" && !title.trim())}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <span>{mode === "existing" ? "Add to Folder" : "Create & Add to Folder"}</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </form>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Use the search box and category filter to quickly find records. You can search by title or description.
                    </p>
                </div>
            </div>
        </div>
    );
}