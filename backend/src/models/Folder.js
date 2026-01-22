import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  records: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Record"
  }]
}, { timestamps: true });

const Folder = mongoose.model("Folder", folderSchema);
export default Folder;
