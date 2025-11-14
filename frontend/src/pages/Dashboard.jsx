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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machineStats, setMachineStats] = useState({ total: 0, connected: 0 });
  const [testingConnections, setTestingConnections] = useState(false);
  const [workerCount, setWorkerCount] = useState(0);
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [machines, workers] = await Promise.all([
          machineService.getAllMachines(),
          workerService.getAllWorkers(),
        ]);
        const total = Array.isArray(machines) ? machines.length : 0;
        setWorkerCount(Array.isArray(workers) ? workers.length : 0);
        await testConnections(machines, total);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const testConnections = async (machines, totalOverride = null) => {
    if (!Array.isArray(machines)) { setMachineStats({ total: 0, connected: 0 }); return; }
    setTestingConnections(true);
    try {
      const results = await Promise.all(
        machines.map(m => {
          const url = (m && m.url_metrics_machine) ? String(m.url_metrics_machine).trim() : '';
          if (!url) return Promise.resolve({ ok: false });
          return machineService.testExporterUrl(url).catch(() => ({ ok: false }));
        })
      );
      const connected = results.filter(r => r && r.ok === true).length;
      setMachineStats({ total: totalOverride !== null ? totalOverride : machines.length, connected });
    } finally {
      setTestingConnections(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Overview</Title>
      <Text className="mt-2">Quick system summary</Text>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
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

        <Card className="flex flex-col justify-between">
          <div>
            <Title>Dashboards Windows</Title>
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