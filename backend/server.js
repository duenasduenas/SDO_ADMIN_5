import express from "express";
import cors from "cors"
import http from "http";
import recordRoutes from '../backend/src/routes/recordRoutes.js'
import folderRoutes from '../backend/src/routes/folderRoutes.js'
import aiRoutes from '../backend/src/routes/aiRoutes.js'
import categoryRoutes from '../backend/src/routes/categoryRoutes.js'
import mongoose from "mongoose";
import { connectDB } from '../backend/src/cofig/db.js'
import dotenv from "dotenv"

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS Configuration - MUST BE FIRST
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['*'],
  maxAge: 86400
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parser
app.use(express.json());

// Routes
app.use('/api/record', recordRoutes);
app.use('/api/folder', folderRoutes);
app.use("/api/category", categoryRoutes);
app.use('/api/ai', aiRoutes);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const mongoUri = process.env.MONGODB_URI;

mongoose.set("strictQuery", true);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
.then(() => console.log("MongoDB connected ✅"))
.catch((err) => console.error("DATABASE CONNECTION ERROR:", err));

connectDB();

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log("Server Connected", PORT)
})