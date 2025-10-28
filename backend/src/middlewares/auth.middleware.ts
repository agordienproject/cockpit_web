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
    console.log("Entering verifyToken function");
    const token = req.cookies.token;
    console.log("Token: ", token);
    if (!token) {
        console.log("Token not found");
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }
    console.log("Verifying token");

    try {
        console.log("Decoding token");
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("Valid token");
        next();
    } catch (error) {
        console.log("Invalid token");
        res.status(400).json({ error: 'Invalid token.' });
    }
};