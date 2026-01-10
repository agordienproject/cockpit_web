import { Router } from 'express';
import { verifyPrometheusToken } from '../middlewares/monitoring.middleware';
import * as monitorController from '../controllers/monitoring.controller';

const router = Router();

// Apply token check middleware to all prometheus routes
router.use('/prometheus', verifyPrometheusToken);

// Prometheus HTTP SD endpoints
router.get('/prometheus/machine-targets', monitorController.getMachineTargets);
router.get('/prometheus/postgres-targets', monitorController.getPostgresTargets);
router.get('/prometheus/mssql-targets', monitorController.getMssqlTargets);
router.get('/prometheus/mysql-targets', monitorController.getMysqlTargets);

export default router;
