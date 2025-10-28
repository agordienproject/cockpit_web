import { config } from "dotenv";
import { Request, Response, NextFunction } from "express";
import { getUserIdByInspectionId } from "../services/inspection.service";

config();

// Verify user is in inspection
export const verifyUserInInspection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const role = req.user.role;
        console.log("User role: ", role);
        if (role == "admin" || role == "chief") {
            console.log("User is an admin or chief")
            next();
        }
        else {
            const userId = parseInt(req.user.id);
            const paramId = parseInt(req.params.id);
            // If user ID doesn't match request parameter, block access
            const userIdInInspection = await getUserIdByInspectionId(paramId);
            if (userId !== userIdInInspection) {
                console.log("Access denied: unauthorized user ID!");
                res.status(403).json({ error: "Forbidden: Bad User ID" });
                return;
            }
            else {
                next();
            }
        }
    } catch (error) {
        console.error("Error in verification:", error);
        res.status(403).json({ error: "Forbidden: Bad User ID" });
    }
}

