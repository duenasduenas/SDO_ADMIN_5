import React, { useState, useEffect } from "react";
import { FileText, FolderOpen, Calendar, Clock, Search, Plus, Trash2, Eye, MoreVertical } from "lucide-react";

export function Dashboard() {
  const [records, setRecords] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [view, setView] = useState("all"); // "all", "records", "folders"

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch records
      const recordsRes = await fetch(`${API_BASE_URL}/record`);
      if (recordsRes.ok) {
        const recordsText = await recordsRes.text();
        const recordsData = recordsText ? JSON.parse(recordsText) : [];
        setRecords(recordsData);
      }

      // Fetch folders
      const foldersRes = await fetch(`${API_BASE_URL}/folder`);
      if (foldersRes.ok) {
        const foldersText = await foldersRes.text();
        const foldersData = foldersText ? JSON.parse(foldersText) : [];
        setFolders(foldersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/record/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRecords(records.filter(r => r._id !== id));
        setSelectedRecord(null);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRecords = records.filter(record =>
    record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-normal text-gray-800">My Drive</h1>
            </div>
            <button
              onClick={() => window.location.href = '/create-record'}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 text-sm font-medium transition ${
              view === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setView("records")}
            className={`px-4 py-2 text-sm font-medium transition ${
              view === "records"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setView("folders")}
            className={`px-4 py-2 text-sm font-medium transition ${
              view === "folders"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Folders
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-200">
              {/* Folders */}
              {(view === "all" || view === "folders") && filteredFolders.map((folder) => (
                <div
                  key={folder._id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{folder.name}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">Folder</div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatDate(folder.createdAt)}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Records */}
              {(view === "all" || view === "records") && filteredRecords.map((record) => (
                <div
                  key={record._id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{record.title}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">Document</div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatDate(record.createdAt)}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRecord(record._id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredRecords.length === 0 && filteredFolders.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">No items found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? "Try a different search term" : "Create your first record to get started"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">{records.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Folders</p>
                <p className="text-2xl font-semibold text-gray-900">{folders.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Modified</p>
                <p className="text-sm font-medium text-gray-900">
                  {records.length > 0 ? formatDate(records[0]?.createdAt) : "N/A"}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-medium text-gray-900">{selectedRecord.title}</h2>
                {selectedRecord.dateInfo && (
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedRecord.dateInfo.monthName} {selectedRecord.dateInfo.day}, {selectedRecord.dateInfo.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedRecord.dateInfo.dayName}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.content}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => deleteRecord(selectedRecord._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}