import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DatePicker,
} from '@tremor/react';
import { inspectionService } from '../services';
import userService from '../services/userService';

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPiece, setSearchPiece] = useState('');
  const [searchRef, setSearchRef] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [userMap, setUserMap] = useState({});
  const navigate = useNavigate();

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inspectionService.getInspections();
      setInspections(data);
    } catch (err) {
      setError(err.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // Fetch users for mapping userId to name
  const fetchUsers = useCallback(async (userIds) => {
    const uniqueIds = Array.from(new Set(userIds));
    const userMapTemp = {};
    await Promise.all(uniqueIds.map(async (id) => {
      try {
        const user = await userService.getUserById(id);
        userMapTemp[id] = user.first_name + ' ' + user.last_name;
      } catch {
        userMapTemp[id] = `User ${id}`;
      }
    }));
    setUserMap(userMapTemp);
  }, []);

  // Fetch users when inspections change
  useEffect(() => {
    if (inspections.length > 0) {
      const ids = inspections.map(i => i.user_creation).filter(Boolean);
      fetchUsers(ids);
    }
  }, [inspections, fetchUsers]);

  // Filtering logic
  const filteredInspections = inspections.filter(inspection => {
    const piece = inspection.name_piece?.toLowerCase() || '';
    const ref = inspection.ref_piece?.toLowerCase() || '';
    const state = inspection.state || '';
    const status = inspection.inspection_status || '';
    const inspectionDate = inspection.inspection_date ? new Date(inspection.inspection_date) : null;
    // Date filter
    if (dateFrom && inspectionDate && inspectionDate < new Date(dateFrom)) return false;
    if (dateTo && inspectionDate && inspectionDate > new Date(dateTo)) return false;
    return (
      piece.includes(searchPiece.toLowerCase()) &&
      ref.includes(searchRef.toLowerCase()) &&
      (filterState ? state === filterState : true) &&
      (filterStatus ? status === filterStatus : true)
    );
  });

  // Sorting logic (default: date desc)
  const sortedInspections = sortConfig.key
    ? [...filteredInspections].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'inspection_date') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : [...filteredInspections].sort((a, b) => {
        // Date desc
        const aDate = a.inspection_date ? new Date(a.inspection_date) : new Date(0);
        const bDate = b.inspection_date ? new Date(b.inspection_date) : new Date(0);
        return bDate - aDate;
      });

  // Pagination logic (now uses sortedInspections)
  const totalPages = Math.ceil(sortedInspections.length / itemsPerPage);
  const paginatedInspections = sortedInspections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Sorting handler (3-state: asc, desc, default)
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: 'asc' };
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchPiece, searchRef, filterState, filterStatus, dateFrom, dateTo, sortConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inspections...</div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-10 w-full">
      <Title>Inspections</Title>
      <div className="mt-6 flex flex-col sm:flex-row gap-4 flex-wrap">
        <TextInput
          className="max-w-xs"
          placeholder="Piece name..."
          value={searchPiece}
          onChange={e => setSearchPiece(e.target.value)}
        />
        <TextInput
          className="max-w-xs"
          placeholder="Reference..."
          value={searchRef}
          onChange={e => setSearchRef(e.target.value)}
        />
        <Select
          className="max-w-xs"
          value={filterState}
          onValueChange={setFilterState}
          placeholder="State..."
        >
          <SelectItem value="">All States</SelectItem>
          {[...new Set(inspections.map(i => i.state))].map(state => (
            <SelectItem key={state} value={state}>{state}</SelectItem>
          ))}
        </Select>
        <Select
          className="max-w-xs"
          value={filterStatus}
          onValueChange={setFilterStatus}
          placeholder="Status..."
        >
          <SelectItem value="">All Statuses</SelectItem>
          {[...new Set(inspections.map(i => i.inspection_status))].map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </Select>
        <DatePicker
          className="max-w-xs"
          value={dateFrom}
          onValueChange={setDateFrom}
          placeholder="From date"
        />
        <DatePicker
          className="max-w-xs"
          value={dateTo}
          onValueChange={setDateTo}
          placeholder="To date"
        />
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}
      <Card className="mt-6 overflow-x-auto">
        <Table className="w-full min-w-[900px] text-sm">
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('name_piece')}>
                  Piece
                  {sortConfig.key === 'name_piece' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('ref_piece')}>
                  Reference
                  {sortConfig.key === 'ref_piece' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('state')}>
                  State
                  {sortConfig.key === 'state' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('user_creation')}>
                  Inspector
                  {sortConfig.key === 'user_creation' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('inspection_date')}>
                  Date
                  {sortConfig.key === 'inspection_date' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>Issues</TableHeaderCell>
              <TableHeaderCell>
                <button type="button" className="flex items-center gap-1" onClick={() => handleSort('inspection_status')}>
                  Status
                  {sortConfig.key === 'inspection_status' && (
                    <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No inspections found
                </TableCell>
              </TableRow>
            ) : (
              paginatedInspections.map((inspection) => (
                <TableRow key={inspection.id_inspection}>
                  <TableCell>{inspection.name_piece}</TableCell>
                  <TableCell>{inspection.ref_piece}</TableCell>
                  <TableCell>{inspection.state}</TableCell>
                  <TableCell>{userMap[inspection.user_creation] || inspection.user_creation}</TableCell>
                  <TableCell>{new Date(inspection.inspection_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 min-w-[120px]">
                      {inspection.dents && <Badge color="red">Dents</Badge>}
                      {inspection.corrosions && <Badge color="red">Corrosion</Badge>}
                      {inspection.scratches && <Badge color="red">Scratches</Badge>}
                      {!inspection.dents && !inspection.corrosions && !inspection.scratches && (
                        <Badge color="emerald">No Issues</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color={
                      inspection.inspection_status === 'VALIDATED' ? 'emerald' :
                      inspection.inspection_status === 'REJECTED' ? 'red' :
                      'yellow'
                    }>
                      {inspection.inspection_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="xs"
                      className="px-2 py-1 text-xs"
                      onClick={() => navigate(`/inspections/${inspection.id_inspection}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button size="xs" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
            <Button size="xs" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</Button>
            <span className="text-xs">Page {currentPage} of {totalPages}</span>
            <Button size="xs" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
            <Button size="xs" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
          </div>
        )}
      </Card>
    </main>
  );
}
