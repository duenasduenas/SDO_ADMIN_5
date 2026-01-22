import express from "express";
import { deleteCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.delete("/:id", deleteCategory);  // DELETE /api/category/:id

export default router;
