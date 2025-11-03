import { config } from "dotenv";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from 'jsonwebtoken';

config();

// Verify user role
export const verifyRole = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // req.user may be injected by a prior auth middleware. Guard against missing user.
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            console.log(`[${reqId}] Access denied: no user on request (missing or invalid token) for ${req.method} ${req.originalUrl}`);
            // also log headers to help diagnose missing cookies/authorization
            console.log(`[${reqId}] Headers present: Authorization=${!!req.headers?.authorization} Cookie=${!!req.headers?.cookie}`);
            res.status(401).json({ error: "Unauthorized: no user information" });
            return;
        }

        const role = user.role;
        console.log(`[${reqId}] User role: `, role);
        // If user is not admin or chief, block access
        if (role !== "admin" && role !== "chief") {
            console.log(`[${reqId}] Access denied: unauthorized role!`, role);
            res.status(403).json({ error: "Forbidden: Bad Role" });
            return;
        }

        next();
    } catch (error) {
        console.error('Error in verifyRole middleware:', error);
        res.status(403).json({ error: "Forbidden: Bad Role" });
    }
}

// Verify user ID against request parameter
export const verifyUserId = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const user: any = (req as any).user;
        if (!user) {
            console.log('Access denied: no user on request (missing or invalid token)');
            res.status(401).json({ error: 'Unauthorized: no user information' });
            return;
        }

        const role = user.role;
        console.log("User role: ", role);

        // Admins and chiefs can proceed for any id
        if (role === "admin" || role === "chief") {
            next();
            return;
        }

        // Non-admins must only access their own resources
        const userId = String(user.id);
        const paramId = String(req.params.id);
        if (userId !== paramId) {
            console.log("Access denied: unauthorized user ID! userId=%s paramId=%s", userId, paramId);
            res.status(403).json({ error: "Forbidden: Bad User ID" });
            return;
        }

        next();
    } catch (error) {
        console.error('Error in verifyUserId middleware:', error);
        res.status(403).json({ error: "Forbidden: Bad User ID" });
    }
}
