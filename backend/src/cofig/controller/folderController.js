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

        const folder = await Folder.findById(req.params.id)
            .populate({ path: "record", select: "title content createdAt dateInfo" });

        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        res.status(200).json({
            message: "Folder found",
            folder
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
      path: "record",
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
    if (folder.record.some(r => r._id.toString() === record._id.toString())) {
      return res.status(400).json({ message: "Record already in this folder" });
    }

    // Add record to folder
    folder.record.push(record._id);
    record.folder.push(folder._id);

    await folder.save();
    await record.save();

    res.status(200).json({ message: "Record added successfully", folder, record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
