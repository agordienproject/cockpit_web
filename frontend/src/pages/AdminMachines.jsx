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
import { machineService } from '../services';

export default function AdminMachines() {
  const [machines, setMachines] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name_machine: '', id_type_machine: '', os_machine: '', version_machine: '', description_machine: '', url_metrics_machine: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
  const [resp, refTypes] = await Promise.all([machineService.getAllMachines(), machineService.getAllRefMachines()]);
  setMachines(resp || []);
  setTypes(Array.isArray(refTypes) ? refTypes : (refTypes?.data || []));
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    // Validate required fields
    if (!newItem.name_machine || newItem.name_machine.trim() === '') {
      setError('Name is required');
      return;
    }
    setSaving(true); setError(null);
    try {
      const created = await machineService.createMachine(newItem);
      setMachines([...machines, created]);
      setShowAdd(false);
      setNewItem({ name_machine: '', id_type_machine: '', os_machine: '', version_machine: '', description_machine: '', url_metrics_machine: '' });
    } catch (err) {
      setError(err.message || 'Failed to add machine');
    } finally { setSaving(false); }
  };

  const handleEdit = (m) => setEditing({ ...m });
  const handleUpdate = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await machineService.updateMachine(editing.id_machine, editing);
      setMachines(machines.map(x => x.id_machine === updated.id_machine ? updated : x));
      setEditing(null);
    } catch (err) { setError(err.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const handleDelete = async (m) => {
    if (!window.confirm('Delete this machine?')) return;
    setSaving(true); setError(null);
    try {
      await machineService.deleteMachine(m.id_machine);
      setMachines(machines.map(x => x.id_machine === m.id_machine ? { ...x, deleted: true } : x));
    } catch (err) { setError(err.message || 'Failed to delete'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Machine Management</Title>
        <Button onClick={() => setShowAdd(true)} disabled={saving}>Add Machine</Button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-600 text-sm">{error}</div></div>}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add Machine</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newItem.name_machine} onChange={e => setNewItem({ ...newItem, name_machine: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <Select value={newItem.id_type_machine} onValueChange={val => setNewItem({ ...newItem, id_type_machine: val })}>
                <SelectItem value={''}>None</SelectItem>
                {types.filter(Boolean).map(t => <SelectItem key={t.id_type_machine} value={String(t.id_type_machine)}>{t.name_type_machine}</SelectItem>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS</label>
              <TextInput value={newItem.os_machine} onChange={e => setNewItem({ ...newItem, os_machine: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={newItem.version_machine} onChange={e => setNewItem({ ...newItem, version_machine: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL Metrics</label>
              <TextInput value={newItem.url_metrics_machine} onChange={e => setNewItem({ ...newItem, url_metrics_machine: e.target.value })} disabled={saving} />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newItem.description_machine} onChange={e => setNewItem({ ...newItem, description_machine: e.target.value })} disabled={saving} />
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
                <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>OS</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>URL Metrics</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {machines.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No machines found</TableCell></TableRow>
            ) : (
              machines.map(m => (
                <TableRow key={m.id_machine}>
                  <TableCell>{m.id_machine}</TableCell>
                  <TableCell>{editing?.id_machine === m.id_machine ? (<TextInput value={editing.name_machine} onChange={e => setEditing({ ...editing, name_machine: e.target.value })} />) : m.name_machine}</TableCell>
                  <TableCell>{types.find(t => t && t.id_type_machine === m.id_type_machine)?.name_type_machine || '-'}</TableCell>
                  <TableCell>{editing?.id_machine === m.id_machine ? (<TextInput value={editing.os_machine} onChange={e => setEditing({ ...editing, os_machine: e.target.value })} />) : (m.os_machine || '-')}</TableCell>
                  <TableCell>{editing?.id_machine === m.id_machine ? (<TextInput value={editing.version_machine} onChange={e => setEditing({ ...editing, version_machine: e.target.value })} />) : (m.version_machine || '-')}</TableCell>
                  <TableCell>{editing?.id_machine === m.id_machine ? (<TextInput value={editing.url_metrics_machine} onChange={e => setEditing({ ...editing, url_metrics_machine: e.target.value })} />) : (m.url_metrics_machine || '-')}</TableCell>
                  <TableCell>{editing?.id_machine === m.id_machine ? (<TextInput value={editing.description_machine} onChange={e => setEditing({ ...editing, description_machine: e.target.value })} />) : (m.description_machine || '-')}</TableCell>
                  <TableCell>{m.deleted ? 'deleted' : 'active'}</TableCell>
                  <TableCell>
                    {editing?.id_machine === m.id_machine ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleUpdate} loading={saving} disabled={saving}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(m)}>Edit</Button>
                        <Button color="red" onClick={() => handleDelete(m)} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
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
