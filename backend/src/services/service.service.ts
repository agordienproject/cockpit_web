import { prismaPSQL } from "../prisma/client_psql";

export const getAllServices = async (filters?: any) => {
  const where: any = {};
  if (!filters || !filters.status) where.deleted = false;
  if (filters && filters.status) {
    if (filters.status === 'deleted') where.deleted = true;
    else if (filters.status === 'active') where.deleted = false;
  }
  if (filters) {
    if (filters.id) where.id_service = Number(filters.id);
    if (filters.name) where.name_service = { contains: String(filters.name), mode: 'insensitive' } as any;
    if (filters.description) where.description_service = { contains: String(filters.description), mode: 'insensitive' } as any;
  }
  return await prismaPSQL.rEF_SERVICE.findMany({ where });
};

export const getServiceById = async (id: any) => {
  const svc = await prismaPSQL.rEF_SERVICE.findFirst({ where: { id_service: id, deleted: false } });
  return svc || null;
};

export const createService = async (data: any, userId: any) => {
  const created = await prismaPSQL.rEF_SERVICE.create({
    data: {
      name_service: data.name_service,
      description_service: data.description_service,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateService = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.rEF_SERVICE.update({
    where: { id_service: id },
    data: {
      name_service: data.name_service,
      description_service: data.description_service,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteServiceById = async (id: any, userId: any) => {
  const svc = await prismaPSQL.rEF_SERVICE.findFirst({ where: { id_service: id, deleted: false } });
  if (!svc) throw new Error('Service not found or already deleted');
  await prismaPSQL.rEF_SERVICE.update({ where: { id_service: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return svc;
};

// Export all disabled services
export const getAllDisabledServices = async () => {
  return await prismaPSQL.rEF_SERVICE.findMany({ where: { deleted: true } });
};

// Reactivate a disabled service
export const activateServiceById = async (id: any, userId: any) => {
  const svc = await prismaPSQL.rEF_SERVICE.findFirst({ where: { id_service: id, deleted: true } });
  if (!svc) throw new Error('Service not found or not deleted');
  const updated = await prismaPSQL.rEF_SERVICE.update({ where: { id_service: id }, data: { deleted: false, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return updated;
};

export default {};
