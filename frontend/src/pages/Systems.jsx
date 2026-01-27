import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSystems } from '../services/systemService';
import { Link } from 'react-router-dom';

export default function Systems() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Systems</h1>
        {role === 'admin' && (
          <Link
            to="/admin/systems"
            className="inline-flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Manage
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {systems.length === 0 && <div>No systems found.</div>}
        {systems.map((s) => (
          <div key={s.id_sys} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name_sys}</div>
                <div className="text-sm text-gray-500">Version: {s.version_sys || '-'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/systems/${s.id_sys}/verifications`)}
                  className="text-sm text-green-600 hover:bg-green-50 px-3 py-1 rounded border border-green-300"
                >
                  📊 Historique
                </button>
                <Link to={`/systems/${s.id_sys}`} className="text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded border border-indigo-300">Détails</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
