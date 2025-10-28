import { useEffect, useState } from 'react';
import { getAllWorkers } from '../services/workerService';
import { Link } from 'react-router-dom';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-bold mb-4">Workers</h1>
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
