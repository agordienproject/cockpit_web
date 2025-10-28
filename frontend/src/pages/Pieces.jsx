import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Title, Text, TextInput, Badge } from '@tremor/react';
import { pieceService } from '../services';

export default function Pieces() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await pieceService.getCurrentPieces();
        if (mounted) setPieces(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load pieces');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pieces;
    return pieces.filter((p) =>
      (p.ref_piece || '').toLowerCase().includes(t) ||
      (p.name_piece || '').toLowerCase().includes(t) ||
      (p.name_program || '').toLowerCase().includes(t)
    );
  }, [q, pieces]);

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex items-center justify-between mb-6">
        <Title>Pieces</Title>
        <div className="w-64">
          <TextInput
            placeholder="Search ref, name, program..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {loading && <Text>Loading current pieces...</Text>}
      {error && <Text className="text-red-600">{error}</Text>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={`${p.ref_piece}-${p.id_piece}`} to={`/pieces/${encodeURIComponent(p.ref_piece)}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Title className="text-base">{p.name_piece || p.ref_piece}</Title>
                    <Text className="text-xs text-gray-500">Ref: {p.ref_piece}</Text>
                  </div>
                  <Badge color={p.TOP_CURRENT ? 'indigo' : 'gray'}>{p.TOP_CURRENT ? 'Current' : 'Past'}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><strong>State:</strong> {p.state}</div>
                  <div><strong>Program:</strong> {p.name_program}</div>
                  <div><strong>Start:</strong> {p.start_date}</div>
                  <div><strong>End:</strong> {p.end_date}</div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card>
              <Text>No pieces match your search.</Text>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
