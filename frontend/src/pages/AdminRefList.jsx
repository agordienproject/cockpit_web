import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { machineService, systemService, serviceService } from '../services';

export default function AdminRefList() {
  const { type } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '' });

  // Filters (per-column, like AdminUsers)
  const [idFilter, setIdFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [descFilter, setDescFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const getApi = () => {
    if (type === 'machines') return {
      list: machineService.getAllRefMachines,
      create: machineService.createRefMachine,
      update: machineService.updateRefMachine,
      remove: machineService.deleteRefMachine,
      idField: 'id_type_machine',
      nameField: 'name_type_machine',
      descField: 'description_type_machine',
    };
    if (type === 'systems') return {
      list: systemService.getAllRefSystems,
      create: systemService.createRefSystem,
      update: systemService.updateRefSystem,
      remove: systemService.deleteRefSystem,
      idField: 'id_type_sys',
      nameField: 'name_type_sys',
      descField: 'description_type_sys',
    };
    // services
    return {
      list: serviceService.getAllServices,
      create: serviceService.createService,
      update: serviceService.updateService,
      remove: serviceService.deleteService,
      idField: 'id_service',
      nameField: 'name_service',
      descField: 'description_service',
    };
  };

  const api = getApi();

  const fetchAll = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await api.list(filters);
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) { setError(err.message || 'Failed to load'); } finally { setLoading(false); }
  };

  // Reset filters when switching referential type and fetch active by default
  useEffect(() => {
    setIdFilter(''); setNameFilter(''); setDescFilter(''); setStatusFilter('');
    fetchAll();
  }, [type]);

  // When any filter changes, query server-side with debounce so deleted items are returned when requested
  useEffect(() => {
    const filters = {};
    if (idFilter) filters.id = idFilter;
    if (nameFilter) filters.name = nameFilter;
    if (descFilter) filters.description = descFilter;
    if (statusFilter) filters.status = statusFilter;

    const t = setTimeout(() => {
      fetchAll(filters);
    }, 300);
    return () => clearTimeout(t);
  }, [idFilter, nameFilter, descFilter, statusFilter, type]);

  const handleAdd = async () => {
    if (!newItem.name || newItem.name.trim() === '') {
      setError('Name is required');
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = {};
      payload[api.nameField] = newItem.name;
      payload[api.descField] = newItem.description;
      const created = await api.create(payload);
      const normalized = Array.isArray(created) ? created[0] : (created?.data || created);
      // Refresh current view
      fetchAll({ id: idFilter, name: nameFilter, description: descFilter, status: statusFilter });
      setShowAdd(false);
      setNewItem({ name: '', description: '' });
    } catch (err) { setError(err.message || 'Failed to add'); } finally { setSaving(false); }
  };

  const handleEdit = (it) => setEditing({ ...it });
  const handleUpdate = async () => {
    if (!editing || !editing[api.nameField] || editing[api.nameField].trim() === '') {
      setError('Name is required');
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = {};
      payload[api.nameField] = editing[api.nameField];
      payload[api.descField] = editing[api.descField];
      const idToUpdate = editing[api.idField];
      const updated = await api.update(idToUpdate, payload);
      const normalizedUpdated = Array.isArray(updated) ? updated[0] : (updated?.data || updated);
      setItems(items.map(x => x && x[api.idField] === normalizedUpdated[api.idField] ? normalizedUpdated : x));
      setEditing(null);
    } catch (err) { setError(err.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const handleDelete = async (it) => {
    if (!window.confirm('Delete this item?')) return;
    setSaving(true); setError(null);
    try {
      await api.remove(it[api.idField]);
      setItems(items.map(x => x[api.idField] === it[api.idField] ? { ...x, deleted: true } : x));
    } catch (err) { setError(err.message || 'Failed to delete'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Referential: {type}</Title>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAdd(true)}>Add</Button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-600 text-sm">{error}</div></div>}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} disabled={saving} />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} disabled={saving} />
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
              <TableHeaderCell>
                <div className="flex flex-col">
                  ID
                  <TextInput className="mt-1" placeholder="Search id..." value={idFilter} onChange={e => setIdFilter(e.target.value)} size="sm" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Name
                  <TextInput className="mt-1" placeholder="Search name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} size="sm" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Description
                  <TextInput className="mt-1" placeholder="Search description..." value={descFilter} onChange={e => setDescFilter(e.target.value)} size="sm" />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Status
                  <Select
                    className="mt-1"
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    size="sm"
                  >
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </Select>
                </div>
              </TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No items found</TableCell></TableRow>
            ) : (
              // apply client-side filters like users page
              items
                .filter(it => {
                  const idMatch = idFilter ? String(it?.[api.idField] ?? '').includes(idFilter) : true;
                  const name = (it?.[api.nameField] ?? '').toString().toLowerCase();
                  const desc = (it?.[api.descField] ?? '').toString().toLowerCase();
                  const nameMatch = name.includes(nameFilter.toLowerCase());
                  const descMatch = desc.includes(descFilter.toLowerCase());
                  const status = it?.deleted ? 'deleted' : 'active';
                  const statusMatch = statusFilter ? status === statusFilter : status === 'active';
                  return idMatch && nameMatch && descMatch && statusMatch;
                })
                .map((it) => (
                  <TableRow key={it ? it[api.idField] : `item-${it}`}>
                    <TableCell>{it ? it[api.idField] : '-'}</TableCell>
                    <TableCell>{editing?.[api.idField] === (it ? it[api.idField] : null) ? (<TextInput value={editing[api.nameField]} onChange={e => setEditing({ ...editing, [api.nameField]: e.target.value })} />) : (it ? it[api.nameField] : '-')}</TableCell>
                    <TableCell>{editing?.[api.idField] === (it ? it[api.idField] : null) ? (<TextInput value={editing[api.descField]} onChange={e => setEditing({ ...editing, [api.descField]: e.target.value })} />) : (it ? (it[api.descField] || '-') : '-')}</TableCell>
                    <TableCell>{it.deleted ? 'deleted' : 'active'}</TableCell>
                    <TableCell>
                      {editing?.[api.idField] === it[api.idField] ? (
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                          <Button onClick={handleUpdate} loading={saving} disabled={saving}>Save</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button onClick={() => handleEdit(it)}>Edit</Button>
                          {it.deleted ? (
                            <Button
                              color="emerald"
                              onClick={async () => {
                                if (!window.confirm('Reactivate this item?')) return;
                                setSaving(true); setError(null);
                                try {
                                  if (type === 'machines') {
                                    await machineService.activateRefMachine(it[api.idField]);
                                  } else if (type === 'systems') {
                                    await systemService.activateRefSystem(it[api.idField]);
                                  } else if (type === 'services') {
                                    await serviceService.activateService(it[api.idField]);
                                  }
                                  // remove deleted flag in items if present
                                  setItems(items.map(x => x && x[api.idField] === it[api.idField] ? { ...x, deleted: false } : x));
                                } catch (err) { setError(err.message || 'Failed to reactivate'); } finally { setSaving(false); }
                              }}
                            >Reactivate</Button>
                          ) : (
                            <Button color="red" onClick={() => handleDelete(it)} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
                          )}
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
