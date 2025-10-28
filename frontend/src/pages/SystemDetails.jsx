import { useEffect, useState } from 'react';
import { getSystemById } from '../services/systemService';
import { useParams, Link } from 'react-router-dom';

export default function SystemDetails() {
  const { id } = useParams();
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSystemById(id);
        setSystem(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!system) return <div>System not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">System: {system.name_sys}</h1>
      <div className="bg-white p-4 rounded border">
        <p><strong>Version:</strong> {system.version_sys || '-'}</p>
        <p><strong>Type ID:</strong> {system.id_type_sys || '-'}</p>
        <p><strong>Service ID:</strong> {system.id_service_sys || '-'}</p>
        <p><strong>Machine ID:</strong> {system.id_machine_sys || '-'}</p>
        <p className="mt-2"><strong>Description:</strong></p>
        <div className="whitespace-pre-wrap">{system.description_sys || '-'}</div>
      </div>

      <div className="mt-4">
        <Link to="/systems" className="text-indigo-600 hover:underline">Back to systems</Link>
      </div>
    </div>
  );
}
