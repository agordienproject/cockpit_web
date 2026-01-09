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

const initialNewMeta = {
  name_db: '',
  id_type_db: '',
  id_machine: '',
  version_db: '',
  description_db: '',
};

const initialNewConnection = {
  host: '',
  port: '5432',
  database: '',
  user: '',
  password: '',
};

export default function AdminDatabases() {
  const [databases, setDatabases] = useState([]);
  const [refTypes, setRefTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newMeta, setNewMeta] = useState(initialNewMeta);
  const [newConnection, setNewConnection] = useState(initialNewConnection);
  const [editing, setEditing] = useState(null);
  const [editConnection, setEditConnection] = useState(null);
  const [editPasswordChanged, setEditPasswordChanged] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

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
      setError(resolveErrorMessage(err, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  };

  const resetNewForm = () => {
    setNewMeta({ ...initialNewMeta });
    setNewConnection({ ...initialNewConnection });
  };

  const resolveErrorMessage = (err, fallback) => {
    if (err?.response?.data?.error) return err.response.data.error;
    if (typeof err?.message === 'string') return err.message;
    return fallback;
  };

  const validateConnection = (connection, requirePassword = true) => {
    const host = (connection.host || '').trim();
    const user = (connection.user || '').trim();
    const database = (connection.database || '').trim();
    if (!host || !user || !database) {
      setError('Host, user, and database are required');
      return false;
    }
    if (requirePassword) {
      const password = (connection.password || '').trim();
      if (!password) {
        setError('Password is required');
        return false;
      }
    }
    return true;
  };

  const buildConnectionPayload = (connection, includePassword = true) => {
    const host = (connection.host || '').trim();
    const user = (connection.user || '').trim();
    const database = (connection.database || '').trim();
    const port = (connection.port || '').trim();
    const password = (connection.password || '').trim();
    const payload = {
      host,
      port: port || undefined,
      database: database || undefined,
      user,
    };
    if (includePassword && password) {
      payload.password = password;
    }
    return payload;
  };

  const handleAdd = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!validateConnection(newConnection, true)) {
        setSaving(false);
        return;
      }
      const payload = {
        name_db: newMeta.name_db,
        id_type_db: newMeta.id_type_db || undefined,
        id_machine: newMeta.id_machine || undefined,
        version_db: newMeta.version_db,
        description_db: newMeta.description_db,
        connection: buildConnectionPayload(newConnection, true),
      };
      const created = await dbService.createDatabase(payload);
      setDatabases(prev => [...prev, created]);
      setShowAdd(false);
      resetNewForm();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to add database'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (connection, requirePassword = true) => {
    setError(null);
    if (!validateConnection(connection, requirePassword)) {
      return;
    }
    try {
      const resp = await dbService.testDatabaseConnection(buildConnectionPayload(connection, true));
      if (!resp?.ok) {
        setError(resp?.error || 'Connection test failed');
      } else {
        window.alert('Connection OK');
      }
    } catch (err) {
      setError(resolveErrorMessage(err, 'Connection test failed'));
    }
  };

  const handleEdit = (db) => {
    setEditing({
      id_db: db.id_db,
      name_db: db.name_db || '',
      id_type_db: db.id_type_db ? String(db.id_type_db) : '',
      id_machine: db.id_machine ? String(db.id_machine) : '',
      version_db: db.version_db || '',
      description_db: db.description_db || '',
      deleted: db.deleted,
    });
    setEditConnection({
      host: db.connection?.host || '',
      port: db.connection?.port || '',
      database: db.connection?.database || '',
      user: db.connection?.user || '',
      password: '',
      hasExistingPassword: Boolean(db.connection?.hasPassword),
    });
    setEditPasswordChanged(false);
    setError(null);
  };

  const handleUpdate = async () => {
    if (!editing || !editConnection) return;
    setSaving(true);
    setError(null);
    try {
      if (!validateConnection(editConnection, editPasswordChanged ? true : false)) {
        setSaving(false);
        return;
      }
      if (editPasswordChanged && !editConnection.password) {
        setError('Provide a new password when marking it as changed');
        setSaving(false);
        return;
      }
      const payload = {
        name_db: editing.name_db,
        id_type_db: editing.id_type_db || undefined,
        id_machine: editing.id_machine || undefined,
        version_db: editing.version_db,
        description_db: editing.description_db,
        connection: {
          ...buildConnectionPayload(editConnection, editPasswordChanged),
          passwordChanged: editPasswordChanged,
        },
      };
      const updated = await dbService.updateDatabase(editing.id_db, payload);
      setDatabases(prev => prev.map(d => d.id_db === updated.id_db ? updated : d));
      setEditing(null);
      setEditConnection(null);
      setEditPasswordChanged(false);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to update database'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestEditConnection = () => {
    if (!editConnection) return;
    if (!editPasswordChanged) {
      setError('Enter password to test the connection');
      return;
    }
    handleTestConnection(editConnection, true);
  };

  const handleDelete = async (db) => {
    if (!window.confirm('Delete this database?')) return;
    setSaving(true);
    setError(null);
    try {
      await dbService.deleteDatabase(db.id_db);
      setDatabases(prev => prev.map(x => x.id_db === db.id_db ? { ...x, deleted: true } : x));
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to delete database'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>Database Management</Title>
        <Button onClick={() => { setShowAdd(true); setError(null); }} disabled={saving}>Add Database</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {showAdd && (
        <Card className="mb-6">
          <Title>Add Database</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={newMeta.name_db} onChange={e => setNewMeta({ ...newMeta, name_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                value={newMeta.id_type_db}
                onChange={e => setNewMeta({ ...newMeta, id_type_db: e.target.value })}
                disabled={saving}
              >
                <option value="">None</option>
                {refTypes.map(t => (
                  <option key={t.id_type_db} value={t.id_type_db}>{t.name_type_db}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={newMeta.version_db} onChange={e => setNewMeta({ ...newMeta, version_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <TextInput value={newConnection.host} onChange={e => setNewConnection({ ...newConnection, host: e.target.value })} disabled={saving} placeholder="db-host.example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <TextInput value={newConnection.port} onChange={e => setNewConnection({ ...newConnection, port: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Database</label>
              <TextInput value={newConnection.database} onChange={e => setNewConnection({ ...newConnection, database: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <TextInput value={newConnection.user} onChange={e => setNewConnection({ ...newConnection, user: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <TextInput type="password" value={newConnection.password} onChange={e => setNewConnection({ ...newConnection, password: e.target.value })} disabled={saving} />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={newMeta.description_db} onChange={e => setNewMeta({ ...newMeta, description_db: e.target.value })} disabled={saving} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAdd(false);
                resetNewForm();
                setError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleTestConnection(newConnection, true)} disabled={saving}>Test connection</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add'}</Button>
          </div>
        </Card>
      )}

      {editing && editConnection && (
        <Card className="mb-6">
          <Title>Edit Database</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <TextInput value={editing.name_db} onChange={e => setEditing({ ...editing, name_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                value={editing.id_type_db}
                onChange={e => setEditing({ ...editing, id_type_db: e.target.value })}
                disabled={saving}
              >
                <option value="">None</option>
                {refTypes.map(t => (
                  <option key={t.id_type_db} value={t.id_type_db}>{t.name_type_db}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <TextInput value={editing.version_db} onChange={e => setEditing({ ...editing, version_db: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Host</label>
              <TextInput value={editConnection.host} onChange={e => setEditConnection({ ...editConnection, host: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <TextInput value={editConnection.port} placeholder="5432" onChange={e => setEditConnection({ ...editConnection, port: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Database</label>
              <TextInput value={editConnection.database} onChange={e => setEditConnection({ ...editConnection, database: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User</label>
              <TextInput value={editConnection.user} onChange={e => setEditConnection({ ...editConnection, user: e.target.value })} disabled={saving} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <TextInput
                type="password"
                value={editConnection.password}
                placeholder={editConnection.hasExistingPassword && !editPasswordChanged ? '********' : ''}
                onChange={e => {
                  const value = e.target.value;
                  setEditConnection({ ...editConnection, password: value });
                  setEditPasswordChanged(Boolean(value.trim()));
                }}
                disabled={saving}
              />
              {editConnection.hasExistingPassword && !editPasswordChanged && (
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password.</p>
              )}
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <TextInput value={editing.description_db} onChange={e => setEditing({ ...editing, description_db: e.target.value })} disabled={saving} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setEditConnection(null);
                setEditPasswordChanged(false);
                setError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleTestEditConnection}
              disabled={saving}
            >
              Test connection
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
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
              <TableHeaderCell>Host</TableHeaderCell>
              <TableHeaderCell>Database</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {databases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">No databases found</TableCell>
              </TableRow>
            ) : (
              databases.map(db => {
                const hostDisplay = db.connection?.host ? `${db.connection.host}${db.connection.port ? `:${db.connection.port}` : ''}` : '-';
                return (
                  <TableRow key={db.id_db}>
                    <TableCell>{db.name_db}</TableCell>
                    <TableCell>{db.name_type_db || '-'}</TableCell>
                    <TableCell>{db.version_db || '-'}</TableCell>
                    <TableCell>{hostDisplay}</TableCell>
                    <TableCell>{db.connection?.database || '-'}</TableCell>
                    <TableCell>{db.connection?.user || '-'}</TableCell>
                    <TableCell>{db.description_db || '-'}</TableCell>
                    <TableCell>{db.deleted ? 'deleted' : 'active'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="xs" variant="secondary" onClick={() => handleEdit(db)} disabled={saving}>Edit</Button>
                        <Button size="xs" color="red" onClick={() => handleDelete(db)} disabled={saving}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
