import api from './api';

class MediaService {
  async list(folderPath) {
    const res = await api.get('/dashboards/inspection-media', { params: { folderPath } });
    return res.data; // [{name,size,type:'image'|'video'}]
  }

  mediaUrl(folderPath, fileName) {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3000/api';
    return `${base}/dashboards/inspection-media/${encodeURIComponent(fileName)}?folderPath=${encodeURIComponent(folderPath)}`;
  }

  async listScans(folderPath) {
    const res = await api.get('/dashboards/inspection-scans', { params: { folderPath } });
    return res.data; // [{name,size,type:'ply', relativePath?}]
  }

  scanUrl(folderPath, fileOrRelativePath) {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3000/api';
    // Use relativePath via query to support nested folders
    return `${base}/dashboards/inspection-scans/${encodeURIComponent(fileOrRelativePath.split('/').pop())}?folderPath=${encodeURIComponent(folderPath)}&relativePath=${encodeURIComponent(fileOrRelativePath)}`;
  }

  async getScanReport(folderPath) {
    const res = await api.get('/dashboards/inspection-scan-report', { params: { folderPath } });
    return res.data; // { pieceReference, similarityScore, meanDistance, centroidDistance, pointCountRatio, quality }
  }
}

export default new MediaService();
