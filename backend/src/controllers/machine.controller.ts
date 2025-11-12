import { Request, Response } from "express";
import * as machineService from "../services/machine.service";
import { info, error as logError } from "../utils/logger";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllMachinesInfos = async (req: Request, res: Response) => {
    try {
        info('machine.getAllMachinesInfos - start', { user: req.user?.id });
        const resp = await machineService.getAllMachines();
        info('machine.getAllMachinesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getAllMachinesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('machine.getMachineInfos - start', { id, user: req.user?.id });
        const resp = await machineService.getMachineById(id);
        info('machine.getMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getMachineInfos - error', { error: error?.message || error });
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
        info('machine.createMachineInfos - start', { body: data, user: user_id });
        const resp = await machineService.createMachine(data, user_id);
        info('machine.createMachineInfos - success', { id: (resp as any)?.id_machine });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.createMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.updateMachineInfos - start', { id, body: data, user: user_id });
        const resp = await machineService.updateMachine(id, data, user_id);
        info('machine.updateMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.updateMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('machine.deleteMachineInfos - start', { id, user: user_id });
        const resp = await machineService.deleteMachineById(id, user_id);
        info('machine.deleteMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.deleteMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

// Referential endpoints
export const getAllRefMachinesInfos = async (req: Request, res: Response) => {
    try {
        const filters = req.query || {};
        info('machine.getAllRefMachinesInfos - start', { filters });
        const resp = await machineService.getAllRefMachines(filters as any);
        info('machine.getAllRefMachinesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getAllRefMachinesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('machine.getRefMachineInfos - start', { id });
        const resp = await machineService.getRefMachineById(id);
        info('machine.getRefMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getRefMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.createRefMachineInfos - start', { body: data, user: user_id });
        const resp = await machineService.createRefMachine(data, user_id);
        info('machine.createRefMachineInfos - success', { id: (resp as any)?.id_type_machine });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.createRefMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.updateRefMachineInfos - start', { id, body: data, user: user_id });
        const resp = await machineService.updateRefMachine(id, data, user_id);
        info('machine.updateRefMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.updateRefMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('machine.deleteRefMachineInfos - start', { id, user: user_id });
        const resp = await machineService.deleteRefMachine(id, user_id);
        info('machine.deleteRefMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.deleteRefMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getAllDisabledRefMachinesInfos = async (req: Request, res: Response) => {
    try {
        info('machine.getAllDisabledRefMachinesInfos - start');
        const resp = await machineService.getAllDisabledRefMachines();
        info('machine.getAllDisabledRefMachinesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getAllDisabledRefMachinesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const activateRefMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('machine.activateRefMachineInfos - start', { id, user: user_id });
        const resp = await machineService.activateRefMachineById(id, user_id);
        info('machine.activateRefMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.activateRefMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

