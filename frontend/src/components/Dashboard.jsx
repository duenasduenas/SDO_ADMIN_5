import React, { useState, useEffect } from "react";
import { FileText, FolderOpen, Calendar, Clock, Search, Plus, Trash2, Eye, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const [records, setRecords] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderRecords, setFolderRecords] = useState([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [availableRecords, setAvailableRecords] = useState([]);
  const [searchRecordQuery, setSearchRecordQuery] = useState("");
  const [addingRecord, setAddingRecord] = useState(false);
  const [addRecordError, setAddRecordError] = useState("");
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

  const deleteFolder = async (id) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/folder/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFolders(folders.filter(f => f._id !== id));
        setSelectedFolder(null);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const openFolder = async (folder) => {
    setSelectedFolder(folder);
    setLoadingFolder(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/folder/${folder._id}`);
      if (response.ok) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        
        if (data && data.folder && data.folder.record) {
          setFolderRecords(data.folder.record);
        } else {
          setFolderRecords([]);
        }
      }
    } catch (error) {
      console.error("Error fetching folder details:", error);
      setFolderRecords([]);
    } finally {
      setLoadingFolder(false);
    }
  };

  const openAddRecordModal = () => {
    setShowAddRecordModal(true);
    setSearchRecordQuery("");
    setAddRecordError("");
    // Get records that are not already in this folder
    const recordsInFolder = folderRecords.map(r => r._id);
    setAvailableRecords(records.filter(r => !recordsInFolder.includes(r._id)));
  };

  const addRecordToFolder = async (recordId) => {
    if (!selectedFolder) return;

    setAddingRecord(true);
    setAddRecordError("");

    try {
      const response = await fetch(`${API_BASE_URL}/folder/add-record/${selectedFolder._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add record');
      }

      // Refresh folder data
      await openFolder(selectedFolder);
      setShowAddRecordModal(false);
      
    } catch (error) {
      console.error("Error adding record to folder:", error);
      setAddRecordError(error.message || "Failed to add record to folder");
    } finally {
      setAddingRecord(false);
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

  const filteredAvailableRecords = availableRecords.filter(record =>
    record.title?.toLowerCase().includes(searchRecordQuery.toLowerCase()) ||
    record.content?.toLowerCase().includes(searchRecordQuery.toLowerCase())
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
                  onClick={() => openFolder(folder)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openFolder(folder);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder._id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
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
                {selectedRecord.image && (
                  <div className="mb-4">
                    <img 
                      src={selectedRecord.image} 
                      alt={selectedRecord.title}
                      className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}
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

      {/* Folder Detail Modal */}
      {selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-yellow-500" />
                <div>
                  <h2 className="text-xl font-medium text-gray-900">{selectedFolder.name}</h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {formatDate(selectedFolder.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {selectedFolder.description ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                  <p className="text-gray-700">{selectedFolder.description}</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 italic">No description provided</p>
                </div>
              )}

              {/* Records in this folder */}
              <div>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">
                        Records in this folder
                        </h3>

                        <Link
                        to={`/add-record/${selectedFolder?._id}`}
                        className="
                            inline-flex items-center gap-1.5
                            px-3 py-1.5 text-sm font-medium
                            bg-blue-600 text-white
                            rounded-lg shadow-sm
                            hover:bg-blue-700
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                            transition
                        "
                        aria-label="Add record to this folder"
                        >
                        <Plus className="w-4 h-4" />
                        Add Record
                        </Link>
                    </div>
                </div>

                {loadingFolder ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Loading records...</p>
                  </div>
                ) : folderRecords.length > 0 ? (
                  <div className="space-y-2">
                    {folderRecords.map(record => (
                        <div
                          key={record._id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedFolder(null);
                            setSelectedRecord(record);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">{record.title}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(record.createdAt)}
                              </p>
                            </div>
                          </div>
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
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">No records in this folder</p>
                    <button
                      onClick={openAddRecordModal}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add your first record
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedFolder(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => deleteFolder(selectedFolder._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Record to Folder Modal */}
      {showAddRecordModal && selectedFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Add Record to Folder</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select a record to add to "{selectedFolder.name}"
                </p>
              </div>
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {addRecordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <span className="text-red-800 text-sm">{addRecordError}</span>
                  <button onClick={() => setAddRecordError("")} className="text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchRecordQuery}
                    onChange={(e) => setSearchRecordQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredAvailableRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">
                      {searchRecordQuery 
                        ? "No records found" 
                        : "All records are already in this folder"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableRecords.map((record) => (
                      <button
                        key={record._id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addRecordToFolder(record._id);
                        }}
                        disabled={addingRecord}
                        className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{record.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {record.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(record.createdAt)}
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}