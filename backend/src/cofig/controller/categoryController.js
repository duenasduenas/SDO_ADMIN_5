// categoryController.js
import Category from "../models/Category.js";

// export async function deleteCategory(req, res) {
//   const categoryId = req.params.id;

//   if (!categoryId) {
//     return res.status(400).json({ message: "Category ID is required" });
//   }

//   try {
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ message: "Category not found" });
//     }

//     await Category.deleteOne({ _id: categoryId });

//     res.status(200).json({ message: "Category deleted successfully", id: categoryId });
//   } catch (err) {
//     console.error("Delete Category Error:", err);
//     res.status(500).json({ message: "Failed to delete category" });
//   }
// }

// Delete category by name (or _id if you store objects)
export async function deleteCategory(req, res) {
  try {
    const { categoryName } = req.params;

    // Example if you store categories as strings in your DB
    // Remove the category from your categories collection
    const result = await Category.updateOne(
      {}, // adjust your query
      { $pull: { categories: categoryName } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete category" });
  }
}
