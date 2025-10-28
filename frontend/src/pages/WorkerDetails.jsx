import { useEffect, useState } from 'react';
import { getWorkerById } from '../services/workerService';
import { useParams, Link } from 'react-router-dom';

export default function WorkerDetails() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getWorkerById(id);
        setWorker(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!worker) return <div>Worker not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Worker: {worker.name_worker}</h1>
      <div className="bg-white p-4 rounded border">
        <p><strong>System ID:</strong> {worker.id_sys || '-'}</p>
        <p><strong>Machine ID:</strong> {worker.id_machine || '-'}</p>
        <p className="mt-2"><strong>Description:</strong></p>
        <div className="whitespace-pre-wrap">{worker.description_worker || '-'}</div>
        <p className="mt-2"><strong>Credentials:</strong> <code>{worker.creds_worker || '-'}</code></p>
      </div>

      <div className="mt-4">
        <Link to="/workers" className="text-indigo-600 hover:underline">Back to workers</Link>
      </div>
    </div>
  );
}
