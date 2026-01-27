import React, { useState, useEffect } from "react";
import { FileText, FolderOpen, Calendar, Clock, Search, Plus, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SummaryDropdown from "./SummaryDropdown.jsx";
import EditRecordModal from "../assets/Record/EditRecordModal";
import WeeklySummaryModal from "../assets/Summary/weeklySummaryModal";
import MonthlySummaryModal from "../assets/Summary/monthlySummaryModal";
import CreateDropDown from "./CreateDropDown";
import CreateFolderModal from "../assets/Folder/CreateFolderModal";
import  CreateRecordModal  from "../assets/Record/CreateRecordModal";
import DeleteFolderButton from "../assets/Folder/DeleteFolderButton";
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
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showYourModal, setShowYourModal] = useState(false);
  const [addRecordError, setAddRecordError] = useState("");
  const navigate = useNavigate();
  const [view, setView] = useState("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage] = useState(20);
  const [pagination, setPagination] = useState(null);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const week = Math.ceil(day / 7);

  const API_BASE_URL = 'https://unoffending-shelley-swingingly.ngrok-free.dev/api';

  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery, selectedCategory]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page on new search
      } else {
        fetchData();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      // ADD THIS HEADER FOR NGROK
      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };

      // Fetch with headers
      const recordsRes = await fetch(`${API_BASE_URL}/record?${params}`, { headers });
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.records || []);
        setPagination(data.pagination);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.totalRecords || 0);
      }

      const foldersRes = await fetch(`${API_BASE_URL}/folder`, { headers });
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(Array.isArray(foldersData.folders) ? foldersData.folders : []);
      }

      const categoriesRes = await fetch(`${API_BASE_URL}/category`, { headers });
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
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
      alert("Error: Cannot delete record - ID is missing");
      return;
    }

    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/record/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh data after deletion
        fetchData();
        setSelectedRecord((prev) => (prev?._id === id ? null : prev));
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
    setSelectedRecord(prev =>
      prev && prev._id === updatedRecord._id ? updatedRecord : prev
    );
  };

  const openAddRecordModal = () => {
    setShowAddRecordModal(true);
    setSearchRecordQuery("");
    setAddRecordError("");
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

  const getCategoryName = (categoryData) => {
    if (!categoryData) return "Uncategorized";
    if (typeof categoryData === "object" && categoryData.name) return categoryData.name;
    if (typeof categoryData === "string") {
      const cat = categories.find(c => c._id === categoryData);
      return cat ? cat.name : "Uncategorized";
    }
    return "Uncategorized";
  };

  // Remove client-side filtering for records (now done by backend)
  const filteredFolders = folders.filter(folder =>
    folder.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (pagination?.hasNextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (pagination?.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <CreateDropDown 
                onSelect={(type) => {
                  if (type === "folder") setShowCreateFolder(true);
                  if (type === "record") setShowCreateRecord(true);
                }}
              />
              <button
                onClick={() => setShowWeeklyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                Weekly Summary
              </button>
              <button
                onClick={() => setShowMonthlyModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                Monthly Summary
              </button>
              {/* <button
                onClick={() => setShowYourModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
              >
                Dark Mode
              </button> */}
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

          {/* Category Filter */}
          {view === "records" && (
            <div className="mt-4">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Pagination Info */}
              {(view === "all" || view === "records") && pagination && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {records.length > 0 ? ((currentPage - 1) * recordsPerPage + 1) : 0} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
              )}

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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolder(folder);
                          }}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="View folder details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>

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
                {(view === "all" || view === "records") && records.map((record) => (
                  <div
                    key={record._id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">{record.title}</span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600">{getCategoryName(record.category)}</div>
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
                {records.length === 0 && filteredFolders.length === 0 && (
                  <div className="px-6 py-16 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No items found</p>
                    <p className="text-sm text-gray-400">
                      {searchQuery ? "Try a different search term" : "Create your first record to get started"}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {(view === "all" || view === "records") && pagination && totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={goToPrevPage}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Total Records</p>
                <p className="text-3xl font-bold text-gray-900">{totalRecords || records.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 shrink-0 ml-4" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Total Folders</p>
                <p className="text-3xl font-bold text-gray-900">{folders.length}</p>
              </div>
              <FolderOpen className="w-10 h-10 text-yellow-500 shrink-0 ml-4" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Current Page</p>
                <p className="text-sm font-semibold text-gray-900">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* All the modals remain the same */}
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

      {/* ... rest of your modals (FolderDetail, AddRecord, Edit, Weekly, Monthly, CreateFolder, CreateRecord) ... */}
      {/* I'll skip repeating them all here since they remain unchanged */}

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

      <EditRecordModal
        record={recordToEdit}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        apiBaseUrl={API_BASE_URL}
        categories={categories}
        folders={folders}
      />

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
            fetchData(); // Refresh to get updated pagination
            setShowCreateRecord(false);
          }}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {/* Dark Mode Modal */}
      <DarkModeModal 
        isOpen={showYourModal} 
        onClose={() => setShowYourModal(false)}
        title="Settings"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <p>Dark Mode is currently enabled for modals. More settings coming soon!</p>
        </div>
      </DarkModeModal>
    </div>
  );
}