import mongoose from "mongoose";
import Folder from "../../models/Folder.js";
import Record from "../../models/Record.js";
import fs from 'fs/promises';
import path from 'path';

export async function getAllFolders(req, res) {
  try {
    const folders = await Folder.find().populate('records'); // populate record if you want count/details
    res.status(200).json({ folders }); // <-- must send { folders: [...] }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
}


export async function getFolderById(req, res) {
    try {

        console.log("ID:", req.params.id);

        // Populate both fields to handle data with either schema version
        const folder = await Folder.findById(req.params.id)
            .populate({ path: "records", select: "title content createdAt dateInfo" })
            .populate({ path: "record", select: "title content createdAt dateInfo" });

        console.log("Fetched folder:", folder);
        console.log("Folder records field:", folder?.records);
        console.log("Folder record field:", folder?.record);

        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        // Return records in the records field, using record as fallback
        const folderObj = folder.toObject();
        const populatedRecords = (folderObj.records && folderObj.records.length > 0) 
            ? folderObj.records 
            : (folderObj.record || []);

        res.status(200).json({
            message: "Folder found",
            folder: {
              ...folderObj,
              records: populatedRecords
            }
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

export async function editFolder(req, res) {
    const { name } = req.body;

    try{
        if(!name){
            return res.status(404).json({ message: "Name is Required" })
        }

        const editFolder = await Folder.findByIdAndUpdate(req.params.id, { name })
        res.status(200).json({ message: "Editted", editFolder })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


export async function createFolder(req, res) {
    const { name } = req.body;

    try{
        if(!name){
            return res.status(400).json({ message: "Name is required" });
        }

        const newFolder = new Folder({
            name
        })

        const savedFolder = await newFolder.save()

        res.status(201).json(savedFolder)
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function deleteFolder(req, res) {
  const folderId = req.params.id;

  if (!folderId) {
    return res.status(400).json({ message: "Folder ID is required" });
  }

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Only delete the folder itself, not its records
    await Folder.deleteOne({ _id: folderId });

    res.status(200).json({ message: "Folder deleted successfully", id: folderId });
  } catch (err) {
    console.error("Delete Folder Error:", err);
    res.status(500).json({ message: "Failed to delete folder" });
  }
}



export async function addRecordToFolder(req, res) {
  const { title } = req.body;      // the record title
  const folderId = req.params.id;  // folder ObjectId

  // Validate folder ID
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    return res.status(400).json({ message: "Invalid Folder ID" });
  }

  try {
    // Find folder
    const folder = await Folder.findById(folderId).populate({
      path: "records",
      select: "folder title"
    });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    // Find record by title
    const record = await Record.findOne({ title });
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Prevent duplicates across folders
    if (record.folder?.length > 0) {
      return res.status(400).json({ message: "Record already in a folder" });
    }

    // Prevent duplicates in this folder
    if (folder.records.some(r => r._id.toString() === record._id.toString())) {
      return res.status(400).json({ message: "Record already in this folder" });
    }

    // Add record to folder
    folder.records.push(record._id);
    record.folder.push(folder._id);

    await folder.save();
    await record.save();

    res.status(200).json({ message: "Record added successfully", folder, record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// controllers/folder.controller.js
export async function createRecordToFolder(req, res) {
  const { id: folderId } = req.params;
  const { recordId } = req.body;

  console.log("Adding record to folder", { folderId, recordId });

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    console.error("Invalid folder ID:", folderId);
    return res.status(400).json({ message: "Invalid folder ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(recordId)) {
    console.error("Invalid record ID:", recordId);
    return res.status(400).json({ message: "Invalid record ID" });
  }

  try {
    const folder = await Folder.findById(folderId);
    if (!folder) {
      console.error("Folder not found for ID:", folderId);
      return res.status(404).json({ message: "Folder not found" });
    }

    // Make sure records is an array
    if (!Array.isArray(folder.records)) {
      folder.records = [];
    }

    // Prevent duplicates
    if (folder.records.includes(recordId)) {
      console.error("Record already in folder:", recordId);
      return res.status(400).json({ message: "Record already in folder" });
    }

    folder.records.push(recordId);
    await folder.save();

    console.log("Record added successfully:", recordId);
    res.status(200).json({ message: "Record added to folder", folder });
  } catch (err) {
    console.error("Error adding record to folder:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}


