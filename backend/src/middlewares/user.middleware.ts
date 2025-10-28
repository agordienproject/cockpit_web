import { config } from "dotenv";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from 'jsonwebtoken';

config();

// Verify user role
export const verifyRole = (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user.role;
    try {
        // If user is not technical or commercial, block access
        if (role !== "admin" && role !== "chief") {
            console.log("Access denied: unauthorized role!");
            res.status(403).json({ error: "Forbidden: Bad Role" }); // ✅ Added "return" to stop execution
            return;
        }
        next();
    } catch (error) {
        res.status(403).json({ error: "Forbidden: Bad Role" });
    }
}

// Verify user ID against request parameter
export const verifyUserId = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const role = req.user.role;
        console.log("User role: ", role);
        if (role !== "admin" && role !== "chief") {
            console.log("User is not an admin")
            const userId = req.user.id;
            const paramId = req.params.id;
            // If user ID doesn't match request parameter, block access
            if (userId !== paramId) {
                console.log("Access denied: unauthorized user ID!");
                res.status(403).json({ error: "Forbidden: Bad User ID" });
                return;
            }
            else {
                next();
            }
        }
        else {
            next();
        }
    } catch (error) {
        res.status(403).json({ error: "Forbidden: Bad User ID" });
    }
}
