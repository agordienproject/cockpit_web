import { useEffect, useMemo, useState } from 'react';
import { Card, Title, Text, Badge, Button } from '@tremor/react';
import { mediaService } from '../services';
import PLYViewer from './PLYViewer';

export default function PieceHistoryTimeline({ history = [], currentIndex = 0, onPrev, onNext }) {
  const current = history[currentIndex] || null;
  const total = history.length;
  const [media, setMedia] = useState([]); // {name,url,type}
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [scans, setScans] = useState([]); // {name,url}
  const [scanReport, setScanReport] = useState(null);

  const header = useMemo(() => {
    if (!current) return 'No history available';
    return `${current.name_piece || current.ref_piece} — ${current.state}`;
  }, [current]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const folder = current?.inspection_path;
      if (!folder) {
        if (mounted) { setMedia([]); setScans([]); setScanReport(null); setMediaError(null); }
        return;
      }
      setMediaLoading(true);
      setMediaError(null);
      try {
        const list = await mediaService.list(folder);
        const urls = (list || []).map(f => ({ name: f.name, type: f.type, url: mediaService.mediaUrl(folder, f.name) }));
        if (mounted) setMedia(urls);

        // Load scans and report
  const slist = await mediaService.listScans(folder);
  const scansWithUrl = (slist || []).map(f => ({ name: f.name, url: mediaService.scanUrl(folder, f.relativePath || f.name) }));
        const report = await mediaService.getScanReport(folder).catch(() => null);
        if (mounted) { setScans(scansWithUrl); setScanReport(report); }
      } catch (e) {
        if (mounted) setMediaError(e.message || 'Failed to load media');
      } finally {
        if (mounted) setMediaLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [current?.inspection_path]);

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

            <div><strong>Inspection ID:</strong> {current.id_inspection ?? '-'}</div>
            <div><strong>Inspection Date:</strong> {current.inspection_date ?? '-'}</div>
            <div className="md:col-span-2"><strong>Inspection Path:</strong> {current.inspection_path ?? '-'}</div>
            <div><strong>Inspection Status:</strong> {current.inspection_status ?? '-'}</div>

            <div>
              <strong>User Validation:</strong> {current._user_validation_name || current.user_validation || '-'}
            </div>
            <div><strong>Validation Date:</strong> {current.validation_date ?? '-'}</div>

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

            {/* If backend enriches with validator names (from a view), show them */}
            {current.validator_first_name || current.validator_last_name ? (
              <div className="md:col-span-2">
                <strong>Validator Name:</strong> {`${current.validator_first_name || ''} ${current.validator_last_name || ''}`.trim()}
              </div>
            ) : null}

            <div className="md:col-span-2"><strong>Details:</strong> {current.details || '-'}</div>
          </div>

          {/* Media gallery: images + videos */}
          <div className="mt-4">
            <Title className="text-base">Inspection Media</Title>
            {mediaLoading && <Text>Loading media...</Text>}
            {mediaError && <Text className="text-red-600">{mediaError}</Text>}
            {!mediaLoading && !mediaError && media.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {media.map(m => (
                  <div key={m.name} className="w-full h-80 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {m.type === 'image' ? (
                      <img src={m.url} alt={m.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <video
                        src={m.url}
                        controls
                        className="max-h-full max-w-full object-contain bg-black"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {!mediaLoading && !mediaError && media.length === 0 && (
              <Text className="text-sm text-gray-500 mt-2">No media found in inspection folder.</Text>
            )}
          </div>

          {/* 3D Scan (PLY) */}
          <div className="mt-6">
            <Title className="text-base">3D Scan</Title>
            {scans.length > 0 ? (
              <div className="mt-3">
                <PLYViewer url={scans[0].url} height={360} />
                <Text className="text-xs text-gray-500 mt-1">Showing: {scans[0].name}</Text>
              </div>
            ) : (
              <Text className="text-sm text-gray-500 mt-2">No cleaned PLY scan found.</Text>
            )}
          </div>

          {/* Scan analysis report */}
          <div className="mt-6">
            <Title className="text-base">Scan Analysis</Title>
            {scanReport ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><strong>Piece Reference:</strong> {scanReport.pieceReference ?? '-'}</div>
                <div><strong>Similarity Score:</strong> {typeof scanReport.similarityScore === 'number' ? `${scanReport.similarityScore}%` : '-'}</div>
                <div><strong>Mean Distance:</strong> {typeof scanReport.meanDistance === 'number' ? `${scanReport.meanDistance} mm` : '-'}</div>
                <div><strong>Centroid Distance:</strong> {typeof scanReport.centroidDistance === 'number' ? `${scanReport.centroidDistance} mm` : '-'}</div>
                <div><strong>Point Count Ratio:</strong> {typeof scanReport.pointCountRatio === 'number' ? scanReport.pointCountRatio : '-'}</div>
                <div><strong>Quality:</strong> {scanReport.quality ?? '-'}</div>
              </div>
            ) : (
              <Text className="text-sm text-gray-500 mt-2">No scan report found.</Text>
            )}
          </div>
        </div>
      ) : (
        <Text className="mt-4">No history data</Text>
      )}
    </Card>
  );
}
