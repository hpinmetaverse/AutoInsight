import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/user.route.js";
import authRoutes from "./routes/auth.route.js";
import predictRoutes from "./routes/predict.route.js";


import { connectDB } from "./lib/db.js";
import cors from "cors";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"], // allow both Vite and React dev servers
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  })
);
app.use(express.json());
app.use(clerkMiddleware()); // this will add auth to req object =>req.auth.userId
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  })
);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", predictRoutes);

// error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});
app.listen(PORT, () => {
  connectDB();
  console.log("Server started at http://localhost:" + PORT);
});

// socketio implementation
