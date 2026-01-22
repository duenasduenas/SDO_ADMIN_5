// In aiRoutes.js
import express from "express";
import { ragSummary } from "../cofig/controller/aiController.js"; // Fixed path and name

const router = express.Router();

router.post("/rag-summary", ragSummary);  // Updated to use the new function

export default router;