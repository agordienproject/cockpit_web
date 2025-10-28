import { prismaPSQL } from "../prisma/client_psql";

export const fixUserIdSequence = async () => {
    try {
        // Get the maximum id_user from the table
        const result = await prismaPSQL.$queryRaw`
            SELECT setval('"DIM_USER_id_user_seq"', (SELECT MAX(id_user) FROM "DIM_USER"), true);
        `;
        console.log("User ID sequence has been reset successfully");
        return result;
    } catch (error) {
        console.error("Error fixing user ID sequence:", error);
        throw error;
    }
};

export const fixInspectionIdSequence = async () => {
    try {
        const result = await prismaPSQL.$queryRaw`
            SELECT setval('"FCT_INSPECTION_id_inspection_seq"', (SELECT MAX(id_inspection) FROM "FCT_INSPECTION"), true);
        `;
        console.log("Inspection ID sequence has been reset successfully");
        return result;
    } catch (error) {
        console.error("Error fixing inspection ID sequence:", error);
        throw error;
    }
};