import api from './api';

class FtpService {
  async listInspectionImages(_folderPath) {
    // inspections removed — return empty list
    return [];
  }

  imageUrl(_folderPath, _fileName) {
    return null;
  }
}

export default new FtpService();
