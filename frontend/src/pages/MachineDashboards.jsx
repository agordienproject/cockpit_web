import { useEffect, useState } from 'react';

// Embeds Grafana via backend proxy if reachable, with toggle to direct URL (port 3100).
const DASHBOARD_UID = process.env.REACT_APP_GRAFANA_DASHBOARD_UID || 'windows_host_overview';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const DIRECT_GRAFANA = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3100/grafana';

export default function MachineDashboards() {
  const [instance, setInstance] = useState('host.docker.internal:9182');
  const [refresh, setRefresh] = useState('auto');
  const [useDirect, setUseDirect] = useState(false);
  const [proxyOk, setProxyOk] = useState(true);
  const [dashPath, setDashPath] = useState(`/d/${DASHBOARD_UID}`);
  const [debugText, setDebugText] = useState('');
  const DEBUG = (process.env.REACT_APP_ENABLE_DEBUG || 'true') === 'true';

  useEffect(() => {
    // Try to resolve the dashboard slug via proxy search.
    const url = `${API_URL}/grafana/api/search?query=${encodeURIComponent(DASHBOARD_UID)}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error('proxy-failed');
        setProxyOk(true);
        // Best effort: pick the first dashboard hit matching UID (or any if none match strictly)
        const items = await r.json();
        if (DEBUG) console.log('[Dashboards] /api/search status=200 items=', items);
        try { setDebugText(JSON.stringify({ endpoint: url, status: 200, items }, null, 2)); } catch {}
        const byUid = Array.isArray(items) ? items.find((i) => i.uid === DASHBOARD_UID) : undefined;
        const pick = byUid || (Array.isArray(items) ? items.find((i) => i.type === 'dash-db') : null);
        if (pick && pick.url) {
          // Grafana returns url like "/grafana/d/<uid>/<slug>" when served from subpath.
          // Our backend proxy is already mounted on /grafana, so we must remove the leading "/grafana".
          let urlPath = pick.url;
          if (urlPath.startsWith('/grafana/')) urlPath = urlPath.replace(/^\/grafana/, '');
          setDashPath(urlPath); // e.g. /d/Kdh0OoSGz/windows-exporter-dashboard-...
        } else {
          setDashPath(`/d/${DASHBOARD_UID}`);
        }
      })
      .catch((e) => {
        setProxyOk(false);
        if (DEBUG) console.warn('[Dashboards] /api/search failed:', e);
        try { setDebugText(JSON.stringify({ endpoint: url, error: String(e) }, null, 2)); } catch {}
        setDashPath(`/d/${DASHBOARD_UID}`);
      });
  }, []);

  const base = (useDirect || !proxyOk) ? DIRECT_GRAFANA : `${API_URL}/grafana`;
  const iframeSrc = `${base}${dashPath}?orgId=1&var-instance=${encodeURIComponent(instance)}&refresh=${refresh}`;

  useEffect(() => {
    if (DEBUG) console.log('[Dashboards] source=', (useDirect || !proxyOk) ? 'direct' : 'proxy', { base, dashPath, iframeSrc, proxyOk, useDirect });
  }, [base, dashPath, iframeSrc, proxyOk, useDirect]);

  return (
    <main className="p-4 md:p-8 w-full">
      <h1 className="text-2xl font-semibold mb-4">Dashboards Windows</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium">Instance</label>
          <input
            value={instance}
            onChange={e => setInstance(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
            placeholder="host:port"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium">Refresh</label>
          <select
            value={refresh}
            onChange={e => setRefresh(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="10s">10s</option>
            <option value="30s">30s</option>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="auto">auto</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={useDirect} onChange={e => setUseDirect(e.target.checked)} />
          Direct (3100)
        </label>
      </div>
      {!proxyOk && !useDirect && (
        <div className="mb-3 p-3 text-sm rounded border border-yellow-400 bg-yellow-50 text-yellow-800">
          Proxy backend Grafana indisponible – utilisation URL directe.
        </div>
      )}
      <div className="w-full h-[75vh] border rounded bg-black/5 overflow-hidden">
        <iframe
          title="Grafana Windows Dashboard"
          src={iframeSrc}
          className="w-full h-full"
          frameBorder="0"
          allow="fullscreen"
        />
      </div>
      <p className="mt-4 text-xs text-gray-600">Source: {(useDirect || !proxyOk) ? 'direct' : 'proxy'} | UID: {DASHBOARD_UID} | Path: {dashPath}</p>
      {DEBUG && (
        <div className="mt-3">
          <label className="text-xs font-medium">Impression élégante</label>
          <textarea readOnly className="w-full h-24 border rounded text-xs p-2" value={debugText || ''} />
          <div className="text-xs text-gray-500 mt-1">iframe: {iframeSrc}</div>
        </div>
      )}
    </main>
  );
}
