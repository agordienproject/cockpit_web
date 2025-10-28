import api from './api';

class FtpService {
  async listInspectionImages(folderPath) {
    const res = await api.get('/dashboards/inspection-images', { params: { folderPath } });
    return res.data; // [{name, size}]
  }

  imageUrl(folderPath, fileName) {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3000/api';
    const url = `${base}/dashboards/inspection-images/${encodeURIComponent(fileName)}?folderPath=${encodeURIComponent(folderPath)}`;
    return url;
  }
}

export default new FtpService();
