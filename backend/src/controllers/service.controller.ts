import { Request, Response } from "express";
import * as serviceService from "../services/service.service";
import { info, error as logError } from "../utils/logger";

const convertBigIntToString = (obj: any) => JSON.parse(JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? value.toString() : value));

export const getAllServicesInfos = async (_req: Request, res: Response) => {
  try {
    info('service.getAllServicesInfos - start');
    const resp = await serviceService.getAllServices();
    info('service.getAllServicesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.getAllServicesInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const getServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    info('service.getServiceInfos - start', { id });
    const resp = await serviceService.getServiceById(id);
    if (!resp) {
      info('service.getServiceInfos - not found', { id });
      return res.status(404).json({ error: 'Service not found' });
    }
    info('service.getServiceInfos - success', { id });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.getServiceInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const createServiceInfos = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    info('service.createServiceInfos - start', { body: data, user: req.user?.id });
    const user_id = req.user?.id;
    const resp = await serviceService.createService(data, user_id);
    info('service.createServiceInfos - success', { id: (resp as any)?.id_service });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.createServiceInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const updateServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body;
    info('service.updateServiceInfos - start', { id, body: data, user: req.user?.id });
    const user_id = req.user?.id;
    const resp = await serviceService.updateService(id, data, user_id);
    info('service.updateServiceInfos - success', { id });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.updateServiceInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const deleteServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user?.id;
    await serviceService.deleteServiceById(id, user_id);
    info('service.deleteServiceInfos - success', { id, user: user_id });
    res.status(200).json({ message: 'Service deleted' });
  } catch (error: any) {
    logError('service.deleteServiceInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const getAllDisabledServicesInfos = async (_req: Request, res: Response) => {
  try {
    info('service.getAllDisabledServicesInfos - start');
    const resp = await serviceService.getAllDisabledServices();
    info('service.getAllDisabledServicesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.getAllDisabledServicesInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export const activateServiceInfos = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user?.id;
    info('service.activateServiceInfos - start', { id, user: user_id });
    const resp = await serviceService.activateServiceById(id, user_id);
    info('service.activateServiceInfos - success', { id });
    res.status(200).json(convertBigIntToString(resp));
  } catch (error: any) {
    logError('service.activateServiceInfos - error', { error: error?.message || error });
    res.status(500).json({ error: error.message });
  }
};

export default {};
