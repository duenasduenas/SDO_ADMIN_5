import express from "express";
import { getAllCategories, deleteCategory, createCategory } from "../cofig/controller/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.delete("/:id", deleteCategory);
router.post("/create", createCategory);

export default router;
