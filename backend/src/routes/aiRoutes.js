// In aiRoutes.js
import express from "express";
import { ragSummary } from "../cofig/controller/aiController.js";

const router = express.Router();

router.post("/rag-summary", ragSummary);

export default router;