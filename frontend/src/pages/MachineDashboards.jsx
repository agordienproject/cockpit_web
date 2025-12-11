import { useEffect, useState } from 'react';

// Embeds Grafana via backend proxy if reachable, with toggle to direct URL (port 3100).
// Support both Windows and Linux dashboards via separate UIDs.
const UID_WINDOWS = process.env.REACT_APP_GRAFANA_UID_WINDOWS || process.env.REACT_APP_GRAFANA_DASHBOARD_UID || 'Kdh0OoSGz';
const UID_LINUX = process.env.REACT_APP_GRAFANA_UID_LINUX || 'rYdddlPWk';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const DIRECT_GRAFANA = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3100/grafana';

export default function MachineDashboards() {
  const [os, setOs] = useState('windows'); // 'windows' | 'linux'
  const [proxyOk, setProxyOk] = useState(true);
  const [dashPath, setDashPath] = useState(`/d/${UID_WINDOWS}`);
  const [debugText, setDebugText] = useState('');
  const DEBUG = (process.env.REACT_APP_ENABLE_DEBUG || 'true') === 'true';

  useEffect(() => {
    const currentUid = os === 'linux' ? UID_LINUX : UID_WINDOWS;
    // Try to resolve the dashboard slug via proxy search.
    const url = `${API_URL}/grafana/api/search?query=${encodeURIComponent(currentUid)}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error('proxy-failed');
        setProxyOk(true);
        // Best effort: pick the first dashboard hit matching UID (or any if none match strictly)
        const items = await r.json();
        if (DEBUG) console.log('[Dashboards] /api/search status=200 items=', items);
        try { setDebugText(JSON.stringify({ endpoint: url, status: 200, items }, null, 2)); } catch {}
        const byUid = Array.isArray(items) ? items.find((i) => i.uid === currentUid) : undefined;
        const pick = byUid || (Array.isArray(items) ? items.find((i) => i.type === 'dash-db') : null);
        if (pick && pick.url) {
          // Grafana returns url like "/grafana/d/<uid>/<slug>" when served from subpath.
          // Our backend proxy is already mounted on /grafana, so we must remove the leading "/grafana".
          let urlPath = pick.url;
          if (urlPath.startsWith('/grafana/')) urlPath = urlPath.replace(/^\/grafana/, '');
          setDashPath(urlPath); // e.g. /d/Kdh0OoSGz/windows-exporter-dashboard-...
        } else {
          setDashPath(`/d/${currentUid}`);
        }
      })
      .catch((e) => {
        setProxyOk(false);
        if (DEBUG) console.warn('[Dashboards] /api/search failed:', e);
        try { setDebugText(JSON.stringify({ endpoint: url, error: String(e) }, null, 2)); } catch {}
        setDashPath(`/d/${currentUid}`);
      });
  }, [os]);

  const base = (!proxyOk) ? DIRECT_GRAFANA : `${API_URL}/grafana`;
  const iframeSrc = `${base}${dashPath}`; // Let Grafana handle variables/refresh inside the iframe

  useEffect(() => {
    if (DEBUG) console.log('[Dashboards] source=', (!proxyOk) ? 'direct' : 'proxy', { base, dashPath, iframeSrc, proxyOk });
  }, [base, dashPath, iframeSrc, proxyOk]);

  return (
    <main className="p-4 md:p-8 w-full">
      <h1 className="text-2xl font-semibold mb-4">Dashboards {os === 'linux' ? 'Linux' : 'Windows'}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">OS</span>
          <div className="inline-flex rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOs('windows')}
              className={`px-3 py-1 text-sm ${os === 'windows' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} border-r border-gray-200 hover:bg-blue-50`}
            >
              Windows
            </button>
            <button
              type="button"
              onClick={() => setOs('linux')}
              className={`px-3 py-1 text-sm ${os === 'linux' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} hover:bg-blue-50`}
            >
              Linux
            </button>
          </div>
        </div>
      </div>
      {!proxyOk && (
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
      <p className="mt-4 text-xs text-gray-600">Source: {(!proxyOk) ? 'direct' : 'proxy'} | UID: {os === 'linux' ? UID_LINUX : UID_WINDOWS} | Path: {dashPath}</p>
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
