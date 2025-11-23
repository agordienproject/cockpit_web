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
  const [oses, setOses] = useState([]);
  const [typeQuery, setTypeQuery] = useState('');
  const [osQuery, setOsQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name_machine: '', id_type_machine: '', id_os_machine: '', version_machine: '', description_machine: '', url_metrics_machine: '' });
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, status, latencyMs, error }

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
  const [resp, refTypes, refOs] = await Promise.all([machineService.getAllMachines(), machineService.getAllRefMachines(), machineService.getAllRefOs()]);
  setMachines(resp || []);
  setTypes(Array.isArray(refTypes) ? refTypes : (refTypes?.data || []));
  setOses(Array.isArray(refOs) ? refOs : (refOs?.data || []));
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
      setNewItem({ name_machine: '', id_type_machine: '', id_os_machine: '', version_machine: '', description_machine: '', url_metrics_machine: '' });
      setTestResult(null);
    } catch (err) {
      setError(err.message || 'Failed to add machine');
    } finally { setSaving(false); }
  };

  const handleTestUrl = async () => {
    setError(null);
    setTestResult(null);
    const url = newItem.url_metrics_machine?.trim();
    if (!url) { setError('Enter a metrics URL first'); return; }
    setTestLoading(true);
    try {
      console.log('AdminMachines - testing URL:', url);
      const resp = await machineService.testExporterUrl(url);
      // Expecting shape { ok: boolean, status?: number, latencyMs?: number, error?: string }
      setTestResult(resp);
    } catch (err) {
      setTestResult({ ok: false, error: err.message || 'Request failed' });
    } finally { setTestLoading(false); }
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
              <TextInput className="mb-2" placeholder="Search type..." value={typeQuery} onChange={e => setTypeQuery(e.target.value)} />
              <Select value={newItem.id_type_machine} onValueChange={val => setNewItem({ ...newItem, id_type_machine: val })}>
                <SelectItem value={''}>None</SelectItem>
                {types
                  .filter(Boolean)
                  .filter(t => !typeQuery || (t.name_type_machine || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                  .slice(0, 20)
                  .map(t => <SelectItem key={t.id_type_machine} value={String(t.id_type_machine)}>{t.name_type_machine}</SelectItem>)}
              </Select>
              {types.length > 20 && (
                <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, types.length)} of {types.length}. Refine search to find other options.</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS</label>
              <TextInput className="mb-2" placeholder="Search OS..." value={osQuery} onChange={e => setOsQuery(e.target.value)} />
              <Select value={newItem.id_os_machine} onValueChange={val => setNewItem({ ...newItem, id_os_machine: val })}>
                <SelectItem value={''}>None</SelectItem>
                {oses
                  .filter(Boolean)
                  .filter(o => !osQuery || (o.name_os_machine || '').toString().toLowerCase().includes(osQuery.toLowerCase()))
                  .slice(0, 20)
                  .map(o => <SelectItem key={o.id_os_machine} value={String(o.id_os_machine)}>{o.name_os_machine}</SelectItem>)}
              </Select>
              {oses.length > 20 && (
                <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, oses.length)} of {oses.length}. Refine search to find other options.</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={newItem.version_machine} onChange={e => setNewItem({ ...newItem, version_machine: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL Metrics</label>
              <div className="flex gap-2">
                <TextInput className="flex-1" value={newItem.url_metrics_machine} onChange={e => setNewItem({ ...newItem, url_metrics_machine: e.target.value })} disabled={saving || testLoading} />
                <Button size="xs" variant="secondary" onClick={handleTestUrl} disabled={saving || testLoading}>{testLoading ? 'Testing...' : 'Test URL'}</Button>
              </div>
              {testResult && (
                <div className={`mt-1 text-xs ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.ok ? (
                    <>
                      Reachable (status {testResult.status || '200'}){testResult.latencyMs !== undefined && ` • ${Math.round(testResult.latencyMs)}ms`}
                    </>
                  ) : (
                    <>Unreachable{testResult.error ? `: ${testResult.error}` : ''}</>
                  )}
                </div>
              )}
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
                  <TableCell>
                    {editing?.id_machine === m.id_machine ? (
                      <div>
                        <TextInput className="mb-2" placeholder="Search type..." value={typeQuery} onChange={e => setTypeQuery(e.target.value)} />
                        <Select value={editing.id_type_machine} onValueChange={val => setEditing({ ...editing, id_type_machine: val })}>
                          <SelectItem value={''}>None</SelectItem>
                          {types
                            .filter(Boolean)
                            .filter(t => !typeQuery || (t.name_type_machine || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                            .slice(0, 20)
                            .map(t => <SelectItem key={t.id_type_machine} value={String(t.id_type_machine)}>{t.name_type_machine}</SelectItem>)}
                        </Select>
                        {types.length > 20 && (
                          <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, types.length)} of {types.length}. Refine search to find other options.</div>
                        )}
                      </div>
                    ) : (
                      types.find(t => t && t.id_type_machine === m.id_type_machine)?.name_type_machine || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id_machine === m.id_machine ? (
                      <div>
                        <TextInput className="mb-2" placeholder="Search OS..." value={osQuery} onChange={e => setOsQuery(e.target.value)} />
                        <Select value={editing.id_os_machine} onValueChange={val => setEditing({ ...editing, id_os_machine: val })}>
                          <SelectItem value={''}>None</SelectItem>
                          {oses
                            .filter(Boolean)
                            .filter(o => !osQuery || (o.name_os_machine || '').toString().toLowerCase().includes(osQuery.toLowerCase()))
                            .slice(0, 20)
                            .map(o => <SelectItem key={o.id_os_machine} value={String(o.id_os_machine)}>{o.name_os_machine}</SelectItem>)}
                        </Select>
                        {oses.length > 20 && (
                          <div className="text-xs text-gray-500 mt-1">Showing {Math.min(20, oses.length)} of {oses.length}. Refine search to find other options.</div>
                        )}
                      </div>
                    ) : (
                      oses.find(o => o && o.id_os_machine === m.id_os_machine)?.name_os_machine || m.os_machine || '-'
                    )}
                  </TableCell>
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
