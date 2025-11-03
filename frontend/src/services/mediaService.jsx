import api from './api';

class MediaService {
  async list(_folderPath) {
    // Inspection media removed — return empty list
    return [];
  }

  mediaUrl(_folderPath, _fileName) {
    // No media available
    return null;
  }

  async listScans(_folderPath) {
    // Inspection scans removed
    return [];
  }

  scanUrl(_folderPath, _fileOrRelativePath) {
    return null;
  }

  async getScanReport(_folderPath) {
    return null;
  }
}

export default new MediaService();
