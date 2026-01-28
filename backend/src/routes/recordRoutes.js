import express from "express";
import {
  createRecord,
  editRecord,
  getAllRecords,
  getRecordsByDay,
  getRecordsByMonth,
  getRecordsByWeek,
  getRecordById,
  getCategories,
  deleteRecord
} from "../cofig/controller/recordController.js";

const router = express.Router();

// CREATE & UPDATE
router.post("/create-record", createRecord);
router.put("/edit-record/:id", editRecord);

// FILTERED GETS (must be BEFORE :id)
router.get("/categories", getCategories);
router.get("/day-record/:year/:month/:day", getRecordsByDay);
router.get("/month-record/:year/:month", getRecordsByMonth);
router.get("/week-record/:year/:week", getRecordsByWeek);

// GENERAL GET
router.get("/", getAllRecords);

// SINGLE RECORD (MUST BE LAST)
router.get("/:id", getRecordById);

// DELETE (also uses :id, so keep last)
router.delete("/:id", deleteRecord);

export default router;
