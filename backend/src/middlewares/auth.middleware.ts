import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

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
    console.log(`[${reqId}] Entering verifyToken for ${req.method} ${req.originalUrl}`);

    // Accept token from cookie (preferred) or Authorization header as fallback
    const cookieToken = (req as any).cookies?.token || req.cookies?.token;
    const header = req.headers?.authorization || req.headers?.Authorization;
    let token: string | undefined = undefined;
    if (cookieToken) token = cookieToken;
    else if (header && typeof header === 'string' && header.startsWith('Bearer ')) token = header.slice(7);

    console.log(`[${reqId}] Token present:`, !!token);
    if (!token) {
        console.log(`[${reqId}] Token not found`);
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }
    console.log(`[${reqId}] Verifying token`);

    try {
        console.log(`[${reqId}] Decoding token`);
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(`[${reqId}] Valid token for user:`, (decoded as any)?.id ?? (decoded as any)?.sub ?? '<no-id>');
        next();
    } catch (error) {
        console.log(`[${reqId}] Invalid token:`, error?.message ?? error);
        res.status(400).json({ error: 'Invalid token.' });
    }
};