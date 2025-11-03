// InspectionService removed — stubbed to avoid runtime errors.
const removed = () => {
  throw new Error('Inspection APIs have been removed');
};

const InspectionService = {
  getInspections: removed,
  getInspectionById: removed,
  createInspection: removed,
  updateInspection: removed,
  deleteInspection: removed,
  validateInspection: removed,
  getValidationQueue: removed,
  getPiecesForInspection: removed,
  addPieceToInspection: removed,
  updatePieceInInspection: removed,
  getInspectionHistory: removed,
  exportInspectionReport: removed,
};

export default InspectionService;