import { Request, Response } from "express";
import * as systemService from "../services/system.service";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllSystemsInfos = async (req: Request, res: Response) => {
    try {
        const resp = await systemService.getAllSystems();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await systemService.getSystemById(id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createSystemInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await systemService.createSystem(data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await systemService.updateSystem(id, data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        const resp = await systemService.deleteSystemById(id, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Referential endpoints
export const getAllRefSystemsInfos = async (req: Request, res: Response) => {
    try {
        const resp = await systemService.getAllRefSystems();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await systemService.getRefSystemById(id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await systemService.createRefSystem(data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await systemService.updateRefSystem(id, data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefSystemInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        const resp = await systemService.deleteRefSystem(id, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
