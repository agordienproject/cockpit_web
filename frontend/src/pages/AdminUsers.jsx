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
  Badge,
  Button,
  TextInput,
  Select,
  SelectItem,
} from '@tremor/react';
import { userService, serviceService } from '../services';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceQuery, setServiceQuery] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showEditServiceDropdown, setShowEditServiceDropdown] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    password: '',
  });

  // Filter states
  const [idUserFilter, setIdUserFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await serviceService.getAllServices();
      setServices(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.warn('Failed to load services for user form', err);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = async () => {
    setSaving(true);
    setError(null);
    try {
      // First, update classic user data (excluding role)
      const { id_user, first_name, last_name, email, role: newRole, id_service } = editingUser;
      const userToUpdate = { first_name, last_name, email, id_service };
      const updatedUser = await userService.updateUser(id_user, userToUpdate);

      // Find the original user to compare role
      const originalUser = users.find(u => u.id_user === id_user);
      if (originalUser && originalUser.role !== newRole) {
        // If role changed, update role
        await userService.updateUserRole(id_user, newRole);
        updatedUser.role = newRole; // reflect the new role in UI
      }

      setUsers(users.map(user =>
        user.id_user === updatedUser.id_user ? updatedUser : user
      ));
      setEditingUser(null);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Use userService instead of direct fetch
      const addedUser = await userService.createUser(newUser);
      setUsers([...users, addedUser]);
      setShowAddUser(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        password: '',
      });
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrReactivateUser = async (user) => {
    if (user.deleted) {
      // Reactivate user
      if (!window.confirm('Are you sure you want to reactivate this user?')) {
        return;
      }
      setSaving(true);
      setError(null);
      try {
        const reactivatedUser = await userService.activateUser(user.id_user);
        setUsers(users.map(u => u.id_user === user.id_user ? reactivatedUser : u));
      } catch (err) {
        setError(err.message || 'Failed to reactivate user');
      } finally {
        setSaving(false);
      }
    } else {
      // Delete user
      if (!window.confirm('Are you sure you want to delete this user?')) {
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await userService.deleteUser(user.id_user);
        setUsers(users.map(u => u.id_user === user.id_user ? { ...u, deleted: true } : u));
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setError(null);
  };

  const handleCancelAdd = () => {
    setShowAddUser(false);
    setNewUser({
      first_name: '',
      last_name: '',
      email: '',
      role: '',
      password: '',
    });
    setError(null);
  };

  // Filtered users: by default, show only active users unless statusFilter is set
  const filteredUsers = users.filter(user => {
    const name = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const role = user.role;
    const status = user.deleted ? 'deleted' : 'active';
    // If statusFilter is unset, default to 'active' users only
    const statusMatch = statusFilter ? status === statusFilter : status === 'active';
    return (
      (idUserFilter ? String(user.id_user).includes(idUserFilter) : true) &&
      name.includes(nameFilter.toLowerCase()) &&
      email.includes(emailFilter.toLowerCase()) &&
      (roleFilter ? role === roleFilter : true) &&
      (serviceFilter ? String(user.id_service || '') === serviceFilter : true) &&
      statusMatch
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <Title>User Management</Title>
        <Button 
          onClick={() => setShowAddUser(true)}
          disabled={saving}
        >
          Add User
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {showAddUser && (
        <Card className="mb-6">
          <Title>Add New User</Title>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <TextInput
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <TextInput
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <TextInput
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                disabled={saving}
              >
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="chief">Chief</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                <TextInput className="w-full cursor-pointer" placeholder="Search service..." value={newUser.id_service ? (services.find(s => String(s.id_service) === String(newUser.id_service))?.name_service || '') : serviceQuery} onChange={e => setServiceQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowServiceDropdown(true); }} />
                {showServiceDropdown && (
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewUser({ ...newUser, id_service: '' }); setServiceQuery(''); setShowServiceDropdown(false); }}>
                      None
                    </div>
                    {services
                      .filter(Boolean)
                      .filter(s => !serviceQuery || (s.name_service || '').toString().toLowerCase().includes(serviceQuery.toLowerCase()))
                      .map(s => (
                        <div
                          key={s.id_service}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setNewUser({ ...newUser, id_service: String(s.id_service) }); setServiceQuery(''); setShowServiceDropdown(false); }}
                        >
                          {s.name_service}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <TextInput
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCancelAdd}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddUser}
                loading={saving}
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add User'}
              </Button>
            </div>
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
                  <TextInput
                    className="mt-1"
                    placeholder="Search id..."
                    value={idUserFilter}
                    onChange={e => setIdUserFilter(e.target.value)}
                    disabled={saving}
                    size="sm"
                  />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Name
                  <TextInput
                    className="mt-1"
                    placeholder="Search name..."
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    disabled={saving}
                    size="sm"
                  />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Email
                  <TextInput
                    className="mt-1"
                    placeholder="Search email..."
                    value={emailFilter}
                    onChange={e => setEmailFilter(e.target.value)}
                    disabled={saving}
                    size="sm"
                  />
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span>Service</span>
                  </div>
                  <Select
                    className="mt-1"
                    value={serviceFilter}
                    onValueChange={setServiceFilter}
                    disabled={saving}
                    size="sm"
                  >
                    <SelectItem value="">All</SelectItem>
                    {services.filter(Boolean).map(s => (
                      <SelectItem key={s.id_service} value={String(s.id_service)}>{s.name_service}</SelectItem>
                    ))}
                  </Select>
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Role
                  <Select
                    className="mt-1"
                    value={roleFilter}
                    onValueChange={setRoleFilter}
                    disabled={saving}
                    size="sm"
                  >
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="chief">Chief</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </Select>
                </div>
              </TableHeaderCell>
              <TableHeaderCell>
                <div className="flex flex-col">
                  Status
                  <Select
                    className="mt-1"
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    disabled={saving}
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id_user}>
                  <TableCell>{user.id_user}</TableCell>
                  <TableCell>
                    {editingUser?.id_user === user.id_user ? (
                      <div className="space-y-2">
                        <TextInput
                          value={editingUser.first_name}
                          onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                          disabled={saving}
                        />
                        <TextInput
                          value={editingUser.last_name}
                          onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                    ) : (
                      `${user.first_name} ${user.last_name}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser?.id_user === user.id_user ? (
                      <TextInput
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        disabled={saving}
                      />
                    ) : (
                      user.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser?.id_user === user.id_user ? (
                      <div className="space-y-2" onMouseDown={(e) => e.preventDefault()}>
                        <TextInput className="w-full cursor-pointer" placeholder="Search service..." value={editingUser.id_service ? (services.find(s => String(s.id_service) === String(editingUser.id_service))?.name_service || '') : serviceQuery} onChange={e => setServiceQuery(e.target.value)} onMouseDown={(e) => { e.preventDefault(); setShowEditServiceDropdown(true); }} />
                        {showEditServiceDropdown && (
                          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white">
                            <div className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingUser({ ...editingUser, id_service: '' }); setServiceQuery(''); setShowEditServiceDropdown(false); }}>
                              None
                            </div>
                            {services
                              .filter(Boolean)
                              .filter(s => !serviceQuery || (s.name_service || '').toString().toLowerCase().includes(serviceQuery.toLowerCase()))
                              .map(s => (
                                <div
                                  key={s.id_service}
                                  className="p-2 hover:bg-gray-100 cursor-pointer border-t border-gray-200 text-sm"
                                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setEditingUser({ ...editingUser, id_service: String(s.id_service) }); setServiceQuery(''); setShowEditServiceDropdown(false); }}
                                >
                                  {s.name_service}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      services.find(s => s && s.id_service === user.id_service)?.name_service || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUser?.id_user === user.id_user ? (
                      <Select
                        className="mt-1 w-full"
                        value={editingUser.role}
                        onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                        disabled={saving}
                      >
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="chief">Chief</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </Select>
                    ) : (
                      <Badge color={
                        user.role === 'admin' ? 'red' :
                        user.role === 'chief' ? 'orange' :
                        user.role === 'user' ? 'blue' :
                        'gray'
                      }>
                        {user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge color={user.deleted ? 'red' : 'emerald'}>
                      {user.deleted ? 'Deleted' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingUser?.id_user === user.id_user ? (
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={handleUpdateUser}
                          loading={saving}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleEditUser(user)}
                          disabled={saving}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          color={user.deleted ? 'emerald' : 'red'}
                          onClick={() => handleDeleteOrReactivateUser(user)}
                          loading={saving}
                          disabled={saving}
                        >
                          {saving ? (user.deleted ? 'Reactivating...' : 'Deleting...') : (user.deleted ? 'Reactivate' : 'Delete')}
                        </Button>
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