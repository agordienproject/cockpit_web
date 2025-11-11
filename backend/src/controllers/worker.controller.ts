import * as workerService from "../services/worker.service";
import { info, error as logError } from "../utils/logger";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllWorkersInfos = async (req: any, res: any) => {
  try {
    info('worker.getAllWorkersInfos - start', { user: req.user?.id });
    const data = await workerService.getAllWorkers();
    info('worker.getAllWorkersInfos - success', { count: Array.isArray(data) ? data.length : undefined });
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    logError('worker.getAllWorkersInfos - error', { error: err?.message || err });
    return res.status(500).json({ message: err.message });
  }
};

export const getWorkerInfos = async (req: any, res: any) => {
  try {
    info('worker.getWorkerInfos - start', { id: req.params.id, user: req.user?.id });
    const data = await workerService.getWorkerById(req.params.id);
    info('worker.getWorkerInfos - success', { id: req.params.id });
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    logError('worker.getWorkerInfos - error', { error: err?.message || err });
    return res.status(404).json({ message: err.message });
  }
};

export const createWorkerInfos = async (req: any, res: any) => {
  try {
    info('worker.createWorkerInfos - start', { body: req.body, user: req.user?.id });
    const userId = (req as any).user?.id_user;
    const data = await workerService.createWorker(req.body, userId);
    info('worker.createWorkerInfos - success', { id: (data as any)?.id_worker });
    return res.status(201).json(convertBigIntToString(data));
  } catch (err: any) {
    logError('worker.createWorkerInfos - error', { error: err?.message || err });
    return res.status(400).json({ message: err.message });
  }
};

export const updateWorkerInfos = async (req: any, res: any) => {
  try {
    info('worker.updateWorkerInfos - start', { id: req.params.id, body: req.body, user: req.user?.id });
    const userId = (req as any).user?.id_user;
    const data = await workerService.updateWorker(req.params.id, req.body, userId);
    info('worker.updateWorkerInfos - success', { id: req.params.id });
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    logError('worker.updateWorkerInfos - error', { error: err?.message || err });
    return res.status(400).json({ message: err.message });
  }
};

export const deleteWorkerInfos = async (req: any, res: any) => {
  try {
    info('worker.deleteWorkerInfos - start', { id: req.params.id, user: req.user?.id });
    const userId = (req as any).user?.id_user;
    const data = await workerService.deleteWorkerById(req.params.id, userId);
    info('worker.deleteWorkerInfos - success', { id: req.params.id });
    return res.status(200).json({ message: "deleted", data: convertBigIntToString(data) });
  } catch (err: any) {
    logError('worker.deleteWorkerInfos - error', { error: err?.message || err });
    return res.status(400).json({ message: err.message });
  }
};

export default {};
