import express from "express";
import cors from "cors"
import http from "http";
import recordRoutes from '../backend/src/routes/recordRoutes.js'
import folderRoutes from '../backend/src/routes/folderRoutes.js'

import { connectDB } from '../backend/src/cofig/db.js'
import dotenv from "dotenv"


dotenv.config();

const allowedOrgins = [
    "http://localhost:5173"
]

const app = express();
const server = http.createServer(app); //

app.use(express.json());

app.use('/api/record', recordRoutes )
app.use('/api/folder', folderRoutes )

connectDB();

const PORT = process.env.PORT || 5001  // Moved this line up, and corrected "Port" to "PORT" (assuming it's a typo)

server.listen(PORT, () => {
    console.log("Server Connected", PORT)
})