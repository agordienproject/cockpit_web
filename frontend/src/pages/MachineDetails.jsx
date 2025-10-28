import { useEffect, useState } from 'react';
import { getMachineById } from '../services/machineService';
import { useParams, Link } from 'react-router-dom';

export default function MachineDetails() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMachineById(id);
        setMachine(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!machine) return <div>Machine not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Machine: {machine.name_machine}</h1>
      <div className="bg-white p-4 rounded border">
        <p><strong>OS:</strong> {machine.os_machine || '-'}</p>
        <p><strong>Version:</strong> {machine.version_machine || '-'}</p>
        <p><strong>Type ID:</strong> {machine.id_type_machine || '-'}</p>
        <p className="mt-2"><strong>Description:</strong></p>
        <div className="whitespace-pre-wrap">{machine.description_machine || '-'}</div>
        <p className="mt-2"><strong>Metrics URL:</strong> {machine.url_metrics_machine || '-'}</p>
      </div>

      <div className="mt-4">
        <Link to="/machines" className="text-indigo-600 hover:underline">Back to machines</Link>
      </div>
    </div>
  );
}
