import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
    title: {type: String, required: true, unique: true},
    content: {type: String, required: true},
    createdAt: {type: Date, default: Date.now, immutable: true},
    category: {type: String, required: true},

    dateInfo: {
        year: Number,
        month: Number,
        monthName: String,
        week: Number,
        day: Number,
        dayOfWeek: Number,
        dayName: String,
        fullDate: String
    },

    image: {
        type: String,
        default: null
    },

    folder: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Folder",
        required: true,
        default: null
    }]

})



const Record = mongoose.model("Record", recordSchema);
export default Record;