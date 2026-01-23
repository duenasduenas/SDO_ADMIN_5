import Category from "../../models/Category.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ categories });  // MUST be { categories: [...] }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
}

// Delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export async function createCategory(req, res) { 
    try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    const category = new Category({ name: name.trim() });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Error creating category:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    res.status(500).json({ message: err.message });
  }
}