import { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';
import { workerService, machineService, systemService } from '../services';

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [systems, setSystems] = useState([]);
  const [systemQuery, setSystemQuery] = useState('');
  const [machineQuery, setMachineQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name_worker: '', id_sys: '', id_machine: '', description_worker: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [w, m, s] = await Promise.all([workerService.getAllWorkers(), machineService.getAllMachines(), systemService.getAllSystems()]);
      setWorkers(w || []);
      setMachines(m || []);
      setSystems(s || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true); setError(null);
    try {
      const created = await workerService.createWorker(newItem);
      setWorkers([...workers, created]);
      setShowAdd(false);
      setNewItem({ name_worker: '', id_sys: '', id_machine: '', description_worker: '' });
    } catch (err) {
      setError(err.message || 'Failed to add worker');
    } finally { setSaving(false); }
  };

  const handleEdit = (w) => setEditing({ ...w });

  const handleUpdate = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await workerService.updateWorker(editing.id_worker, editing);
      setWorkers(workers.map(w => w.id_worker === updated.id_worker ? updated : w));
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Failed to update worker');
    } finally { setSaving(false); }
  };

  const handleDelete = async (w) => {
    if (!window.confirm('Delete this worker?')) return;
    setSaving(true); setError(null);
    try {
      await workerService.deleteWorker(w.id_worker);
      setWorkers(workers.map(x => x.id_worker === w.id_worker ? { ...x, deleted: true } : x));
    } catch (err) {
      setError(err.message || 'Failed to delete worker');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Worker Management</Title>
        <Button onClick={() => setShowAdd(true)} disabled={saving}>Add Worker</Button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-600 text-sm">{error}</div></div>}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add Worker</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newItem.name_worker} onChange={e => setNewItem({ ...newItem, name_worker: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">System</label>
              <TextInput className="mb-2" placeholder="Search system..." value={systemQuery} onChange={e => setSystemQuery(e.target.value)} />
              <Select value={newItem.id_sys} onValueChange={val => setNewItem({ ...newItem, id_sys: val })}>
                <SelectItem value={''}>None</SelectItem>
                {systems
                  .filter(Boolean)
                  .filter(s => !systemQuery || (s.name_sys || '').toString().toLowerCase().includes(systemQuery.toLowerCase()))
                  .slice(0, 20)
                  .map(s => <SelectItem key={s.id_sys} value={String(s.id_sys)}>{s.name_sys}</SelectItem>)}
              </Select>
              {systems.length > 20 && (
                <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, systems.length)} of {systems.length}. Refine search to find other options.</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Machine</label>
              <TextInput className="mb-2" placeholder="Search machine..." value={machineQuery} onChange={e => setMachineQuery(e.target.value)} />
              <Select value={newItem.id_machine} onValueChange={val => setNewItem({ ...newItem, id_machine: val })}>
                <SelectItem value={''}>None</SelectItem>
                {machines
                  .filter(Boolean)
                  .filter(m => !machineQuery || (m.name_machine || '').toString().toLowerCase().includes(machineQuery.toLowerCase()))
                  .slice(0, 20)
                  .map(m => <SelectItem key={m.id_machine} value={String(m.id_machine)}>{m.name_machine}</SelectItem>)}
              </Select>
              {machines.length > 20 && (
                <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, machines.length)} of {machines.length}. Refine search to find other options.</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newItem.description_worker} onChange={e => setNewItem({ ...newItem, description_worker: e.target.value })} disabled={saving} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving} disabled={saving}>{saving ? 'Adding...' : 'Add'}</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>System</TableHeaderCell>
              <TableHeaderCell>Machine</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No workers found</TableCell></TableRow>
            ) : (
              workers.map(w => (
                <TableRow key={w.id_worker}>
                  <TableCell>{w.id_worker}</TableCell>
                  <TableCell>
                    {editing?.id_worker === w.id_worker ? (
                      <TextInput value={editing.name_worker} onChange={e => setEditing({ ...editing, name_worker: e.target.value })} />
                    ) : (
                      w.name_worker
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id_worker === w.id_worker ? (
                      <div>
                        <TextInput className="mb-2" placeholder="Search system..." value={systemQuery} onChange={e => setSystemQuery(e.target.value)} />
                        <Select value={editing.id_sys} onValueChange={val => setEditing({ ...editing, id_sys: val })}>
                          <SelectItem value={''}>None</SelectItem>
                          {systems
                            .filter(Boolean)
                            .filter(s => !systemQuery || (s.name_sys || '').toString().toLowerCase().includes(systemQuery.toLowerCase()))
                            .slice(0, 20)
                            .map(s => <SelectItem key={s.id_sys} value={String(s.id_sys)}>{s.name_sys}</SelectItem>)}
                        </Select>
                        {systems.length > 20 && (
                          <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, systems.length)} of {systems.length}. Refine search to find other options.</div>
                        )}
                      </div>
                    ) : (
                      w.id_sys ? (systems.find(s => s.id_sys === w.id_sys)?.name_sys || w.id_sys) : '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id_worker === w.id_worker ? (
                      <div>
                        <TextInput className="mb-2" placeholder="Search machine..." value={machineQuery} onChange={e => setMachineQuery(e.target.value)} />
                        <Select value={editing.id_machine} onValueChange={val => setEditing({ ...editing, id_machine: val })}>
                          <SelectItem value={''}>None</SelectItem>
                          {machines
                            .filter(Boolean)
                            .filter(m => !machineQuery || (m.name_machine || '').toString().toLowerCase().includes(machineQuery.toLowerCase()))
                            .slice(0, 20)
                            .map(m => <SelectItem key={m.id_machine} value={String(m.id_machine)}>{m.name_machine}</SelectItem>)}
                        </Select>
                        {machines.length > 20 && (
                          <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, machines.length)} of {machines.length}. Refine search to find other options.</div>
                        )}
                      </div>
                    ) : (
                      w.id_machine ? (machines.find(m => m.id_machine === w.id_machine)?.name_machine || w.id_machine) : '-'
                    )}
                  </TableCell>
                  <TableCell>{editing?.id_worker === w.id_worker ? (
                    <TextInput value={editing.description_worker} onChange={e => setEditing({ ...editing, description_worker: e.target.value })} />
                  ) : (
                    w.description_worker || '-'
                  )}</TableCell>
                  <TableCell>{w.deleted ? 'deleted' : 'active'}</TableCell>
                  <TableCell>
                    {editing?.id_worker === w.id_worker ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleUpdate} loading={saving} disabled={saving}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(w)}>Edit</Button>
                        <Button color="red" onClick={() => handleDelete(w)} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
