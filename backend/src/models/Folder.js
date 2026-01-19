import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },

    createdAt: {type: Date, default: Date.now, immutable: true},

    record: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Record",
        required: true
    }]

})

const Folder = mongoose.model("Folder", folderSchema);
export default Folder;