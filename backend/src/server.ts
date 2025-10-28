// server.ts
import app from "./app";
import { config } from "dotenv";

config();

const PORT = Number(process.env.PORT_SERVEUR) || 3000;
const GLOBAL_IP = process.env.GLOBAL_IP || "127.0.0.1";

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}. http://${GLOBAL_IP}:${PORT}`);
});
