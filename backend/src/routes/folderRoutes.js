import express from "express";
import {
  addRecordToFolder,
  createFolder,
  editFolder,
  getAllFolders,
  getFolderById,
  deleteFolder,
  createRecordToFolder
} from "../cofig/controller/folderController.js";

const router = express.Router();

// CREATE / UPDATE (specific first)
router.post("/create-folder", createFolder);
router.put("/edit-folder/:id", editFolder);

// ACTION ROUTES
router.post("/add-record/:id", addRecordToFolder);
router.post("/create-record/:id", createRecordToFolder);

// GET ALL
router.get("/", getAllFolders);

// SINGLE / DELETE LAST
router.get("/:id", getFolderById);
router.delete("/:id", deleteFolder);


export default router;
