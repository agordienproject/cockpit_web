import { Request, Response } from "express";
import * as serviceService from "../services/service.service";

const convertBigIntToString = (obj: any) => JSON.parse(JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? value.toString() : value));

export const getAllServicesInfos = async (_req: Request, res: Response) => {
  try {
    const resp = await serviceService.getAllServices();
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const resp = await serviceService.getServiceById(id);
    if (!resp) return res.status(404).json({ error: 'Service not found' });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createServiceInfos = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const user_id = req.user?.id;
    const resp = await serviceService.createService(data, user_id);
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const user_id = req.user?.id;
    const resp = await serviceService.updateService(id, data, user_id);
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user?.id;
    await serviceService.deleteServiceById(id, user_id);
    res.status(200).json({ message: 'Service deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default {};
