import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dbService from '../services/dbService';

export default function Databases() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  useEffect(() => {
    (async () => {
      try {
        const data = await dbService.getAllDatabases();
        setDatabases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load databases');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading databases...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Databases</h1>
        {role === 'admin' && (
          <Link
            to="/admin/databases"
            className="inline-flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Manage
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {databases.length === 0 && <div>No databases found.</div>}
        {databases.map((db) => (
          <div key={db.id_db} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{db.name_db}</div>
                <div className="text-sm text-gray-500">Type: {db.name_type_db || '-'}</div>
              </div>
              <Link to={`/databases/${db.id_db}`} className="text-sm text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded">Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
