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
  const created = await prismaPSQL.fCT_VERIF_SYSTEM.create({
    data: {
      id_worker: data.id_worker,
      id_sys: data.id_sys,
      id_machine: data.id_machine,
      status: data.status,
      details: data.details,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateVerif = async (id: any, data: any, userId: any) => {
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
