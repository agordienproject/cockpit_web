import { useEffect, useState } from 'react';
import { getAllMachines } from '../services/machineService';
import { Link } from 'react-router-dom';

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-bold mb-4">Machines</h1>
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
