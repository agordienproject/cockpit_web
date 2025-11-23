import { prismaPSQL } from "../prisma/client_psql";

// Machines
export const getAllMachines = async () => {
  const rows: any[] = await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
  const osIds = [...new Set(rows.map(r => (r as any).id_os_machine).filter(Boolean))];
  const osMap: Record<string, string> = {};
  if (osIds.length) {
    const osRefs: any[] = await prismaPSQL.rEF_OS_MACHINE.findMany({ where: { id_os_machine: { in: osIds as any }, deleted: false } as any });
    osRefs.forEach(ref => { osMap[String(ref.id_os_machine)] = ref.name_os_machine || ''; });
  }
  return rows.map(r => {
    const idOs = (r as any).id_os_machine;
    return { ...r, os_machine: idOs ? osMap[String(idOs)] : undefined };
  });
};

export const getMachineById = async (id: any) => {
  const m = await prismaPSQL.dIM_MACHINE.findFirst({ where: { id_machine: id, deleted: false } });
  if (!m) throw new Error("Machine not found");
  let osName: string | undefined;
  const idOs: any = (m as any).id_os_machine;
  if (idOs) {
    const osRef: any = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: Number(idOs), deleted: false } as any });
    osName = osRef?.name_os_machine;
  }
  return { ...(m as any), os_machine: osName } as any;
};

export const createMachine = async (data: any, userId: any) => {
  // Parse referential IDs (empty string => undefined)
  const typeId = data.id_type_machine ? Number(data.id_type_machine) : undefined;
  const osId = data.id_os_machine ? Number(data.id_os_machine) : undefined;
  const created = await prismaPSQL.dIM_MACHINE.create({
    data: {
      name_machine: data.name_machine,
      id_type_machine: typeId,
      id_os_machine: osId,
      version_machine: data.version_machine,
      description_machine: data.description_machine,
      url_metrics_machine: data.url_metrics_machine,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
  // Enrich with virtual os_machine name
  let osName: string | undefined;
  const idOs: any = (created as any).id_os_machine;
  if (idOs) {
    const osRef: any = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: Number(idOs), deleted: false } as any });
    osName = osRef?.name_os_machine;
  }
  return { ...(created as any), os_machine: osName } as any;
};

export const updateMachine = async (id: any, data: any, userId: any) => {
  const typeId = data.id_type_machine ? Number(data.id_type_machine) : undefined;
  const osId = data.id_os_machine ? Number(data.id_os_machine) : undefined;
  const updated = await prismaPSQL.dIM_MACHINE.update({
    where: { id_machine: id },
    data: {
      name_machine: data.name_machine,
      id_type_machine: typeId,
      id_os_machine: osId,
      version_machine: data.version_machine,
      description_machine: data.description_machine,
      url_metrics_machine: data.url_metrics_machine,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
  let osName: string | undefined;
  const idOs: any = (updated as any).id_os_machine;
  if (idOs) {
    const osRef: any = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: Number(idOs), deleted: false } as any });
    osName = osRef?.name_os_machine;
  }
  return { ...(updated as any), os_machine: osName } as any;
};

export const deleteMachineById = async (id: any, userId: any) => {
  const m = await prismaPSQL.dIM_MACHINE.findFirst({ where: { id_machine: id, deleted: false } });
  if (!m) throw new Error("Machine not found or already deleted");
  await prismaPSQL.dIM_MACHINE.update({ where: { id_machine: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return m;
};

// Referential for machine types
export const getAllRefMachines = async (filters?: any) => {
  const where: any = {};
  // default: only active
  if (!filters || !filters.status) where.deleted = false;
  // if status explicitly provided
  if (filters && filters.status) {
    if (filters.status === 'deleted') where.deleted = true;
    else if (filters.status === 'active') where.deleted = false;
  }
  if (filters) {
    if (filters.id) where.id_type_machine = Number(filters.id);
    if (filters.name) where.name_type_machine = { contains: String(filters.name), mode: 'insensitive' } as any;
    if (filters.description) where.description_type_machine = { contains: String(filters.description), mode: 'insensitive' } as any;
  }
  return await prismaPSQL.rEF_TYPE_MACHINE.findMany({ where });
};

export const getRefMachineById = async (id: any) => {
  const r = await prismaPSQL.rEF_TYPE_MACHINE.findFirst({ where: { id_type_machine: id, deleted: false } });
  if (!r) throw new Error("Ref machine not found");
  return r;
};

export const createRefMachine = async (data: any, userId: any) => {
  const created = await prismaPSQL.rEF_TYPE_MACHINE.create({
    data: {
      name_type_machine: data.name_type_machine,
      description_type_machine: data.description_type_machine,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateRefMachine = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.rEF_TYPE_MACHINE.update({
    where: { id_type_machine: id },
    data: {
      name_type_machine: data.name_type_machine,
      description_type_machine: data.description_type_machine,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteRefMachine = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_TYPE_MACHINE.findFirst({ where: { id_type_machine: id, deleted: false } });
  if (!r) throw new Error("Ref machine not found or already deleted");
  await prismaPSQL.rEF_TYPE_MACHINE.update({ where: { id_type_machine: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return r;
};

// Export all disabled machine referential entries
export const getAllDisabledRefMachines = async () => {
  return await prismaPSQL.rEF_TYPE_MACHINE.findMany({ where: { deleted: true } });
};

// Reactivate a disabled machine referential entry
export const activateRefMachineById = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_TYPE_MACHINE.findFirst({ where: { id_type_machine: id, deleted: true } });
  if (!r) throw new Error('Ref machine not found or not deleted');
  const updated = await prismaPSQL.rEF_TYPE_MACHINE.update({ where: { id_type_machine: id }, data: { deleted: false, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return updated;
};

// Referential for OS (REF_OS_MACHINE)
export const getAllRefOs = async (filters?: any) => {
  const where: any = {};
  if (!filters || !filters.status) where.deleted = false;
  if (filters && filters.status) {
    if (filters.status === 'deleted') where.deleted = true;
    else if (filters.status === 'active') where.deleted = false;
  }
  if (filters) {
    if (filters.id) where.id_os_machine = Number(filters.id);
    if (filters.name) where.name_os_machine = { contains: String(filters.name), mode: 'insensitive' } as any;
    if (filters.description) where.description_os_machine = { contains: String(filters.description), mode: 'insensitive' } as any;
  }
  return await prismaPSQL.rEF_OS_MACHINE.findMany({ where });
};

export const getRefOsById = async (id: any) => {
  const r = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: id, deleted: false } });
  if (!r) throw new Error('Ref OS not found');
  return r;
};

export const createRefOs = async (data: any, userId: any) => {
  const created = await prismaPSQL.rEF_OS_MACHINE.create({
    data: {
      name_os_machine: data.name_os_machine,
      description_os_machine: data.description_os_machine,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateRefOs = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.rEF_OS_MACHINE.update({
    where: { id_os_machine: id },
    data: {
      name_os_machine: data.name_os_machine,
      description_os_machine: data.description_os_machine,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteRefOs = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: id, deleted: false } });
  if (!r) throw new Error('Ref OS not found or already deleted');
  await prismaPSQL.rEF_OS_MACHINE.update({ where: { id_os_machine: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return r;
};

export const getAllDisabledRefOs = async () => {
  return await prismaPSQL.rEF_OS_MACHINE.findMany({ where: { deleted: true } });
};

export const activateRefOsById = async (id: any, userId: any) => {
  const r = await prismaPSQL.rEF_OS_MACHINE.findFirst({ where: { id_os_machine: id, deleted: true } });
  if (!r) throw new Error('Ref OS not found or not deleted');
  const updated = await prismaPSQL.rEF_OS_MACHINE.update({ where: { id_os_machine: id }, data: { deleted: false, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return updated;
};
