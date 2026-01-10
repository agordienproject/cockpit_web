import { Request, Response } from 'express';
import { info, error as logError } from '../utils/logger';
import * as monitorService from '../services/monitoring.service';

export const getMachineTargets = async (req: Request, res: Response) => {
    info('monitoring.getMachineTargets - request received');
    try {
        const result = await monitorService.getMachineTargets();
        info('monitoring.getMachineTargets - served groups', { count: result.length });
        res.status(200).json(result);
    } catch (e: any) {
        logError('monitoring.getMachineTargets - error', { error: e?.message || e });
        res.status(500).json([]);
    }
};

export const getPostgresTargets = async (req: Request, res: Response) => {
    info('monitoring.getPostgresTargets - request received');
    try {
        const result = await monitorService.getPostgresTargets();
        info('monitoring.getPostgresTargets - served groups', { count: result ? result.length : 0 });
        res.status(200).json(result || []);
    } catch (e: any) {
        logError('monitoring.getPostgresTargets - error', { error: e?.message || e });
        res.status(500).json([]);
    }
};

export const getMssqlTargets = async (req: Request, res: Response) => {
    info('monitoring.getMssqlTargets - request received');
    try {
        const result = await monitorService.getMssqlTargets();
        info('monitoring.getMssqlTargets - served groups', { count: result ? result.length : 0 });
        res.status(200).json(result || []);
    } catch (e: any) {
        logError('monitoring.getMssqlTargets - error', { error: e?.message || e });
        res.status(500).json([]);
    }
};

export const getMysqlTargets = async (req: Request, res: Response) => {
    info('monitoring.getMysqlTargets - request received');
    try {
        const result = await monitorService.getMysqlTargets();
        info('monitoring.getMysqlTargets - served groups', { count: result ? result.length : 0 });
        res.status(200).json(result || []);
    } catch (e: any) {
        logError('monitoring.getMysqlTargets - error', { error: e?.message || e });
        res.status(500).json([]);
    }
};
