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
} from '@tremor/react';
import dbService from '../services/dbService';

export default function AdminDatabases() {
  const [databases, setDatabases] = useState([]);
  const [refTypes, setRefTypes] = useState([]);
  const [typeQuery, setTypeQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ 
    name_db: '', 
    id_type_db: '', 
    id_machine: '', 
    version_db: '', 
    description_db: '', 
    url_metrics_db: '' 
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dbs, types] = await Promise.all([
        dbService.getAllDatabases(),
        dbService.getAllRefDatabases(),
      ]);
      setDatabases(Array.isArray(dbs) ? dbs : []);
      setRefTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await dbService.createDatabase(newItem);
      setDatabases([...databases, created]);
      setShowAdd(false);
      setNewItem({ name_db: '', id_type_db: '', id_machine: '', version_db: '', description_db: '', url_metrics_db: '' });
    } catch (err) {
      setError(err.message || 'Failed to add database');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (db) => {
    setEditing({ ...db });
    setTypeQuery('');
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await dbService.updateDatabase(editing.id_db, editing);
      setDatabases(databases.map(d => d.id_db === updated.id_db ? updated : d));
      setEditing(null);
      setTypeQuery('');
    } catch (err) {
      setError(err.message || 'Failed to update database');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (db) => {
    if (!window.confirm('Delete this database?')) return;
    setSaving(true);
    setError(null);
    try {
      await dbService.deleteDatabase(db.id_db);
      setDatabases(databases.map(x => x.id_db === db.id_db ? { ...x, deleted: true } : x));
    } catch (err) {
      setError(err.message || 'Failed to delete database');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Database Management</Title>
        <Button onClick={() => setShowAdd(true)} disabled={saving}>Add Database</Button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md"><div className="text-red-600 text-sm">{error}</div></div>}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add Database</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newItem.name_db} onChange={e => setNewItem({ ...newItem, name_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                <TextInput className="w-full cursor-pointer" placeholder="Search type..." value={newItem.id_type_db ? (refTypes.find(t => String(t.id_type_db) === String(newItem.id_type_db))?.name_type_db || '') : typeQuery} onChange={e => setTypeQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowTypeDropdown(true); }} />
                {showTypeDropdown && (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_type_db: '' }); setTypeQuery(''); setShowTypeDropdown(false); }}>
                      None
                    </div>
                    {refTypes
                      .filter(Boolean)
                      .filter(t => !typeQuery || (t.name_type_db || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                      .map(t => (
                        <div
                          key={t.id_type_db}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewItem({ ...newItem, id_type_db: String(t.id_type_db) }); setTypeQuery(''); setShowTypeDropdown(false); }}
                        >
                          {t.name_type_db}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={newItem.version_db} onChange={e => setNewItem({ ...newItem, version_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Metrics URL</label>
              <TextInput value={newItem.url_metrics_db} onChange={e => setNewItem({ ...newItem, url_metrics_db: e.target.value })} disabled={saving} />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newItem.description_db} onChange={e => setNewItem({ ...newItem, description_db: e.target.value })} disabled={saving} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setNewItem({ name_db: '', id_type_db: '', id_machine: '', version_db: '', description_db: '', url_metrics_db: '' }); }} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add'}</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Metrics URL</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {databases.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No databases found</TableCell></TableRow>
            ) : (
              databases.map(db => (
                <TableRow key={db.id_db}>
                  <TableCell>{editing?.id_db === db.id_db ? (<TextInput value={editing.name_db} onChange={e => setEditing({ ...editing, name_db: e.target.value })} />) : db.name_db}</TableCell>
                  <TableCell>
                    {editing?.id_db === db.id_db ? (
                      <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                        <TextInput className="w-full cursor-pointer" placeholder="Search type..." value={editing.id_type_db ? (refTypes.find(t => String(t.id_type_db) === String(editing.id_type_db))?.name_type_db || '') : typeQuery} onChange={e => setTypeQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowEditTypeDropdown(true); }} />
                        {showEditTypeDropdown && (
                          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                            <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_type_db: '' }); setTypeQuery(''); setShowEditTypeDropdown(false); }}>
                              None
                            </div>
                            {refTypes
                              .filter(Boolean)
                              .filter(t => !typeQuery || (t.name_type_db || '').toString().toLowerCase().includes(typeQuery.toLowerCase()))
                              .map(t => (
                                <div 
                                  key={t.id_type_db} 
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditing({ ...editing, id_type_db: String(t.id_type_db) }); setTypeQuery(''); setShowEditTypeDropdown(false); }}
                                >
                                  {t.name_type_db}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      refTypes.find(t => t && t.id_type_db === db.id_type_db)?.name_type_db || '-'
                    )}
                  </TableCell>
                  <TableCell>{editing?.id_db === db.id_db ? (<TextInput value={editing.version_db || ''} onChange={e => setEditing({ ...editing, version_db: e.target.value })} />) : (db.version_db || '-')}</TableCell>
                  <TableCell>{editing?.id_db === db.id_db ? (<TextInput value={editing.url_metrics_db || ''} onChange={e => setEditing({ ...editing, url_metrics_db: e.target.value })} />) : (db.url_metrics_db || '-')}</TableCell>
                  <TableCell>{editing?.id_db === db.id_db ? (<TextInput value={editing.description_db || ''} onChange={e => setEditing({ ...editing, description_db: e.target.value })} />) : (db.description_db || '-')}</TableCell>
                  <TableCell>{db.deleted ? 'deleted' : 'active'}</TableCell>
                  <TableCell>
                    {editing?.id_db === db.id_db ? (
                      <div className="flex gap-2">
                        <Button size="xs" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                        <Button size="xs" variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="xs" variant="secondary" onClick={() => handleEdit(db)} disabled={saving}>Edit</Button>
                        <Button size="xs" color="red" onClick={() => handleDelete(db)} disabled={saving}>Delete</Button>
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
