import express from "express";
import { addRecordToFolder, createFolder, getAllFolders } from "../cofig/controller/folderController.js";

const router = express.Router();

router.get('/folders', getAllFolders)
router.post('/create-folder', createFolder)

router.post('/add-record/:id', addRecordToFolder)

export default router;