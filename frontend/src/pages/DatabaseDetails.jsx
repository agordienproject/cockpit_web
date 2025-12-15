import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dbService from '../services/dbService';

export default function DatabaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await dbService.getDatabaseById(id);
        setDatabase(data);
      } catch (err) {
        setError(err.message || 'Failed to load database');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Loading database...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!database) return <div>Database not found</div>;

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/databases')}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Databases
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-4">{database.name_db}</h1>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <p className="text-gray-900">{database.name_type_db || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Version</label>
            <p className="text-gray-900">{database.version_db || '-'}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-900">{database.description_db || '-'}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Metrics URL</label>
            <p className="text-gray-900 break-words">{database.url_metrics_db || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
