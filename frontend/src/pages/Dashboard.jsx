import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Title,
  Text,
  Grid,
  Metric,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell
} from '@tremor/react';
import machineService from '../services/machineService';
import workerService from '../services/workerService';
import verifService from '../services/verifService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machineStats, setMachineStats] = useState({ total: 0, connected: 0 });
  const [testingConnections, setTestingConnections] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  const [systemStats, setSystemStats] = useState({ total: 0, ok: 0, warn: 0, error: 0 });
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        console.log('[Dashboard] Load start');
        console.log('[Dashboard] Fetching machines & workers');
        // Load machines & workers first to reduce chance of early 401 redirect
        const [machines, workers] = await Promise.all([
          machineService.getAllMachines(),
          workerService.getAllWorkers(),
        ]);
        console.log('[Dashboard] Machines fetched:', Array.isArray(machines) ? machines.length : 'not array');
        console.log('[Dashboard] Workers fetched:', Array.isArray(workers) ? workers.length : 'not array');
        // Then attempt verifications (may return [] silently if unauthorized)
        const currentVerifs = await verifService.getCurrentVerifs();
        console.log('[Dashboard] Current verifications fetched:', Array.isArray(currentVerifs) ? currentVerifs.length : 'not array');
        const total = Array.isArray(machines) ? machines.length : 0;
        setWorkerCount(Array.isArray(workers) ? workers.length : 0);
        // Derive system status counts from latest verifications
        if (Array.isArray(currentVerifs)) {
          let ok = 0, warn = 0, errorCount = 0;
          currentVerifs.forEach(v => {
            const s = String(v.status || '').toUpperCase();
            if (s === 'OK') ok += 1; else if (s === 'WARN') warn += 1; else if (s === 'ERROR') errorCount += 1;
          });
          setSystemStats({ total: currentVerifs.length, ok, warn, error: errorCount });
          console.log('[Dashboard] System stats computed:', { total: currentVerifs.length, ok, warn, error: errorCount });
        }
        await testConnections(machines, total);
        console.log('[Dashboard] Connection tests done');
      } catch (err) {
        setError(err.message || 'Failed to load dashboard summary');
        console.error('[Dashboard] Load error:', err);
      } finally {
        setLoading(false);
        console.log('[Dashboard] Load end');
      }
    };
    load();
  }, []);

  const testConnections = async (machines, totalOverride = null) => {
    if (!Array.isArray(machines)) { setMachineStats({ total: 0, connected: 0 }); return; }
    setTestingConnections(true);
    try {
      console.log('[Dashboard] Testing connections for', machines.length, 'machines');
      const results = await Promise.all(
        machines.map(m => {
          const url = (m && m.url_metrics_machine) ? String(m.url_metrics_machine).trim() : '';
          if (!url) return Promise.resolve({ ok: false });
          return machineService.testExporterUrl(url).catch(() => ({ ok: false }));
        })
      );
      const connected = results.filter(r => r && r.ok === true).length;
      setMachineStats({ total: totalOverride !== null ? totalOverride : machines.length, connected });
      console.log('[Dashboard] Connection test results:', { connected, total: totalOverride !== null ? totalOverride : machines.length });
    } finally {
      setTestingConnections(false);
      console.log('[Dashboard] Testing connections finished');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Overview</Title>
      <Text className="mt-2">Quick system summary</Text>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mt-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <Title>Machines</Title>
              <Metric className="mt-2">{machineStats.connected} / {machineStats.total} connected</Metric>
              <Text className="mt-2 text-sm">Connectivity tested via metrics endpoint reachability.</Text>
            </div>
            <button
              onClick={async () => {
                try {
                  const machines = await machineService.getAllMachines();
                  await testConnections(machines);
                } catch (e) { /* ignore refresh errors */ }
              }}
              disabled={testingConnections}
              className="ml-4 mt-1 inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >{testingConnections ? 'Testing...' : 'Refresh'}</button>
          </div>
        </Card>

        <Card>
          <Title>Workers</Title>
          <Metric className="mt-2">{workerCount}</Metric>
          <Text className="mt-2 text-sm">Total registered workers</Text>
        </Card>

        <Card>
          <Title>Systems</Title>
          <div className="mt-2 flex flex-col gap-1">
            <Metric>{systemStats.total} total</Metric>
            <div className="text-sm mt-2 space-y-1">
              <div className="flex justify-between"><span className="font-medium text-green-600">OK</span><span>{systemStats.ok}</span></div>
              <div className="flex justify-between"><span className="font-medium text-amber-600">WARN</span><span>{systemStats.warn}</span></div>
              <div className="flex justify-between"><span className="font-medium text-red-600">ERROR</span><span>{systemStats.error}</span></div>
            </div>
          </div>
          <Text className="mt-2 text-xs text-gray-500">Latest verification per system grouped by status.</Text>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <Title>Dashboards des machines</Title>
            <Text className="mt-2 text-sm">Visualiser les métriques système (CPU, RAM, Disque, Réseau).</Text>
          </div>
          <Link
            to="/dashboards/windows"
            className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded shadow"
          >
            Ouvrir le dashboard
          </Link>
        </Card>
      </Grid>
    </main>
  );
}