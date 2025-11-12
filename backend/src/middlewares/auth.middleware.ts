import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { info, error as logError } from "../utils/logger";

declare module 'express-serve-static-core' {
    interface Request {
        user?: string | JwtPayload;
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    // attach a small request id to help trace a single request through middlewares
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    (req as any).requestId = reqId;
    info(`[${reqId}] verifyToken - Entering verifyToken for ${req.method} ${req.originalUrl}`);

    // Accept token from cookie (preferred) or Authorization header as fallback
    const cookieToken = (req as any).cookies?.token || req.cookies?.token;
    const header = req.headers?.authorization || req.headers?.Authorization;
    let token: string | undefined = undefined;
    if (cookieToken) token = cookieToken;
    else if (header && typeof header === 'string' && header.startsWith('Bearer ')) token = header.slice(7);

    info(`[${reqId}] verifyToken - Token present: ${!!token}`);
    if (!token) {
        info(`[${reqId}] verifyToken - Token not found`);
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }
    info(`[${reqId}] verifyToken - Verifying token`);

    try {
        info(`[${reqId}] verifyToken - Decoding token`);
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        info(`[${reqId}] verifyToken - Valid token for user: ${(decoded as any)?.id ?? (decoded as any)?.sub ?? '<no-id>'}`);
        next();
    } catch (error) {
        const errMsg = (error as any)?.message || error;
        const errName = (error as any)?.name;
        logError('verifyToken - Invalid token', { reqId, error: errMsg, name: errName, stack: (error as any)?.stack });
        // Return 401 for expired tokens so clients can distinguish and take action (relogin / refresh)
        if (errName === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token expired.' });
            return;
        }
        res.status(401).json({ error: 'Invalid token.' });
    }
};