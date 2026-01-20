import express from "express";
import { addRecordToFolder, createFolder, editFolder, getAllFolders, getFolderById } from "../cofig/controller/folderController.js";

const router = express.Router();


router.put('/edit-folder/:id', editFolder)
router.get('/', getAllFolders)
router.get('/:id', getFolderById)

router.post('/create-folder', createFolder)

router.post('/add-record/:id', addRecordToFolder)



export default router;