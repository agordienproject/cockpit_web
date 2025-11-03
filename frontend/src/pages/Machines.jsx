import { useEffect, useState } from 'react';
import { getAllMachines } from '../services/machineService';
import { Link } from 'react-router-dom';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllMachines();
        setMachines(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading machines...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Machines</h1>
        {role === 'admin' && (
          <Link to="/admin/machines" className="text-sm bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700">Manage</Link>
        )}
      </div>

      <div className="space-y-2">
        {machines.length === 0 && <div>No machines found.</div>}
        {machines.map((m) => (
          <div key={m.id_machine} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{m.name_machine}</div>
                <div className="text-sm text-gray-500">OS: {m.os_machine || '-'}</div>
              </div>
              <Link to={`/machines/${m.id_machine}`} className="text-indigo-600 hover:underline">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
