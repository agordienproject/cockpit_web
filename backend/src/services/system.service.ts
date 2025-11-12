import { prismaPSQL } from "../prisma/client_psql";

// Systems
export const getAllSystems = async () => {
  return await prismaPSQL.dIM_SYSTEM.findMany({ where: { deleted: false } });
};

export const getSystemById = async (id: any) => {
  const r = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: id, deleted: false } });
  if (!r) throw new Error("System not found");
  return r;
};

export const createSystem = async (data: any, userId: any) => {
  const created = await prismaPSQL.dIM_SYSTEM.create({
    data: {
      name_sys: data.name_sys,
      version_sys: data.version_sys,
      id_type_sys: data.id_type_sys,
      description_sys: data.description_sys,
      id_service_sys: data.id_service_sys,
      id_machine_sys: data.id_machine_sys,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateSystem = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.dIM_SYSTEM.update({
    where: { id_sys: id },
    data: {
      name_sys: data.name_sys,
      version_sys: data.version_sys,
      id_type_sys: data.id_type_sys,
      description_sys: data.description_sys,
      id_service_sys: data.id_service_sys,
      id_machine_sys: data.id_machine_sys,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteSystemById = async (id: any, userId: any) => {
  const r = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: id, deleted: false } });
  if (!r) throw new Error("System not found or already deleted");
  await prismaPSQL.dIM_SYSTEM.update({ where: { id_sys: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return r;
};

// Referential for system types (DIM_TYPE_SYSTEM)

// Export all enabled systems referential
export const getAllRefSystems = async (filters?: any) => {
  const where: any = {};
  if (!filters || !filters.status) where.deleted = false;
  if (filters && filters.status) {
    if (filters.status === 'deleted') where.deleted = true;
    else if (filters.status === 'active') where.deleted = false;
  }
  if (filters) {
    if (filters.id) where.id_type_sys = Number(filters.id);
    if (filters.name) where.name_type_sys = { contains: String(filters.name), mode: 'insensitive' } as any;
    if (filters.description) where.description_type_sys = { contains: String(filters.description), mode: 'insensitive' } as any;
  }
  return await prismaPSQL.rEF_TYPE_SYSTEM.findMany({ where });
};

// Export all disabled systems referential
export const getAllDisabledRefSystems = async () => {
  return await prismaPSQL.rEF_TYPE_SYSTEM.findMany({ where: { deleted: true } });
};

export const getRefSystemById = async (id: any) => {
  const r = await prismaPSQL.rEF_TYPE_SYSTEM.findFirst({ where: { id_type_sys: id, deleted: false } });
  if (!r) throw new Error("Ref system not found");
  return r;
};

export const createRefSystem = async (data: any, userId: any) => {
  const created = await prismaPSQL.rEF_TYPE_SYSTEM.create({
    data: {
      name_type_sys: data.name_type_sys,
      description_type_sys: data.description_type_sys,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateRefSystem = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.rEF_TYPE_SYSTEM.update({
    where: { id_type_sys: id },
    data: {
      name_type_sys: data.name_type_sys,
      description_type_sys: data.description_type_sys,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteRefSystem = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_TYPE_SYSTEM.findFirst({ where: { id_type_sys: id, deleted: false } });
  if (!r) throw new Error("Ref system not found or already deleted");
  await prismaPSQL.rEF_TYPE_SYSTEM.update({ where: { id_type_sys: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return r;
};

// Reactivate a disabled system referential entry
export const activateRefSystemById = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_TYPE_SYSTEM.findFirst({ where: { id_type_sys: id, deleted: true } });
  if (!r) throw new Error('Ref system not found or not deleted');
  const updated = await prismaPSQL.rEF_TYPE_SYSTEM.update({ where: { id_type_sys: id }, data: { deleted: false, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return updated;
};
