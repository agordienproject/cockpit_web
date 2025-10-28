import { prismaPSQL } from "../prisma/client_psql";
import { fixInspectionIdSequence } from "../utils/db-fixes";



// ------------------- Utils functions ------------------- //

// Function to get user id by inspection id
export const getUserIdByInspectionId = async (id: any) => {
    const inspection = await prismaPSQL.fCT_INSPECTION.findFirst({
        where: { id_inspection: id },
    });
    return inspection.user_creation;
}

// ------------------- Inspection functions ------------------- //

// Function to create inspection
export const createInspectionInfos = async (data: any, user_id: any) => {
    console.log("User id: ", user_id);
    try {
        const inspection = await prismaPSQL.fCT_INSPECTION.create({
            data: {
                name_piece: data.name_piece,
                ref_piece: data.ref_piece,
                name_program: data.name_program,
                state: data.state,
                dents: data.dents,
                corrosions: data.corrosions,
                scratches: data.scratches,
                details: data.details,
                inspection_date: data.inspection_date,
                inspection_path: data.inspection_path,
                inspection_status: 'PENDING',
                user_validation: null,
                validation_date: null,
                creation_date: new Date(),
                user_creation: parseInt(user_id),
                modification_date: new Date(),
                user_modification: parseInt(user_id),
            },
        });
        return inspection;
    } catch (createError: any) {
        // If we get a unique constraint error on id_inspection, try to fix the sequence and retry
        if (createError.code === 'P2002' && createError.meta?.target?.includes('id_inspection')) {
            console.log("Attempting to fix inspection ID sequence...");
            await fixInspectionIdSequence();
            // Retry the creation
            const inspection = await prismaPSQL.fCT_INSPECTION.create({
                data: {
                    name_piece: data.name_piece,
                    ref_piece: data.ref_piece,
                    name_program: data.name_program,
                    state: data.state,
                    dents: data.dents,
                    corrosions: data.corrosions,
                    scratches: data.scratches,
                    details: data.details,
                    inspection_date: data.inspection_date,
                    inspection_path: data.inspection_path,
                    inspection_status: 'PENDING',
                    user_validation: null,
                    validation_date: null,
                    creation_date: new Date(),
                    user_creation: parseInt(user_id),
                    modification_date: new Date(),
                    user_modification: parseInt(user_id),
                },
            });
            return inspection;
        }
        throw createError;
    }
}

// Function to get all inspections
export const getAllInspections = async () => {
    const inspections = await prismaPSQL.fCT_INSPECTION.findMany({
        where: {
            deleted: false
        }
    });
    return inspections;
}

// Function to get inspection by id
export const getInspectionById = async (id: any) => {
    const inspection = await prismaPSQL.fCT_INSPECTION.findFirst({
        where: { id_inspection: id, deleted: false },
    });
    return inspection;
}

// Function to update inspection by id
export const updateInspectionById = async (id: any, data: any, user_id: any) => {
    const inspection = await prismaPSQL.fCT_INSPECTION.update({
        where: { id_inspection: id, deleted: false },
        data: {
            name_piece: data.name_piece,
            ref_piece: data.ref_piece,
            name_program: data.name_program,
            state: data.state,
            dents: data.dents,
            corrosions: data.corrosions,
            scratches: data.scratches,
            details: data.details,
            inspection_date: data.inspection_date,
            inspection_path: data.inspection_path,
            modification_date: new Date(),
            user_modification: parseInt(user_id),
        },
    });
    return inspection;
}

// Function to update inspection status by id
export const updateInspectionStatus = async (id: any, status: 'PENDING' | 'VALIDATED' | 'REJECTED', user_id: any) => {
    const updateData: any = {
        inspection_status: status,
        modification_date: new Date(),
        user_modification: parseInt(user_id),
    };
    if (status === 'VALIDATED') {
        updateData.user_validation = parseInt(user_id);
        updateData.validation_date = new Date();
    } else if (status === 'REJECTED') {
        updateData.user_validation = parseInt(user_id);
        updateData.validation_date = new Date();
    } else if (status === 'PENDING') {
        updateData.user_validation = null;
        updateData.validation_date = null;
    }
    const inspection = await prismaPSQL.fCT_INSPECTION.update({
        where: { id_inspection: id, deleted: false },
        data: updateData,
    });
    return inspection;
}

// Function to delete inspection by id
export const deleteInspectionById = async (id: any, user_id: any) => {
    const inspection = await prismaPSQL.fCT_INSPECTION.update({
        where: { id_inspection: id, deleted: false },
        data: {
            deleted: true,
            modification_date: new Date(),
            user_modification: parseInt(user_id),
        },
    });
    return inspection;
}

// Function to create historical data for a piece
export const createHistoricalData = async (ref_piece: any, data: any, userId: any) => {
    try {
        // Check if piece exists in historical table
        const existingPiece = await prismaPSQL.dIM_PIECE.findFirst({
            where: {
                ref_piece: ref_piece,
                TOP_CURRENT: 1
            }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for comparison
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (existingPiece) {
            // Convert existing piece start_date to Date object for comparison
            const existingStartDate = new Date(existingPiece.start_date);
            existingStartDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

            // If the piece was created today, just update it
            if (existingStartDate.getTime() === today.getTime()) {
                const updatedPiece = await prismaPSQL.dIM_PIECE.update({
                    where: { id_piece: existingPiece.id_piece },
                    data: {
                        name_piece: data.name_piece,
                        state: data.state,
                        name_program: data.name_program,
                        dents: data.dents,
                        corrosions: data.corrosions,
                        scratches: data.scratches,
                        details: data.details,
                        id_inspection: parseInt(data.id_inspection),
                        inspection_date: data.inspection_date,
                        inspection_path: data.inspection_path,
                        inspection_status: data.inspection_status,
                        user_validation: data.user_validation,
                        validation_date: data.validation_date,
                        modification_date: new Date(),
                        user_modification: parseInt(userId)
                    }
                });
                return updatedPiece;
            } else {
                // If it's not from today, create new historical record
                await prismaPSQL.dIM_PIECE.update({
                    where: { id_piece: existingPiece.id_piece },
                    data: {
                        end_date: yesterday.toISOString().split('T')[0],
                        TOP_CURRENT: 0,
                    }
                });
            }
        }

        // Create new current piece record if either:
        // 1. No existing piece was found
        // 2. Existing piece was from a different day
        const newPiece = await prismaPSQL.dIM_PIECE.create({
            data: {
                ref_piece: ref_piece,
                start_date: new Date().toISOString().split('T')[0],
                end_date: "2199-12-31",
                name_piece: data.name_piece,
                state: data.state,
                name_program: data.name_program,
                dents: data.dents,
                corrosions: data.corrosions,
                scratches: data.scratches,
                details: data.details,
                id_inspection: parseInt(data.id_inspection),
                inspection_date: data.inspection_date,
                inspection_path: data.inspection_path,
                inspection_status: data.inspection_status,
                user_validation: data.user_validation,
                validation_date: data.validation_date,
                creation_date: new Date(),
                user_creation: parseInt(userId),
                modification_date: new Date(),
                user_modification: parseInt(userId),
                TOP_CURRENT: 1
            }
        });

        return newPiece;
    } catch (error) {
        console.error("Error creating historical data:", error);
        throw error;
    }
}

// Function to get the most recent inspections
export const getRecentInspections = async (limit = 10) => {
    const inspections = await prismaPSQL.fCT_INSPECTION.findMany({
        where: { deleted: false },
        orderBy: { creation_date: 'desc' },
        take: limit
    });
    return inspections;
}



