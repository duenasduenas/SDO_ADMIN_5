import express from "express";
import { createRecord, editRecord, getRecordsByDay, getRecordsByMonth, getRecordsByWeek } from "../cofig/controller/recordController.js";

const router = express.Router();

router.put('/edit-record/:id', editRecord)
router.post('/create-record', createRecord)

// get by days
router.get('/day-record/:year/:month/:day', getRecordsByDay)
router.get('/month-record/:year/:month', getRecordsByMonth)  // Changed path
router.get('/week-record/:year/:week', getRecordsByWeek)     // Changed path



export default router;