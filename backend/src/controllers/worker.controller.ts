import * as workerService from "../services/worker.service";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllWorkersInfos = async (req: any, res: any) => {
  try {
    const data = await workerService.getAllWorkers();
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getWorkerInfos = async (req: any, res: any) => {
  try {
    const data = await workerService.getWorkerById(req.params.id);
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    return res.status(404).json({ message: err.message });
  }
};

export const createWorkerInfos = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id_user;
    const data = await workerService.createWorker(req.body, userId);
    return res.status(201).json(convertBigIntToString(data));
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateWorkerInfos = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id_user;
    const data = await workerService.updateWorker(req.params.id, req.body, userId);
    return res.status(200).json(convertBigIntToString(data));
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const deleteWorkerInfos = async (req: any, res: any) => {
  try {
    const userId = (req as any).user?.id_user;
    const data = await workerService.deleteWorkerById(req.params.id, userId);
    return res.status(200).json({ message: "deleted", data: convertBigIntToString(data) });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export default {};
