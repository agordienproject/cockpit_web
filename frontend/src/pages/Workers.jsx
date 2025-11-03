import { useEffect, useState } from 'react';
import { getAllWorkers } from '../services/workerService';
import { Link } from 'react-router-dom';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllWorkers();
        setWorkers(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading workers...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Workers</h1>
        {role === 'admin' && (
          <Link to="/admin/workers" className="text-sm bg-indigo-600 text-white px-3 py-1 rounded shadow-sm hover:bg-indigo-700">Manage</Link>
        )}
      </div>

      <div className="space-y-2">
        {workers.length === 0 && <div>No workers found.</div>}
        {workers.map((w) => (
          <div key={w.id_worker} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{w.name_worker}</div>
                <div className="text-sm text-gray-500">System: {w.id_sys || '-'}, Machine: {w.id_machine || '-'}</div>
              </div>
              <Link to={`/workers/${w.id_worker}`} className="text-indigo-600 hover:underline">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
