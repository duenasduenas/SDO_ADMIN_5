import express from "express";
import {
  getAllCategories,
  deleteCategory,
  createCategory
} from "../cofig/controller/categoryController.js";

const router = express.Router();

// CREATE FIRST
router.post("/create", createCategory);

// GET ALL
router.get("/", getAllCategories);

// DELETE LAST
router.delete("/:id", deleteCategory);

export default router;
