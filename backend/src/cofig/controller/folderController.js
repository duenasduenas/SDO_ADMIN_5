import mongoose from "mongoose";
import Folder from "../../models/Folder.js";
import Record from "../../models/Record.js";

export async function getAllFolders(req,res) {
    try{
        const folders = await Folder.find().populate({path: "name record"}).sort({ createdAt: -1 });
        res.status(200).json(folders)
    } catch (error) {
        return res.status(500).json({message: error.message})
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

export async function addRecordToFolder(req, res){
    
    const { recordId } = req.body

    try{
        const folder = await Folder.findById(req.params.id).populate({
            path: "record",
            select: "folder"
        })

        if(!folder) return res.status(400).json({ message: "Folder is Not Found" })

        const record = await Record.findById(recordId)
        if(!record) return res.status(400).json({ message: "Record is Not Found" })

            
        // Check if record is already in ANY folder (including this one)    
        if(!record.folder){
            return res.status(400).json({
                message: "Record is already in a folder. Remove if first"
            })
        }

        if(folder.record.some(r => r._id.toString() === recordId)) {
            return res.status(400).json({ message: "Record Already Exist" })
        }

        folder.record.push(recordId);
        record.folder.push(folder._id)

        await folder.save();
        await record.save();

        res.status(200).json({ message: "Record Added Successfully", folder, record })
        
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}