import express from "express";
import cors from "cors"
import http from "http";
import recordRoutes from '../backend/src/routes/recordRoutes.js'
import folderRoutes from '../backend/src/routes/folderRoutes.js'
import aiRoutes from '../backend/src/routes/aiRoutes.js'
import categoryRoutes from '../backend/src/routes/categoryRoutes.js'

import { connectDB } from '../backend/src/cofig/db.js'
import dotenv from "dotenv"

dotenv.config();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5001"
]

const app = express();
const server = http.createServer(app);

// IMPORTANT: Middleware order matters!
// 1. CORS must come BEFORE routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

// 2. Then body parser
app.use(express.json());

// 3. Then routes
app.use('/api/record', recordRoutes);
app.use('/api/folder', folderRoutes);
app.use("/api/category", categoryRoutes);
app.use('/api/ai', aiRoutes);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});


const mongoUri = process.env.MONGODB_URI;

mongoose.set("strictQuery", true); // optional, avoids warnings

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // wait 30s before timing out
})
.then(() => console.log("MongoDB connected ✅"))
.catch((err) => console.error("DATABASE CONNECTION ERROR:", err));



connectDB();

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log("Server Connected", PORT)
})