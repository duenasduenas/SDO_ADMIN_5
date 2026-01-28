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

// ACTION ROUTES (before :id)
router.post("/add-record/:id", addRecordToFolder);
router.post("/create-record/:id", createRecordToFolder);

// GENERAL GET
router.get("/", getAllFolders);

// SINGLE ITEM (must be last)
router.get("/:id", getFolderById);
router.delete("/:id", deleteFolder);

export default router;
