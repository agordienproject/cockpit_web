import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import machineRoutes from "./routes/machine.routes";
import systemRoutes from "./routes/system.routes";
import verifRoutes from "./routes/verif.routes";
import workerRoutes from "./routes/worker.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import grafanaProxy from "./routes/grafana.routes";
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

// Secure Grafana proxy (iframe embeds authenticate via service account token)
app.use("/grafana", grafanaProxy);

// Lightweight health endpoint to verify Grafana connectivity without streaming
app.get('/api/grafana/health', async (req, res) => {
  info(`grafana.health - incoming request ${req.method} ${req.originalUrl} from ${req.ip}`);
  const apiKey = process.env.GRAFANA_API_KEY || '';
  const base = process.env.GRAFANA_INTERNAL_URL || 'http://localhost:3100/grafana';
  if (!apiKey) {
    info('grafana.health - missing api key');
    return res.status(500).json({ ok: false, error: 'missing api key' });
  }
  try {
    const started = Date.now();
    info(`grafana.health - querying ${base}/api/health`);
    const r = await fetch(base + '/api/health', { headers: { Authorization: `Bearer ${apiKey}` } });
    const json = await r.json().catch(() => ({}));
    const ms = Date.now() - started;
    info(`grafana.health - response status=${r.status} ok=${r.ok} ms=${ms}`);
    return res.status(r.status).json({ ok: r.ok, status: r.status, ms, data: json });
  } catch (e: any) {
    info(`grafana.health - fetch error: ${e?.message || String(e)}`);
    return res.status(502).json({ ok: false, error: e?.message || String(e) });
  }
});

app.use("/api", (req, res) => {
  info(`app.api - API Request: ${req.method} ${req.originalUrl}`);
  res.status(200).json({ message: "API Request Logged" });
});
  
export default app;
