import { Request, Response, NextFunction } from 'express';
import { info } from '../utils/logger';

const PROMETHEUS_SD_TOKEN = process.env.PROMETHEUS_SD_TOKEN || '';

export const verifyPrometheusToken = (req: Request, res: Response, next: NextFunction) => {
    const token = (req.query.token as string | undefined) || '';
    if (!PROMETHEUS_SD_TOKEN || token !== PROMETHEUS_SD_TOKEN) {
        info(`[Monitoring] Access denied: invalid or missing token from ${req.ip}`);
        return res.status(403).json([]);
    }
    next();
};
