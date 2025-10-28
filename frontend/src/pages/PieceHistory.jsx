import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Title, Text, Button } from '@tremor/react';
import PieceHistoryTimeline from '../components/PieceHistoryTimeline';
import { pieceService, userService } from '../services';

export default function PieceHistory() {
  const { ref } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let data = await pieceService.getPieceHistoryByRef(ref);
        if (!Array.isArray(data)) data = [];
        const sorted = data.sort((a,b) => new Date(a.start_date) - new Date(b.start_date));
        // Enrich with creator/modifier names (parallel fetch, dedup IDs)
        const ids = new Set();
        sorted.forEach(r => {
          if (r.user_creation) ids.add(String(r.user_creation));
          if (r.user_modification) ids.add(String(r.user_modification));
          if (r.user_validation) ids.add(String(r.user_validation));
        });
        const idList = Array.from(ids);
        const idToName = new Map();
        await Promise.all(idList.map(async (uid) => {
          try {
            const u = await userService.getUserById(uid);
            idToName.set(uid, `${u.first_name || ''} ${u.last_name || ''}`.trim() || String(uid));
          } catch {
            idToName.set(uid, String(uid));
          }
        }));
        const enriched = sorted.map(r => ({
          ...r,
          _user_creation_name: r.user_creation ? idToName.get(String(r.user_creation)) : undefined,
          _user_modification_name: r.user_modification ? idToName.get(String(r.user_modification)) : undefined,
          _user_validation_name: r.user_validation ? idToName.get(String(r.user_validation)) : undefined,
        }));
        if (mounted) {
          setHistory(enriched);
          setIndex(Math.max(enriched.length - 1, 0));
        }
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load piece history');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [ref]);

  return (
    <main className="p-4 md:p-10 w-full">
      <div className="flex items-center justify-between mb-6">
        <Title>Piece History: {ref}</Title>
        <Link to="/pieces"><Button variant="secondary">Back to Pieces</Button></Link>
      </div>
      {loading ? (
        <Text>Loading history...</Text>
      ) : error ? (
        <Text className="text-red-600">{error}</Text>
      ) : (
        <PieceHistoryTimeline
          history={history}
          currentIndex={index}
          onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
          onNext={() => setIndex((i) => Math.min(i + 1, Math.max(history.length - 1, 0)))}
        />
      )}
    </main>
  );
}
