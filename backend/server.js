import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import http from "http";
import recordRoutes from "./src/routes/recordRoutes.js";
import folderRoutes from "./src/routes/folderRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import mongoose from "mongoose";
import { connectDB } from "./src/cofig/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS Configuration - CRITICAL for ngrok
const allowedOrigins = [
  "https://dtsdmin.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

// Apply CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For testing, you can allow all origins
      // Comment out the error below and use: callback(null, true);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['*'],
  maxAge: 86400,
  optionsSuccessStatus: 200
}));

// Additional CORS headers middleware (BEFORE routes)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers explicitly
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parser (AFTER CORS, BEFORE routes)
app.use(express.json());

// API Routes
app.use('/api/record', recordRoutes);
app.use('/api/folder', folderRoutes);
app.use("/api/category", categoryRoutes);
app.use('/api/ai', aiRoutes);

// Correct way to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");

// Static files
app.use(express.static(publicPath));

// Catch-all for SPA routing (MUST be last)
app.use((req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(publicPath, "index.html"));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// MongoDB Connection
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

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} ✅`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://0.0.0.0:${PORT}`);
});