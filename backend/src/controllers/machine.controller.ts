import { Request, Response } from "express";
import * as machineService from "../services/machine.service";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllMachinesInfos = async (req: Request, res: Response) => {
    try {
        const resp = await machineService.getAllMachines();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await machineService.getMachineById(id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const testMachine = async (req: Request, res: Response) => {
    // Placeholder: In future this can ping machine metrics or run checks
    res.status(200).json({ message: "Test endpoint - machine connectivity not implemented" });
};

export const createMachineInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await machineService.createMachine(data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await machineService.updateMachine(id, data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        const resp = await machineService.deleteMachineById(id, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Referential endpoints
export const getAllRefMachinesInfos = async (req: Request, res: Response) => {
    try {
        const resp = await machineService.getAllRefMachines();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await machineService.getRefMachineById(id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await machineService.createRefMachine(data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        const resp = await machineService.updateRefMachine(id, data, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        const resp = await machineService.deleteRefMachine(id, user_id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
