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
  const [workerCount, setWorkerCount] = useState(0);
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [machines, workers] = await Promise.all([
          machineService.getAllMachines(),
          workerService.getAllWorkers(),
        ]);

        // machines may not have a consistent 'connected' field across environments.
        // We'll check several common keys and treat truthy values as connected.
        const total = Array.isArray(machines) ? machines.length : 0;
        const connected = Array.isArray(machines)
          ? machines.filter(m => (
              m.connected === true || m.is_connected === true || m.online === true || (m.status && String(m.status).toLowerCase() === 'connected')
            )).length
          : 0;

        setMachineStats({ total, connected });
        setWorkerCount(Array.isArray(workers) ? workers.length : 0);
        
      } catch (err) {
        setError(err.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Overview</Title>
      <Text className="mt-2">Quick system summary</Text>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mt-6">
        <Card>
          <Title>Machines</Title>
          <Metric className="mt-2">{machineStats.connected} / {machineStats.total} connected</Metric>
          <Text className="mt-2 text-sm">Connected machines are detected by common flags (connected/online/status).</Text>
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