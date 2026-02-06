import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors"
import http from "http";
import recordRoutes from "./src/routes/recordRoutes.js"
import folderRoutes from "./src/routes/folderRoutes.js"
import aiRoutes from "./src/routes/aiRoutes.js"
import categoryRoutes from "./src/routes/categoryRoutes.js"
import mongoose from "mongoose";
import { connectDB } from "./src/cofig/db.js"
import dotenv from "dotenv"

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['*'],
  maxAge: 86400
}));

// Body parser
app.use(express.json());

// Routes
app.use('/api/record', recordRoutes);
app.use('/api/folder', folderRoutes);
app.use("/api/category", categoryRoutes);
app.use('/api/ai', aiRoutes);

// Correct way to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");


app.use(express.static(publicPath));

// Catch-all for SPA routing
app.use((req, res) => {
  // Check if file was found by express.static
  // If we reach here and it's not an API call, serve index.html
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(publicPath, "index.html"));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

const mongoUri = process.env.MONGO_URI;

mongoose.set("strictQuery", true);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
.then(() => console.log("MongoDB connected ✅"))
.catch((err) => console.error("DATABASE CONNECTION ERROR:", err));

connectDB();

const PORT = process.env.PORT || 5004;

server.listen(PORT, "0.0.0.0", () => {
    console.log("Server Connected", PORT)
})