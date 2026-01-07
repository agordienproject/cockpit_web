import { useEffect, useState } from 'react';
import dbService from '../services/dbService';

// Embeds Grafana via backend proxy for Database metrics with support for multiple database UIDs
const UID_DB_DEFAULT = process.env.REACT_APP_GRAFANA_UID_DB || 'rYdddlPWk';
const UID_DB_POSTGRES = process.env.REACT_APP_GRAFANA_UID_DB_POSTGRES || UID_DB_DEFAULT;
const UID_DB_MYSQL = process.env.REACT_APP_GRAFANA_UID_DB_MYSQL || UID_DB_DEFAULT;
const UID_DB_MSSQL = process.env.REACT_APP_GRAFANA_UID_DB_MSSQL || UID_DB_DEFAULT;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const DIRECT_GRAFANA = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3100/grafana';

export default function DatabaseDashboards() {
  const [proxyOk, setProxyOk] = useState(true);
  const [dashPath, setDashPath] = useState(`/d/${UID_DB_DEFAULT}`);
  const [debugText, setDebugText] = useState('');
  const [dbTypes, setDbTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const DEBUG = (process.env.REACT_APP_ENABLE_DEBUG || 'true') === 'true';

  useEffect(() => {
    (async () => {
      try {
        const types = await dbService.getAllRefDatabases();
        setDbTypes(Array.isArray(types) ? types : []);
      } catch (e) {
        if (DEBUG) console.warn('[DatabaseDashboards] failed to load DB types', e);
      }
    })();
  }, [DEBUG]);

  const resolveUidForType = () => {
    if (!selectedTypeId) return UID_DB_DEFAULT;
    const t = dbTypes.find((x) => String(x.id_type_db) === String(selectedTypeId));
    const name = (t?.name_type_db || '').toLowerCase();
    if (name.includes('postgres')) return UID_DB_POSTGRES;
    if (name.includes('mysql')) return UID_DB_MYSQL;
    if (name.includes('sql server') || name.includes('mssql')) return UID_DB_MSSQL;
    return UID_DB_DEFAULT;
  };

  useEffect(() => {
    const uid = resolveUidForType();
    // Try to resolve the dashboard slug via proxy search.
    const url = `${API_URL}/grafana/api/search?query=${encodeURIComponent(uid)}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error('proxy-failed');
        setProxyOk(true);
        // Best effort: pick the first dashboard hit matching UID (or any if none match strictly)
        const items = await r.json();
        if (DEBUG) console.log('[DatabaseDashboards] /api/search status=200 items=', items);
        try { setDebugText(JSON.stringify({ endpoint: url, status: 200, items }, null, 2)); } catch {}
        const byUid = Array.isArray(items) ? items.find((i) => i.uid === uid) : undefined;
        const pick = byUid || (Array.isArray(items) ? items.find((i) => i.type === 'dash-db') : null);
        if (pick && pick.url) {
          // Grafana returns url like "/grafana/d/<uid>/<slug>" when served from subpath.
          // Our backend proxy is already mounted on /grafana, so we must remove the leading "/grafana".
          let urlPath = pick.url;
          if (urlPath.startsWith('/grafana/')) urlPath = urlPath.replace(/^\/grafana/, '');
          setDashPath(urlPath); // e.g. /d/<uid>/database-metrics-...
        } else {
          setDashPath(`/d/${uid}`);
        }
      })
      .catch((e) => {
        setProxyOk(false);
        if (DEBUG) console.warn('[DatabaseDashboards] /api/search failed:', e);
        try { setDebugText(JSON.stringify({ endpoint: url, error: String(e) }, null, 2)); } catch {}
        setDashPath(`/d/${uid}`);
      });
  }, [DEBUG, selectedTypeId, dbTypes]);

  const base = (!proxyOk) ? DIRECT_GRAFANA : `${API_URL}/grafana`;
  const iframeSrc = `${base}${dashPath}`; // Let Grafana handle variables/refresh inside the iframe

  useEffect(() => {
    if (DEBUG) console.log('[DatabaseDashboards] source=', (!proxyOk) ? 'direct' : 'proxy', { base, dashPath, iframeSrc, proxyOk });
  }, [base, dashPath, iframeSrc, proxyOk]);

  return (
    <main className="p-4 md:p-8 w-full">
      <h1 className="text-2xl font-semibold mb-4">Database Dashboards</h1>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Database type</label>
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm max-w-xs"
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
        >
          <option value="">All / Default</option>
          {dbTypes.map((t) => (
            <option key={t.id_type_db} value={t.id_type_db}>{t.name_type_db}</option>
          ))}
        </select>
      </div>
      
      {!proxyOk && (
        <div className="mb-3 p-3 text-sm rounded border border-yellow-400 bg-yellow-50 text-yellow-800">
          Proxy backend Grafana indisponible – utilisation URL directe.
        </div>
      )}
      
      <div className="w-full h-[75vh] border rounded bg-black/5 overflow-hidden">
        <iframe
          title="Grafana Database Dashboard"
          src={iframeSrc}
          className="w-full h-full"
          frameBorder="0"
          allow="fullscreen"
        />
      </div>
      
      <p className="mt-4 text-xs text-gray-600">Source: {(!proxyOk) ? 'direct' : 'proxy'} | Path: {dashPath}</p>
      {DEBUG && (
        <div className="mt-3">
          <label className="text-xs font-medium">Debug Info</label>
          <textarea readOnly className="w-full h-24 border rounded text-xs p-2" value={debugText || ''} />
          <div className="text-xs text-gray-500 mt-1">iframe: {iframeSrc}</div>
        </div>
      )}
    </main>
  );
}
