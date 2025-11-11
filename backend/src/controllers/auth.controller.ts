import { Request, Response } from "express";
import { registerUser, authenticateUser } from "../services/auth.service";
import jwt, { JwtPayload } from "jsonwebtoken";
import { info, error as logError } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const register = async (req: Request, res: Response) => {
    try {
        info('auth.register - start', { params: req.params, body: req.body, user: req.user?.id });
        const response = await registerUser(req.body);
        info('auth.register - user registered', { id: (response as any)?.id_user });
        res.status(201).json(convertBigIntToString(response));
    } catch (error) {
        logError('auth.register - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        info('auth.login - start', { params: req.params, body: req.body });
        let response = await authenticateUser(req.body);
        response = convertBigIntToString(response);

        const isProduction = process.env.NODE_ENV === 'prod';
        
        // Place token in cookies
        res.cookie("token", response.token, {
            maxAge: 3600000,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        // Add user ID to cookie
        res.cookie("userId", response.id_user, {
            maxAge: 3600000,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        // Add user role to cookie
        res.cookie("role", response.role, {
            maxAge: 3600000,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        });
        info('auth.login - cookies set', { id_user: response.id_user, role: response.role });
        res.status(201).json(response);
    } catch (error) {
        logError('auth.login - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
        res.status(400).json({ error: (error as any)?.message || 'Authentication failed' });
    }
};


export const logout = async (req: Request, res: Response) => {
    try {
        info('auth.logout - start', { user: req.user?.id });
        // Delete cookie
        res.clearCookie('token');
        res.clearCookie('userId');
        res.clearCookie('role');
        
        // Indicate successful logout
        info('auth.logout - success', { user: req.user?.id });
        res.status(200).json({ message: "Successfully logged out" });
    } catch (error) {
        logError('auth.logout - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const oldToken = req.cookies.token;
        
        if (!oldToken) {
            res.status(401).json({ error: 'No token provided' });
        }

        try {
            // Verify the old token
            const decoded = jwt.verify(oldToken, JWT_SECRET) as JwtPayload;
            
            // Generate new token
            const newToken = jwt.sign(
                { id: decoded.id, role: decoded.role },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Set the new token in cookies
            const isProduction = process.env.NODE_ENV === 'prod';
            res.cookie("token", newToken, {
                maxAge: 3600000,
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax"
            });

            info('auth.refreshToken - success', { id: decoded.id });
            res.status(200).json({
                message: "Token refreshed successfully",
                token: newToken
            });
        } catch (error) {
            logError('auth.refreshToken - invalid token', { error: (error as any)?.message || error });
            res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        logError('auth.refreshToken - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: 'Internal server error' });
    }
};

