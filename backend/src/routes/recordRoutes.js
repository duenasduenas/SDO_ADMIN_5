import express from "express";
import { createRecord, editRecord, getAllRecords, getRecordsByDay, getRecordsByMonth, getRecordsByWeek, getRecordById, getCategories, deleteRecord } from "../cofig/controller/recordController.js";

const router = express.Router();

router.put('/edit-record/:id', editRecord)
router.post('/create-record', createRecord)

// get by days
router.get('/', getAllRecords)
router.get('/:id', getRecordById)

router.get("/categories", getCategories);

router.get('/day-record/:year/:month/:day', getRecordsByDay)
router.get('/month-record/:year/:month', getRecordsByMonth)  
router.get('/week-record/:year/:week', getRecordsByWeek)

router.delete("/:id", deleteRecord);



export default router;