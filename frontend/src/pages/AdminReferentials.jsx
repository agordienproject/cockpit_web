import { Link } from 'react-router-dom';
import { Card, Title, Button } from '@tremor/react';

export default function AdminReferentials() {
  const refs = [
    { key: 'machines', title: 'Machine Types', desc: 'Manage machine type referentials' },
    { key: 'os', title: 'Operating Systems', desc: 'Manage operating system referentials' },
    { key: 'systems', title: 'System Types', desc: 'Manage system type referentials' },
    { key: 'services', title: 'Services', desc: 'Manage service referentials' },
  ];

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Referentials Management</Title>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {refs.map(r => (
          <Card key={r.key} className="p-4">
            <div className="flex flex-col">
              <div className="text-lg font-semibold">{r.title}</div>
              <div className="text-sm text-gray-500 mt-2">{r.desc}</div>
              <div className="mt-4">
                <Link to={`/admin/ref/${r.key}`}>
                  <Button>Manage</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
