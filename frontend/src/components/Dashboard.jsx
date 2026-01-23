import React, { useState, useEffect, use } from "react";
import { FileText, FolderOpen, Calendar, Clock, Search, Plus, Trash2, Eye, MoreVertical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SummaryDropdown from "./SummaryDropDown";
import EditRecordModal from "../assets/Record/EditRecordModal";
import WeeklySummaryModal from "../assets/Summary/weeklySummaryModal";
import MonthlySummaryModal from "../assets/Summary/monthlySummaryModal";
import CreateDropDown from "./CreateDropDown";
import CreateFolderModal from "../assets/Folder/CreateFolderModal";
import  CreateRecordModal  from "../assets/Record/CreateRecordModal";
import DeleteFolderButton from "./DeleteFolderButton";
import DeleteFolder from "../assets/Folder/DeleteFolder";
import OpenFolder from "../assets/Folder/OpenFolder";
import DarkModeModal from "./DarkModeModal";

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  const apiBaseUrl = "http://localhost:5001/api"; // or your API URL

  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([])

  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateRecord, setShowCreateRecord] = useState(false)

  const [categories, setCategories] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null); // null = all

  const [showYourModal, setShowYourModal] = useState(false);


  const [addRecordError, setAddRecordError] = useState("");
  const navigate = useNavigate()
  const [view, setView] = useState("all"); // "all", "records", "folders"

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // getMonth() is 0-indexed
  const day = today.getDate();
  const week = Math.ceil(day / 7); // simple week calculation

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchData();
  }, []);

  // In Dashboard.jsx, replace the fetchData function with this:
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch records (now returns { records: [...], categories: [...] })
      const recordsRes = await fetch(`${API_BASE_URL}/record`);
      if (recordsRes.ok) {
        const recordsText = await recordsRes.text();
        const data = recordsText ? JSON.parse(recordsText) : { records: [], categories: [] };
        setRecords(data.records || []);  // Extract the array
        // If you want to use backend-provided categories, set them here (optional)
        // setCategories(data.categories || []);  // Uncomment if needed for other uses
      }

      // Fetch folders (unchanged, assuming it returns { folders: [...] })
      const foldersRes = await fetch(`${API_BASE_URL}/folder`);
      if (foldersRes.ok) {
        const foldersText = await foldersRes.text();
        const foldersData = foldersText ? JSON.parse(foldersText) : { folders: [] };
        setFolders(Array.isArray(foldersData.folders) ? foldersData.folders : []);
      }

     
      try {
        const categoriesRes = await fetch(`${API_BASE_URL}/category`);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json(); // expects { categories: [...] }
          setCategories(categoriesData.categories || []);
        } else {
          console.error("Failed to fetch categories:", categoriesRes.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
      
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

  const deleteRecord = async (id) => {
    if (!id) {
      console.error("Cannot delete: Record ID is missing");
      console.log("Current records:", records);
      console.log("Folder records:", folderRecords);
      alert("Error: Cannot delete record - ID is missing");
      return;
    }

    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/record/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from main records
        setRecords((prev) => prev.filter((r) => r._id !== id));
        
        // Remove from selectedRecord if open
        setSelectedRecord((prev) => (prev?._id === id ? null : prev));

        // Remove from folderRecords if this record is in a folder
        setFolderRecords((prev) => prev.filter((r) => r._id !== id));
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to delete record: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };



  const openEditRecord = (record) => {
    setRecordToEdit(record);
    setShowEditModal(true);
  };

  const handleEditSave = (updatedRecord) => {
  setRecords(prev =>
    prev.map(r => (r._id === updatedRecord._id ? updatedRecord : r))
  );

  // also update selectedRecord if it's open
  setSelectedRecord(prev =>
      prev && prev._id === updatedRecord._id ? updatedRecord : prev
    );
  };


  const openAddRecordModal = () => {
    setShowAddRecordModal(true);
    setSearchRecordQuery("");
    setAddRecordError("");
    // Get records that are not already in this folder
    const recordsInFolder = folderRecords.map(r => r._id);
    setAvailableRecords(records.filter(r => !recordsInFolder.includes(r._id)));
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
          
          {/* Top Row */}
          <div className="flex items-center justify-between">
            
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-normal text-gray-800">My Drive</h1>
              <DarkModeModal 
                isOpen={showYourModal} 
                onClose={() => setShowYourModal(false)}
                title="Your Modal Title"
                maxWidth="max-w-3xl"
              >
                {/* Your modal content goes here */}
                <div className="space-y-4">
                  <p>Modal content here</p>
                </div>
              </DarkModeModal>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <CreateDropDown 
                onSelect={(type) => {
                  if (type === "folder") setShowCreateFolder(true);
                  if (type === "record") setShowCreateRecord(true);
                }}
              />


              <button
                onClick={() => setShowWeeklyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Weekly Summary
              </button>

              <button
                onClick={() => setShowMonthlyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Monthly Summary
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
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

      {/* Categories Panel */}
          

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
          <button
            onClick={() => setView("categories")}
            className={`px-4 py-2 text-sm font-medium transition ${
              view === "categories"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Categories
          </button>

          <SummaryDropdown
            apiBaseUrl={API_BASE_URL}
            categories={categories}
            year={year}
            month={month}
            day={day}
            week={week}
            onDeleteCategory={(deletedId) => setCategories(prev => prev.filter(c => c._id !== deletedId))}
            onResult={(summaryRecords) => {
              setRecords(summaryRecords);
              setView("records");
            }}
          />
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
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-200">
              
            {/* Folders */}
            {(view === "all" || view === "folders") && filteredFolders.map((folder) => (
              <OpenFolder
                key={folder._id}
                folder={folder}
                API_BASE_URL={API_BASE_URL}
                onFolderOpen={(folder) => setSelectedFolder(folder)}
                onRecordsLoaded={(records) => setFolderRecords(records)}
              >
                <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center w-full">
                  <div className="col-span-6 flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-yellow-500 shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{folder.name}</span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">Folder</div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {formatDate(folder.createdAt)}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />

                    <DeleteFolderButton
                      folderId={folder._id}
                      API_BASE_URL={API_BASE_URL}
                      onDeleted={(id) => {
                        setFolders(prev => prev.filter(f => f._id !== id));
                        setSelectedFolder(null);
                      }}
                    />
                  </div>
                </div>
              </OpenFolder>
            ))}

          {view === "categories" && (
            <div className="bg-white rounded-lg border border-gray-200 mt-4 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                <div className="col-span-10">Category Name</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div
                      key={category._id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50"
                    >
                      <div className="col-span-10 text-gray-900">{category.name}</div>
                      <div className="col-span-2 flex justify-end gap-2">
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete category "${category.name}"?`)) return;
                            try {
                              const res = await fetch(`${API_BASE_URL}/category/${category._id}`, {
                                method: "DELETE",
                              });
                              if (res.ok) {
                                setCategories((prev) =>
                                  prev.filter((c) => c._id !== category._id)
                                );
                              } else {
                                console.error("Failed to delete category");
                              }
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          )}



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
                  <div className="col-span-2 text-sm text-gray-600">{record.category?.name || "Uncategorized"}</div>
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
                    <span className="">
                      {selectedRecord.folder?.name || "No Folder"}
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

              <button
              onClick={() => openEditRecord(selectedRecord)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              Edit
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
                        console.log("Deleting record from folder:", record);  // ← ADD THIS
                        console.log("Record ID:", record._id);  // ← ADD THIS
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
              <DeleteFolder
                id={selectedFolder._id}
                folders={folders}
                setFolders={setFolders}
                setSelectedFolder={setSelectedFolder}
                API_BASE_URL={API_BASE_URL}
              />
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

      {/* Edit Record Modal */}
      <EditRecordModal
        record={recordToEdit}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        apiBaseUrl={API_BASE_URL}
        categories={categories}
        folders={folders}  // Add this line
      />

      {/* Weekly Summary Modal */}
      <WeeklySummaryModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        apiBaseUrl={API_BASE_URL}
        onResult={setWeeklyRecords}
      />

      <MonthlySummaryModal
        isOpen={showMonthlyModal}
        onClose={() => setShowMonthlyModal(false)}
        apiBaseUrl={API_BASE_URL}
        onResult={setMonthlyRecords}
      />

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={(newFolder) => {
            setFolders(prev => [...prev, newFolder]);
            setShowCreateFolder(false);
          }}
        />
      )}

      {/* Create Record Modal */}
      {showCreateRecord && (
        <CreateRecordModal
          isOpen={showCreateRecord}
          onClose={() => setShowCreateRecord(false)}
          onSuccess={(newRecord) => {
            setRecords(prev => [...prev, newRecord]);
            setShowCreateRecord(false);
          }}
          apiBaseUrl={API_BASE_URL}  // <<< ADD THIS
        />
      )}



      
    </div>
  );
}