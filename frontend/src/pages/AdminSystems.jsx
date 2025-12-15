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
import { systemService, machineService, serviceService } from '../services';

export default function AdminSystems() {
  const [systems, setSystems] = useState([]);
  const [machines, setMachines] = useState([]);
  const [types, setTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [typeQuery, setTypeQuery] = useState('');
  const [machineQuery, setMachineQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showMachineDropdown, setShowMachineDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);
  const [showEditMachineDropdown, setShowEditMachineDropdown] = useState(false);
  const [showEditServiceDropdown, setShowEditServiceDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name_sys: '', version_sys: '', id_machine_sys: '', id_type_sys: '', description_sys: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, m, refTypes, refServices] = await Promise.all([
        systemService.getAllSystems(),
        machineService.getAllMachines(),
        systemService.getAllRefSystems(),
        serviceService.getAllServices(),
      ]);
  setSystems(s || []);
  setMachines(m || []);
  setTypes(Array.isArray(refTypes) ? refTypes : (refTypes?.data || []));
  setServices(Array.isArray(refServices) ? refServices : (refServices?.data || []));
    } catch (err) { setError(err.message || 'Failed to load'); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    // Validate required name
    if (!newItem.name_sys || newItem.name_sys.trim() === '') {
      setError('Name is required');
      return;
    }
    setSaving(true); setError(null);
    try {
      const created = await systemService.createSystem(newItem);
      setSystems([...systems, created]);
      setShowAdd(false);
      setNewItem({ name_sys: '', version_sys: '', id_machine_sys: '', id_type_sys: '', description_sys: '' });
    } catch (err) { setError(err.message || 'Failed to add system'); } finally { setSaving(false); }
  };

  const handleEdit = (s) => setEditing({ ...s });
  const handleUpdate = async () => {
    setSaving(true); setError(null);
    try {
      const updated = await systemService.updateSystem(editing.id_sys, editing);
      setSystems(systems.map(x => x.id_sys === updated.id_sys ? updated : x));
      setEditing(null);
    } catch (err) { setError(err.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm('Delete this system?')) return;
    setSaving(true); setError(null);
    try {
      await systemService.deleteSystem(s.id_sys);
      setSystems(systems.map(x => x.id_sys === s.id_sys ? { ...x, deleted: true } : x));
    } catch (err) { setError(err.message || 'Failed to delete'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>System Management</Title>
        <Button onClick={() => setShowAdd(true)} disabled={saving}>Add System</Button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-600 text-sm">{error}</div></div>}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add System</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newItem.name_sys} onChange={e => setNewItem({ ...newItem, name_sys: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={newItem.version_sys} onChange={e => setNewItem({ ...newItem, version_sys: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                <TextInput 
                  className="w-full cursor-pointer" 
                  placeholder="Search type..." 
                  value={newItem.id_type_sys ? (types.find(t => String(t.id_type_sys) === String(newItem.id_type_sys))?.name_type_sys || '') : typeQuery}
                  onChange={e => setTypeQuery(e.target.value)} 
                  onMouseDown={(e) => { e.preventDefault(); setShowTypeDropdown(true); }}
                />
                {showTypeDropdown && (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { console.log('Clicked None for type'); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_type_sys: '' }); setTypeQuery(''); setShowTypeDropdown(false); }}>
                      None
                    </div>
                    {types
                      .filter(Boolean)
                      .filter(t => !typeQuery || (t.name_type_sys || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                      .map(t => (
                        <div
                          key={t.id_type_sys}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                          onMouseDown={(e) => { console.log('Clicked type:', t.name_type_sys); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_type_sys: String(t.id_type_sys) }); setTypeQuery(''); setShowTypeDropdown(false); }}
                        >
                          {t.name_type_sys}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Machine</label>
              <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                <TextInput className="w-full cursor-pointer" placeholder="Search machine..." value={newItem.id_machine_sys ? (machines.find(m => String(m.id_machine) === String(newItem.id_machine_sys))?.name_machine || '') : machineQuery} onChange={e => setMachineQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowMachineDropdown(true); }} />
                {showMachineDropdown && (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { console.log('Clicked None for machine'); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_machine_sys: '' }); setMachineQuery(''); setShowMachineDropdown(false); }}>
                      None
                    </div>
                    {machines
                      .filter(Boolean)
                      .filter(m => !machineQuery || (m.name_machine || '').toString().toLowerCase().includes(machineQuery.toLowerCase()))
                      .map(m => (
                        <div
                          key={m.id_machine}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                          onMouseDown={(e) => { console.log('Clicked machine:', m.name_machine); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_machine_sys: String(m.id_machine) }); setMachineQuery(''); setShowMachineDropdown(false); }}
                        >
                          {m.name_machine}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                <TextInput 
                  className="w-full cursor-pointer" 
                  placeholder="Search service..." 
                  value={newItem.id_service_sys ? (services.find(s => String(s.id_service) === String(newItem.id_service_sys))?.name_service || '') : serviceQuery}
                  onChange={e => setServiceQuery(e.target.value)} 
                  onMouseDown={(e) => { e.preventDefault(); setShowServiceDropdown(true); }}
                />
                {showServiceDropdown && (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { console.log('Clicked None for service'); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_service_sys: '' }); setServiceQuery(''); setShowServiceDropdown(false); }}>
                      None
                    </div>
                    {services
                      .filter(Boolean)
                      .filter(svc => !serviceQuery || (svc.name_service || '').toString().toLowerCase().includes(serviceQuery.toLowerCase()))
                      .map(svc => (
                        <div
                          key={svc.id_service}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                          onMouseDown={(e) => { console.log('Clicked service:', svc.name_service); e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_service_sys: String(svc.id_service) }); setServiceQuery(''); setShowServiceDropdown(false); }}
                        >
                          {svc.name_service}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newItem.description_sys} onChange={e => setNewItem({ ...newItem, description_sys: e.target.value })} disabled={saving} />
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
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Machine</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systems.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No systems found</TableCell></TableRow>
            ) : (
              systems.map(s => (
                <TableRow key={s.id_sys}>
                  <TableCell>{s.id_sys}</TableCell>
                  <TableCell>{editing?.id_sys === s.id_sys ? (<TextInput value={editing.name_sys} onChange={e => setEditing({ ...editing, name_sys: e.target.value })} />) : s.name_sys}</TableCell>
                  <TableCell>{editing?.id_sys === s.id_sys ? (<TextInput value={editing.version_sys} onChange={e => setEditing({ ...editing, version_sys: e.target.value })} />) : (s.version_sys || '-')}</TableCell>
                  <TableCell>
                    {editing?.id_sys === s.id_sys ? (
                      <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                        <TextInput className="w-full cursor-pointer" placeholder="Search type..." value={editing.id_type_sys ? (types.find(t => String(t.id_type_sys) === String(editing.id_type_sys))?.name_type_sys || '') : typeQuery} onChange={e => setTypeQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowEditTypeDropdown(true); }} />
                        {showEditTypeDropdown && (
                          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                            <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_type_sys: '' }); setTypeQuery(''); setShowEditTypeDropdown(false); }}>
                              None
                            </div>
                            {types
                              .filter(Boolean)
                              .filter(t => !typeQuery || (t.name_type_sys || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                              .map(t => (
                                <div
                                  key={t.id_type_sys}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200 text-sm"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_type_sys: String(t.id_type_sys) }); setTypeQuery(''); setShowEditTypeDropdown(false); }}
                                >
                                  {t.name_type_sys}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      types.find(t => t && t.id_type_sys === s.id_type_sys)?.name_type_sys || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editing?.id_sys === s.id_sys ? (
                      <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                        <TextInput className="w-full cursor-pointer" placeholder="Search machine..." value={editing.id_machine_sys ? (machines.find(m => String(m.id_machine) === String(editing.id_machine_sys))?.name_machine || '') : machineQuery} onChange={e => setMachineQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowEditMachineDropdown(true); }} />
                        {showEditMachineDropdown && (
                          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                            <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_machine_sys: '' }); setMachineQuery(''); setShowEditMachineDropdown(false); }}>
                              None
                            </div>
                            {machines
                              .filter(Boolean)
                              .filter(m => !machineQuery || (m.name_machine || '').toString().toLowerCase().includes(machineQuery.toLowerCase()))
                              .map(m => (
                                <div
                                  key={m.id_machine}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200 text-sm"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_machine_sys: String(m.id_machine) }); setMachineQuery(''); setShowEditMachineDropdown(false); }}
                                >
                                  {m.name_machine}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      s.id_machine_sys ? (machines.find(m => m && m.id_machine === s.id_machine_sys)?.name_machine || s.id_machine_sys) : '-'
                    )}
                  </TableCell>
                  <TableCell>{editing?.id_sys === s.id_sys ? (<TextInput value={editing.description_sys} onChange={e => setEditing({ ...editing, description_sys: e.target.value })} />) : (s.description_sys || '-')}</TableCell>
                  <TableCell>{s.deleted ? 'deleted' : 'active'}</TableCell>
                  <TableCell>
                    {editing?.id_sys === s.id_sys ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={handleUpdate} loading={saving} disabled={saving}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(s)}>Edit</Button>
                        <Button color="red" onClick={() => handleDelete(s)} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
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
