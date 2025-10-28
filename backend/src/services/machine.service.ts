import { prismaPSQL } from "../prisma/client_psql";

// Machines
export const getAllMachines = async () => {
  return await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
};

export const getMachineById = async (id: any) => {
  const m = await prismaPSQL.dIM_MACHINE.findFirst({ where: { id_machine: id, deleted: false } });
  if (!m) throw new Error("Machine not found");
  return m;
};

export const createMachine = async (data: any, userId: any) => {
  const created = await prismaPSQL.dIM_MACHINE.create({
    data: {
      name_machine: data.name_machine,
      id_type_machine: data.id_type_machine,
      os_machine: data.os_machine,
      version_machine: data.version_machine,
      description_machine: data.description_machine,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateMachine = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.dIM_MACHINE.update({
    where: { id_machine: id },
    data: {
      name_machine: data.name_machine,
      id_type_machine: data.id_type_machine,
      os_machine: data.os_machine,
      version_machine: data.version_machine,
      description_machine: data.description_machine,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteMachineById = async (id: any, userId: any) => {
  const m = await prismaPSQL.dIM_MACHINE.findFirst({ where: { id_machine: id, deleted: false } });
  if (!m) throw new Error("Machine not found or already deleted");
  await prismaPSQL.dIM_MACHINE.update({ where: { id_machine: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return m;
};

// Referential for machine types
export const getAllRefMachines = async () => {
  return await prismaPSQL.rEF_TYPE_MACHINE.findMany({ where: { deleted: false } });
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
