import { prismaPSQL } from "../prisma/client_psql";

export const getAllVerifs = async () => {
  return await prismaPSQL.fCT_VERIF_SYSTEM.findMany({ where: { deleted: false } });
};

export const getVerifById = async (id: any) => {
  const v = await prismaPSQL.fCT_VERIF_SYSTEM.findFirst({ where: { id_verif: id, deleted: false } });
  if (!v) throw new Error("Verification not found");
  return v;
};

export const createVerif = async (data: any, userId: any) => {
  // If only creds_worker provided, attempt lookup of worker -> populate IDs
  if (!data.id_worker && data.creds_worker) {
    const worker = await prismaPSQL.dIM_WORKER.findFirst({ where: { creds_worker: data.creds_worker, deleted: false } });
    if (!worker) throw new Error("Worker not found for provided credentials");
    data.id_worker = worker.id_worker;
    data.id_sys = worker.id_sys;
    data.id_machine = worker.id_machine;
  }
  if (!data.id_worker || !data.id_sys || !data.id_machine) {
    throw new Error("Missing required IDs (worker/system/machine) to create verification");
  }
  // Validate status
  const allowedStatuses = ["OK", "WARN", "ERROR"];
  if (!data.status || !allowedStatuses.includes(String(data.status).toUpperCase())) {
    throw new Error("Invalid status. Allowed values: OK, WARN, ERROR");
  }
  data.status = String(data.status).toUpperCase();
  // Determine user id: use provided userId else default worker manager account
  let effectiveUserId: number | undefined = userId ? parseInt(userId) : undefined;
  if (!effectiveUserId) {
    const WORKER_MANAGER_EMAIL = process.env.WORKER_MANAGER_EMAIL || 'w.manager@nproximite.com';
    const manager = await prismaPSQL.dIM_USER.findFirst({ where: { email: WORKER_MANAGER_EMAIL, deleted: false } });
    if (manager) {
      effectiveUserId = Number(manager.id_user);
    } else {
      // If manager user not found, we proceed without assigning; could be logged if logger available.
    }
  }
  const created = await prismaPSQL.fCT_VERIF_SYSTEM.create({
    data: {
      id_worker: data.id_worker,
      id_sys: data.id_sys,
      id_machine: data.id_machine,
      status: data.status,
      details: data.details,
      creation_date: new Date(),
      user_creation: effectiveUserId,
      modification_date: new Date(),
      user_modification: effectiveUserId,
    },
  });
  return created;
};

export const updateVerif = async (id: any, data: any, userId: any) => {
  const allowedStatuses = ["OK", "WARN", "ERROR"];
  if (data.status && !allowedStatuses.includes(String(data.status).toUpperCase())) {
    throw new Error("Invalid status. Allowed values: OK, WARN, ERROR");
  }
  if (data.status) data.status = String(data.status).toUpperCase();
  const updated = await prismaPSQL.fCT_VERIF_SYSTEM.update({
    where: { id_verif: id },
    data: {
      id_worker: data.id_worker,
      id_sys: data.id_sys,
      id_machine: data.id_machine,
      status: data.status,
      details: data.details,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteVerifById = async (id: any, userId: any) => {
  const v = await prismaPSQL.fCT_VERIF_SYSTEM.findFirst({ where: { id_verif: id, deleted: false } });
  if (!v) throw new Error("Verification not found or already deleted");
  await prismaPSQL.fCT_VERIF_SYSTEM.update({ where: { id_verif: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return v;
};

// Return latest verification for each system (regardless of worker)
export const getLatestVerifPerSystem = async () => {
  // Fetch recent verifications ordered by creation_date desc (most recent first)
  const all = await prismaPSQL.fCT_VERIF_SYSTEM.findMany({ where: { deleted: false }, orderBy: [{ creation_date: 'desc' }, { id_verif: 'desc' }] });

  const map = new Map<string, any>();
  for (const v of all) {
    const key = v.id_sys ? String(v.id_sys) : "__null__";
    if (!map.has(key)) {
      map.set(key, v);
    }
  }

  return Array.from(map.values());
};

// Return all verifications for a specific system
export const getVerifsBySystemId = async (systemId: any, filters?: { startDate?: Date, endDate?: Date, status?: string }) => {
  const where: any = { 
    id_sys: BigInt(systemId), 
    deleted: false 
  };

  // Apply date filters if provided
  if (filters?.startDate || filters?.endDate) {
    where.creation_date = {};
    if (filters.startDate) where.creation_date.gte = filters.startDate;
    if (filters.endDate) where.creation_date.lte = filters.endDate;
  }

  // Apply status filter if provided
  if (filters?.status) {
    where.status = filters.status.toUpperCase();
  }

  return await prismaPSQL.fCT_VERIF_SYSTEM.findMany({ 
    where, 
    orderBy: [{ creation_date: 'asc' }, { id_verif: 'asc' }] 
  });
};
