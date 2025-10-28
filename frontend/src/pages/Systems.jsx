import { useEffect, useState } from 'react';
import { getAllSystems } from '../services/systemService';
import { Link } from 'react-router-dom';

export default function Systems() {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllSystems();
        setSystems(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading systems...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Systems</h1>
      <div className="space-y-2">
        {systems.length === 0 && <div>No systems found.</div>}
        {systems.map((s) => (
          <div key={s.id_sys} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name_sys}</div>
                <div className="text-sm text-gray-500">Version: {s.version_sys || '-'}</div>
              </div>
              <Link to={`/systems/${s.id_sys}`} className="text-indigo-600 hover:underline">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
