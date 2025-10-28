import { prismaPSQL } from "../prisma/client_psql";
import crypto from "crypto";

export const getAllWorkers = async () => {
  return await prismaPSQL.dIM_WORKER.findMany({ where: { deleted: false } });
};

export const getWorkerById = async (id: any) => {
  const w = await prismaPSQL.dIM_WORKER.findFirst({ where: { id_worker: id, deleted: false } });
  if (!w) throw new Error("Worker not found");
  return w;
};

export const createWorker = async (data: any, userId: any) => {
  // verify system and machine exist
  if (data.id_sys) {
    const sys = await prismaPSQL.dIM_SYSTEM.findFirst({ where: { id_sys: data.id_sys, deleted: false } });
    if (!sys) throw new Error("System not found");
  }
  if (data.id_machine) {
    const mach = await prismaPSQL.dIM_MACHINE.findFirst({ where: { id_machine: data.id_machine, deleted: false } });
    if (!mach) throw new Error("Machine not found");
  }

  // generate credentials if not provided
  const creds = data.creds_worker || crypto.randomBytes(16).toString("hex");

  const created = await prismaPSQL.dIM_WORKER.create({
    data: {
      name_worker: data.name_worker,
      id_sys: data.id_sys,
      id_machine: data.id_machine,
      description_worker: data.description_worker,
      creds_worker: creds,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return created;
};

export const updateWorker = async (id: any, data: any, userId: any) => {
  const updated = await prismaPSQL.dIM_WORKER.update({
    where: { id_worker: id },
    data: {
      name_worker: data.name_worker,
      id_sys: data.id_sys,
      id_machine: data.id_machine,
      description_worker: data.description_worker,
      creds_worker: data.creds_worker,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    },
  });
  return updated;
};

export const deleteWorkerById = async (id: any, userId: any) => {
  const w = await prismaPSQL.dIM_WORKER.findFirst({ where: { id_worker: id, deleted: false } });
  if (!w) throw new Error("Worker not found or already deleted");
  await prismaPSQL.dIM_WORKER.update({ where: { id_worker: id }, data: { deleted: true, modification_date: new Date(), user_modification: userId ? parseInt(userId) : undefined } });
  return w;
};

export const findWorkerByCredsForMachineAndSystem = async (creds: string, id_machine: any, id_sys: any) => {
  const where: any = { deleted: false, creds_worker: creds };
  if (id_machine) where.id_machine = id_machine;
  if (id_sys) where.id_sys = id_sys;
  const w = await prismaPSQL.dIM_WORKER.findFirst({ where });
  return w || null;
};

export default {};
