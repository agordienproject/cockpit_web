import { prismaPSQL } from "../prisma/client_psql";

// New dashboard service API

export const getAllMachines = async () => {
    return await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
};

export const getAllWorkers = async () => {
    return await prismaPSQL.dIM_WORKER.findMany({ where: { deleted: false } });
};

export const getRecentInspections = async (limit: number = 10) => {
    // inspections removed — no-op
    return [];
};

export const getPendingValidationsCount = async () => {
    // inspections removed — no pending validations
    return 0;
};

export const getDashboardOverview = async () => {
    const machines = await getAllMachines();
    const workers = await getAllWorkers();
    return {
        machinesCount: machines.length,
        machines,
        workersCount: workers.length,
        workers,
        // inspection-related data removed
    };
};

// Keep validation time distribution for compatibility (from previous implementation)
// validation/inspection time distribution removed