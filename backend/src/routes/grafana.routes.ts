import { Router, Request, Response } from "express";
import axios from "axios";
import { info, error } from "../utils/logger";

const router = Router();

const isAllowedPath = (path: string) => {
  const allowed: RegExp[] = [
    /^\/d\/[A-Za-z0-9_-]+\//, // dashboards with slug
    /^\/d\/[A-Za-z0-9_-]+$/,   // dashboard root by uid only
    /^\/render\/d(?:-solo)?\//, // rendered panels/images
    /^\/public\//,            // public assets
    /^\/plugins\//,
    /^\/avatar\//,
    /^\/build\//,
    // Minimal Grafana APIs required by the embed page
    /^\/api\/search(?:\?.*)?$/,            // find dashboard to get slug
    /^\/api\/health$/,                      // health check
    /^\/api\/dashboards\/(?:home|uid\/[A-Za-z0-9_-]+|.*)$/, // dashboard metadata and related GETs
    // If you enable data source proxying later
    /^\/api\/datasources\/proxy\//,
    // Live WebSocket endpoint (GET with Upgrade). We allow the path, though WS upgrade is not proxied by axios.
    /^\/api\/live\/ws$/,
    // New unified dashboard plugin API (Grafana 10+): /apis/dashboard.grafana.app/... (CRD-like paths)
    /^\/apis\/dashboard\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/dashboards\/[A-Za-z0-9_-]+\/dto$/,
    /^\/apis\/dashboard\.grafana\.app\/v1beta1\/namespaces\/[^/]+\/dashboards\/[A-Za-z0-9_-]+\/.*$/, // other read-only dashboard plugin assets
    // Variables (label values) & Prometheus specific helpers
    /^\/api\/datasources\/uid\/[A-Za-z0-9_-]+\/resources\/api\/v1\/label\/[A-Za-z0-9_.:-]+\/values$/, // basic label values
    /^\/api\/datasources\/uid\/[A-Za-z0-9_-]+\/resources\/api\/v1\/label\/[A-Za-z0-9_.:-]+\/values\?.*$/, // with query params
    /^\/api\/datasources\/uid\/[A-Za-z0-9_-]+\/resources\/api\/v1\/.*$/, // other read-only Prometheus label/resource GETs
    /^\/api\/prometheus\/grafana\/api\/v1\/rules$/, // alert/rule inspection for dashboard
    // Annotations on the dashboard
    /^\/api\/annotations(?:\?.*)?$/,
    // Plugin settings (explore, loki, pyroscope, etc.) - read-only
    /^\/api\/plugins\/[A-Za-z0-9_-]+\/settings$/, 
    // Frontend metrics (grafana collecte quelques stats d'affichage) - lecture/grab
    /^\/api\/frontend-metrics$/,
  ];
  return allowed.some((r) => r.test(path));
};

// Endpoints qui doivent accepter POST pour exécuter des requêtes Prometheus/TSDB.
const isAllowedPostPath = (path: string) => {
  const postAllowed: RegExp[] = [
    /^\/api\/ds\/query$/,              // nouveau endpoint unifié
    /^\/api\/tsdb\/query$/,            // ancien endpoint
    /^\/api\/datasources\/proxy\//,    // proxy datasource (Prometheus, etc.)
    /^\/api\/frontend-metrics$/,       // parfois envoyé en POST selon version
  ];
  return postAllowed.some((r) => r.test(path));
};

router.use(async (req: Request, res: Response) => {
  const apiKey = process.env.GRAFANA_API_KEY || "";
  const base = process.env.GRAFANA_INTERNAL_URL || "http://localhost:3100/grafana";
  if (!apiKey) {
    return res.status(500).json({ error: "Grafana API key not configured (GRAFANA_API_KEY)" });
  }

  const method = (req.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS", "POST"].includes(method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const path = req.originalUrl.replace(/^\/grafana/, "") || "/";
  const pathname = path.split('?')[0];
  // Vérification dédiée POST (moins permissive)
  if (method === 'POST') {
    if (!isAllowedPostPath(pathname)) {
      info(`grafana.proxy.block.post - path=${pathname}`);
      return res.status(403).json({ error: "Path not allowed (POST)", path: pathname });
    }
  } else {
    if (!isAllowedPath(pathname)) {
      info(`grafana.proxy.block - path=${pathname}`);
      return res.status(403).json({ error: "Path not allowed", path: pathname });
    }
  }

  const targetUrl = base + path;
  const start = Date.now();
  info(`grafana.proxy.req - ${method} ${targetUrl}`);
  try {
    const isPost = method === 'POST';
    // Détection endpoints JSON (évite streaming + header content-length incohérent)
    const isJsonGet = !isPost && /^(?:\/api\/|\/apis\/dashboard\.grafana\.app\/)/.test(pathname);
    const upstream = await axios.request({
      url: targetUrl,
      method: method as any,
      responseType: (isPost || isJsonGet) ? 'json' : 'stream',
      data: isPost ? req.body : undefined,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: req.headers["accept"] || "*/*",
        "Content-Type": req.headers['content-type'] || (isPost ? 'application/json' : 'text/plain'),
      },
      timeout: 20000,
      validateStatus: () => true,
    });
    const dur = Date.now() - start;
    info(`grafana.proxy.upstream - status=${upstream.status} ms=${dur} url=${targetUrl}`);
    // propagate a subset of headers
    const headersToCopy = [
      "content-type",
      "cache-control",
      "last-modified",
      "etag",
      "content-length",
      "content-encoding",
    ];
    if (!(isPost || isJsonGet)) {
      // Streaming binaire ou assets: on copie certains headers
      for (const h of headersToCopy) {
        const v = upstream.headers[h];
        if (v !== undefined) res.setHeader(h, String(v));
      }
      res.status(upstream.status);
      (upstream.data as any).pipe(res);
    } else {
      // Réponse JSON: ne pas recopier content-length pour éviter mismatch
      res.status(upstream.status);
      return typeof upstream.data === 'object' ? res.json(upstream.data) : res.send(upstream.data);
    }
  } catch (e: any) {
    const dur = Date.now() - start;
    error(`grafana.proxy.error - ${e?.message || e} ms=${dur} url=${targetUrl}`);
    res.status(502).json({ error: "Upstream Grafana error", detail: e?.message || String(e) });
  }
});

export default router;
