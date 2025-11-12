import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import machineRoutes from "./routes/machine.routes";
import systemRoutes from "./routes/system.routes";
import verifRoutes from "./routes/verif.routes";
import workerRoutes from "./routes/worker.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import cors from "cors";
import { info } from "./utils/logger";

const app = express();

const FRONT_END_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:4000';

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: FRONT_END_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/systems", systemRoutes);
app.use("/api/verifications", verifRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/workers", workerRoutes);

app.use("/api", (req, res) => {
  info(`app.api - API Request: ${req.method} ${req.originalUrl}`);
  res.status(200).json({ message: "API Request Logged" });
});
  
export default app;
