import api from './api';

class PieceService {
  async getCurrentPieces() {
    const res = await api.get('/dashboards/pieces');
    return res.data;
  }

  async getPieceHistorySummary() {
    const res = await api.get('/dashboards/piece-history');
    return res.data;
  }

  async getPieceHistoryByRef(ref_piece) {
    // Detail endpoint we expose in backend: /dashboards/piece-history/:ref_piece/detail
    const res = await api.get(`/dashboards/piece-history/${encodeURIComponent(ref_piece)}/detail`);
    return res.data;
  }

  async getPieceSummaryByRef(ref_piece) {
    const res = await api.get(`/dashboards/piece-history/${encodeURIComponent(ref_piece)}`);
    return res.data;
  }
}

export default new PieceService();
