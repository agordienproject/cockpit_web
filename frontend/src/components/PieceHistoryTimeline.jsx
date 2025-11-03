import { useMemo } from 'react';
import { Card, Title, Text, Badge, Button } from '@tremor/react';

export default function PieceHistoryTimeline({ history = [], currentIndex = 0, onPrev, onNext }) {
  const current = history[currentIndex] || null;
  const total = history.length;

  const header = useMemo(() => {
    if (!current) return 'No history available';
    return `${current.name_piece || current.ref_piece} — ${current.state || '—'}`;
  }, [current]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Title>Piece History</Title>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onPrev} disabled={currentIndex <= 0}>◀</Button>
          <Text>{total > 0 ? `${currentIndex + 1} / ${total}` : '-'}</Text>
          <Button variant="secondary" onClick={onNext} disabled={currentIndex >= total - 1}>▶</Button>
        </div>
      </div>

      {current ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={current.TOP_CURRENT ? 'indigo' : 'gray'}>
              {current.TOP_CURRENT ? 'Current' : 'Past'}
            </Badge>
            {current.state && <Badge color="blue">{current.state}</Badge>}
            {typeof current.dents === 'boolean' && (
              <Badge color={current.dents ? 'red' : 'emerald'}>Dents: {current.dents ? 'Yes' : 'No'}</Badge>
            )}
            {typeof current.corrosions === 'boolean' && (
              <Badge color={current.corrosions ? 'red' : 'emerald'}>Corrosions: {current.corrosions ? 'Yes' : 'No'}</Badge>
            )}
            {typeof current.scratches === 'boolean' && (
              <Badge color={current.scratches ? 'red' : 'emerald'}>Scratches: {current.scratches ? 'Yes' : 'No'}</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><strong>ID Piece:</strong> {current.id_piece ?? '-'}</div>
            <div><strong>Ref Piece:</strong> {current.ref_piece ?? '-'}</div>
            <div><strong>Name Piece:</strong> {current.name_piece ?? '-'}</div>
            <div><strong>Program:</strong> {current.name_program ?? '-'}</div>

            <div><strong>Start Date:</strong> {current.start_date ?? '-'}</div>
            <div><strong>End Date:</strong> {current.end_date ?? '-'}</div>

            <div><strong>Created At:</strong> {current.creation_date ?? '-'}</div>
            <div><strong>Created By:</strong> {current._user_creation_name || current.user_creation || '-'}</div>
            <div><strong>Modified At:</strong> {current.modification_date ?? '-'}</div>
            <div><strong>Modified By:</strong> {current._user_modification_name || current.user_modification || '-'}</div>

            {typeof current.deleted !== 'undefined' && (
              <div><strong>Deleted:</strong> {current.deleted ? 'Yes' : 'No'}</div>
            )}
            {typeof current.TOP_CURRENT !== 'undefined' && (
              <div><strong>Top Current:</strong> {current.TOP_CURRENT ? '1' : '0'}</div>
            )}

            <div className="md:col-span-2"><strong>Details:</strong> {current.details || '-'}</div>
          </div>
        </div>
      ) : (
        <Text className="mt-4">No history data</Text>
      )}
    </Card>
  );
}
