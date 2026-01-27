import { Request, Response } from "express";
import * as verifService from "../services/verif.service";
import { info, error as logError } from "../utils/logger";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllVerifInfos = async (req: Request, res: Response) => {
    try {
        info('verif.getAllVerifInfos - start', { user: req.user?.id });
        const resp = await verifService.getAllVerifs();
        info('verif.getAllVerifInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.getAllVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getAllCurrentVerifInfos = async (req: Request, res: Response) => {
    try {
        info('verif.getAllCurrentVerifInfos - start', { user: req.user?.id });
        const resp = await verifService.getLatestVerifPerSystem();
        info('verif.getAllCurrentVerifInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.getAllCurrentVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('verif.getVerifInfos - start', { id, user: req.user?.id });
        const resp = await verifService.getVerifById(id);
        info('verif.getVerifInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.getVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createVerifInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        info('verif.createVerifInfos - start', { body: data, user: req.user?.id });
        // If worker middleware attached a worker, auto-populate IDs from it when not provided
        const worker: any = (req as any).worker;
        if (worker) {
            if (!data.id_worker) data.id_worker = worker.id_worker;
            if (!data.id_sys) data.id_sys = worker.id_sys;
            if (!data.id_machine) data.id_machine = worker.id_machine;
        }
        const resp = await verifService.createVerif(data, req.user?.id);
        info('verif.createVerifInfos - success', { id: (resp as any)?.id_verif });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.createVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        info('verif.updateVerifInfos - start', { id, body: data, user: req.user?.id });
        const resp = await verifService.updateVerif(id, data, req.user?.id);
        info('verif.updateVerifInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.updateVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('verif.deleteVerifInfos - start', { id, user: req.user?.id });
        const resp = await verifService.deleteVerifById(id, req.user?.id);
        info('verif.deleteVerifInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.deleteVerifInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getVerifsBySystem = async (req: Request, res: Response) => {
    try {
        const systemId = req.params.systemId;
        const { startDate, endDate, status } = req.query;
        
        info('verif.getVerifsBySystem - start', { systemId, filters: { startDate, endDate, status }, user: req.user?.id });
        
        const filters: any = {};
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);
        if (status) filters.status = status as string;

        const resp = await verifService.getVerifsBySystemId(systemId, filters);
        info('verif.getVerifsBySystem - success', { systemId, count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('verif.getVerifsBySystem - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};
