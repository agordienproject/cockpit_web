import { config } from "dotenv";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from 'jsonwebtoken';
import { prismaPSQL } from '../prisma/client_psql';
import { info, error as logError } from "../utils/logger";

config();

// Verify user role
export const verifyRole = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // req.user may be injected by a prior auth middleware. Guard against missing user.
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            info(`[${reqId}] verifyRole - Access denied: no user on request (missing or invalid token) for ${req.method} ${req.originalUrl}`);
            info(`[${reqId}] verifyRole - Headers present: Authorization=${!!req.headers?.authorization} Cookie=${!!req.headers?.cookie}`);
            res.status(401).json({ error: "Unauthorized: no user information", code: 'AUTH_UNAUTHENTICATED' });
            return;
        }

        const role = user.role;
    info(`[${reqId}] verifyRole - User role: ${role}`);
        // Allow admin, chief and regular users for protected routes; more specific checks (referentials/users) use requireAdmin
        if (role !== "admin" && role !== "chief" && role !== "user") {
            info(`[${reqId}] verifyRole - Access denied: unauthorized role=${role}`);
            res.status(403).json({ error: "Forbidden: Bad Role", code: 'AUTH_ROLE' });
            return;
        }

        next();
    } catch (error) {
        logError('verifyRole - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(403).json({ error: "Forbidden: Bad Role", code: 'AUTH_ROLE' });
    }
}

// Verify user ID against request parameter
export const verifyUserId = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const user: any = (req as any).user;
        if (!user) {
            info('verifyUserId - Access denied: no user on request (missing or invalid token)');
            res.status(401).json({ error: 'Unauthorized: no user information', code: 'AUTH_UNAUTHENTICATED' });
            return;
        }

        const role = user.role;
    info(`verifyUserId - User role: ${role}`);

        // Admins can proceed for any id
        if (role === "admin") {
            next();
            return;
        }

        // Non-admins must only access their own resources
        const userId = String(user.id);
        const paramId = String(req.params.id);
        if (userId !== paramId) {
            info(`verifyUserId - Access denied: unauthorized user ID! userId=${userId} paramId=${paramId}`);
            res.status(403).json({ error: "Forbidden: Bad User ID", code: 'AUTH_USER_ID' });
            return;
        }

        next();
    } catch (error) {
        logError('verifyUserId - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(403).json({ error: "Forbidden: Bad User ID", code: 'AUTH_USER_ID' });
    }
}

// Require admin role only
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            info(`[${reqId}] requireAdmin - no user on request`);
            res.status(401).json({ error: 'Unauthorized: no user information', code: 'AUTH_UNAUTHENTICATED' });
            return;
        }

        if (user.role !== 'admin') {
            info(`[${reqId}] requireAdmin - access denied for role=${user.role}`);
            res.status(403).json({ error: 'Forbidden: Admins only', code: 'AUTH_ADMIN_ONLY' });
            return;
        }

        next();
    } catch (error) {
        logError('requireAdmin - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
}

// Require admin OR chief role
export const requireAdminOrChief = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            info(`[${reqId}] requireAdminOrChief - no user on request`);
            res.status(401).json({ error: 'Unauthorized: no user information', code: 'AUTH_UNAUTHENTICATED' });
            return;
        }
        if (user.role !== 'admin' && user.role !== 'chief') {
            info(`[${reqId}] requireAdminOrChief - access denied for role=${user.role}`);
            res.status(403).json({ error: 'Forbidden: Admins or Chiefs only', code: 'AUTH_ADMIN_OR_CHIEF' });
            return;
        }
        next();
    } catch (error) {
        logError('requireAdminOrChief - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
}

// Verify service-level access for systems: admins/chiefs allowed; regular users only for systems belonging to their service
export const verifySystemServiceAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            info(`[${reqId}] verifySystemServiceAccess - no user on request`);
            res.status(401).json({ error: 'Unauthorized', code: 'AUTH_UNAUTHENTICATED' });
            return;
        }

        if (user.role === 'admin' || user.role === 'chief') {
            return next();
        }

        // user.role === 'user'
        const userServiceId = user.id_service ? Number(user.id_service) : null;
        if (!userServiceId) {
            info(`[${reqId}] verifySystemServiceAccess - user has no service assigned`);
            res.status(403).json({ error: 'Forbidden: No service assigned to user', code: 'AUTH_SERVICE' });
            return;
        }

        if (req.method === 'POST') {
            const bodyService = req.body?.id_service_sys ? Number(req.body.id_service_sys) : null;
            if (bodyService && bodyService === userServiceId) return next();
            info(`[${reqId}] verifySystemServiceAccess - POST denied - bodyService=${bodyService} userService=${userServiceId}`);
            res.status(403).json({ error: 'Forbidden: cannot create system for this service', code: 'AUTH_SERVICE' });
            return;
        }

        // For PUT/DELETE, check target system belongs to user's service
    const id = req.params.id;
    const sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: parseInt(id), deleted: false } });
        if (!sys) {
            res.status(404).json({ error: 'System not found', code: 'NOT_FOUND' });
            return;
        }
        const sysService = sys.id_service_sys ? Number(sys.id_service_sys) : null;
        if (sysService === userServiceId) return next();
        info(`[${reqId}] verifySystemServiceAccess - PUT/DELETE denied - sysService=${sysService} userService=${userServiceId}`);
        res.status(403).json({ error: 'Forbidden: cannot modify/delete system for this service', code: 'AUTH_SERVICE' });
    } catch (error) {
        logError('verifySystemServiceAccess - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
}

// Verify service-level access for workers: admins/chiefs allowed; regular users only for workers connected to systems/machines in their service
export const verifyWorkerServiceAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reqId = (req as any).requestId || '<no-reqId>';
        const user: any = (req as any).user;
        if (!user) {
            info(`[${reqId}] verifyWorkerServiceAccess - no user on request`);
            res.status(401).json({ error: 'Unauthorized', code: 'AUTH_UNAUTHENTICATED' });
            return;
        }

        if (user.role === 'admin' || user.role === 'chief') {
            return next();
        }

        const userServiceId = user.id_service ? Number(user.id_service) : null;
        if (!userServiceId) {
            info(`[${reqId}] verifyWorkerServiceAccess - user has no service assigned`);
            res.status(403).json({ error: 'Forbidden: No service assigned to user', code: 'AUTH_SERVICE' });
            return;
        }

        if (req.method === 'POST') {
            // Worker creation may include id_sys or id_machine; prefer id_sys
            const bodySys = req.body?.id_sys ? Number(req.body.id_sys) : null;
            const bodyMachine = req.body?.id_machine ? Number(req.body.id_machine) : null;
            let sys = null;
            if (bodySys) sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: bodySys, deleted: false } });
            else if (bodyMachine) sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_machine_sys: bodyMachine, deleted: false } });

            const sysService = sys?.id_service_sys ? Number(sys.id_service_sys) : null;
            if (sysService && sysService === userServiceId) return next();
            info(`[${reqId}] verifyWorkerServiceAccess - POST denied - sysService=${sysService} userService=${userServiceId}`);
            res.status(403).json({ error: 'Forbidden: cannot create worker for this service', code: 'AUTH_SERVICE' });
            return;
        }

        // For PUT/DELETE, locate worker then determine its system or machine and check service
    const id = req.params.id;
    const worker = await prismaPSQL.dIM_WORKER.findFirst({ where: { id_worker: parseInt(id), deleted: false } });
        if (!worker) { res.status(404).json({ error: 'Worker not found', code: 'NOT_FOUND' }); return; }
        let sys = null;
        if (worker.id_sys) sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: worker.id_sys, deleted: false } });
        else if (worker.id_machine) sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_machine_sys: worker.id_machine, deleted: false } });
        const sysService = sys?.id_service_sys ? Number(sys.id_service_sys) : null;
        if (sysService === userServiceId) return next();
        info(`[${reqId}] verifyWorkerServiceAccess - PUT/DELETE denied - sysService=${sysService} userService=${userServiceId}`);
        res.status(403).json({ error: 'Forbidden: cannot modify/delete worker for this service', code: 'AUTH_SERVICE' });
    } catch (error) {
        logError('verifyWorkerServiceAccess - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
    }
}
