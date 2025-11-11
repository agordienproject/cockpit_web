import { Request, Response } from "express";
import * as systemService from "../services/system.service";
import { info, error as logError } from "../utils/logger";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllSystemsInfos = async (req: Request, res: Response) => {
    try {
        info('system.getAllSystemsInfos - start', { user: req.user?.id });
        const resp = await systemService.getAllSystems();
        info('system.getAllSystemsInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.getAllSystemsInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('system.getSystemInfos - start', { id, user: req.user?.id });
        const resp = await systemService.getSystemById(id);
        info('system.getSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.getSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createSystemInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('system.createSystemInfos - start', { body: data, user: user_id });
        const resp = await systemService.createSystem(data, user_id);
        info('system.createSystemInfos - success', { id: (resp as any)?.id_sys });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.createSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('system.updateSystemInfos - start', { id, body: data, user: user_id });
        const resp = await systemService.updateSystem(id, data, user_id);
        info('system.updateSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.updateSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('system.deleteSystemInfos - start', { id, user: user_id });
        const resp = await systemService.deleteSystemById(id, user_id);
        info('system.deleteSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.deleteSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

// Referential endpoints
export const getAllRefSystemsInfos = async (req: Request, res: Response) => {
    try {
        info('system.getAllRefSystemsInfos - start');
        const resp = await systemService.getAllRefSystems();
        info('system.getAllRefSystemsInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.getAllRefSystemsInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('system.getRefSystemInfos - start', { id });
        const resp = await systemService.getRefSystemById(id);
        info('system.getRefSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.getRefSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('system.createRefSystemInfos - start', { body: data, user: user_id });
        const resp = await systemService.createRefSystem(data, user_id);
        info('system.createRefSystemInfos - success', { id: (resp as any)?.id_type_sys });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.createRefSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('system.updateRefSystemInfos - start', { id, body: data, user: user_id });
        const resp = await systemService.updateRefSystem(id, data, user_id);
        info('system.updateRefSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.updateRefSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('system.deleteRefSystemInfos - start', { id, user: user_id });
        const resp = await systemService.deleteRefSystem(id, user_id);
        info('system.deleteRefSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.deleteRefSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getAllDisabledRefSystemsInfos = async (req: Request, res: Response) => {
    try {
        info('system.getAllDisabledRefSystemsInfos - start');
        const resp = await systemService.getAllDisabledRefSystems();
        info('system.getAllDisabledRefSystemsInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.getAllDisabledRefSystemsInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const activateRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('system.activateRefSystemInfos - start', { id, user: user_id });
        const resp = await systemService.activateRefSystemById(id, user_id);
        info('system.activateRefSystemInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('system.activateRefSystemInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

