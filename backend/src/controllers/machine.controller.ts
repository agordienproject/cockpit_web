import { Request, Response } from "express";
import * as machineService from "../services/machine.service";
import * as monitoringService from "../services/monitoring.service";
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
    try {
        const id = req.params.id;
        const m = await machineService.getMachineById(id);
        const url = String((m as any).url_metrics_machine || '').trim();
        if (!url) return res.status(400).json({ ok: false, error: 'No metrics URL on machine' });
        const probe = await monitoringService.testExporterUrl(url);
        return res.status(probe.ok ? 200 : 502).json(probe);
    } catch (error: any) {
        logError('machine.testMachine - error', { error: error?.message || error });
        res.status(500).json({ ok: false, error: error.message });
    }
};

export const testExporterUrl = async (req: Request, res: Response) => {
    try {
        const url = String(req.query.url || '').trim();
        if (!url) return res.status(400).json({ ok: false, error: 'Missing url query parameter' });
        const probe = await monitoringService.testExporterUrl(url);
        return res.status(probe.ok ? 200 : 502).json(probe);
    } catch (error: any) {
        logError('machine.testExporterUrl - error', { error: error?.message || error });
        res.status(500).json({ ok: false, error: error.message });
    }
};

export const createMachineInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.createMachineInfos - start', { body: data, user: user_id });
        const resp = await machineService.createMachine(data, user_id);
        try {
            // Attempt to add to file_sd targets for Prometheus
            const address = String((resp as any)?.url_metrics_machine || data.url_metrics_machine || '').trim();
            const os = String((resp as any)?.os_machine || data.os_machine || '').toLowerCase();
            if (address && os) {
                await monitoringService.addFileSdTarget(os, address, {
                    machine: String(data.name_machine || `M${(resp as any)?.id_machine}`),
                    os,
                });
                info('machine.createMachineInfos - filesd target added', { os, address });
            }
        } catch (e: any) {
            logError('machine.createMachineInfos - filesd update failed', { error: e?.message || e });
        }
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

// OS Referential endpoints
export const getAllRefOsMachinesInfos = async (req: Request, res: Response) => {
    try {
        const filters = req.query || {};
        info('machine.getAllRefOsMachinesInfos - start', { filters });
        const resp = await machineService.getAllRefOs(filters as any);
        info('machine.getAllRefOsMachinesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getAllRefOsMachinesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getRefOsMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('machine.getRefOsMachineInfos - start', { id });
        const resp = await machineService.getRefOsById(id);
        info('machine.getRefOsMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getRefOsMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createRefOsMachineInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.createRefOsMachineInfos - start', { body: data, user: user_id });
        const resp = await machineService.createRefOs(data, user_id);
        info('machine.createRefOsMachineInfos - success', { id: (resp as any)?.id_os_machine });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.createRefOsMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateRefOsMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('machine.updateRefOsMachineInfos - start', { id, body: data, user: user_id });
        const resp = await machineService.updateRefOs(id, data, user_id);
        info('machine.updateRefOsMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.updateRefOsMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefOsMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('machine.deleteRefOsMachineInfos - start', { id, user: user_id });
        const resp = await machineService.deleteRefOs(id, user_id);
        info('machine.deleteRefOsMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.deleteRefOsMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getAllDisabledRefOsMachinesInfos = async (_req: Request, res: Response) => {
    try {
        info('machine.getAllDisabledRefOsMachinesInfos - start');
        const resp = await machineService.getAllDisabledRefOs();
        info('machine.getAllDisabledRefOsMachinesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.getAllDisabledRefOsMachinesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const activateRefOsMachineInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('machine.activateRefOsMachineInfos - start', { id, user: user_id });
        const resp = await machineService.activateRefOsById(id, user_id);
        info('machine.activateRefOsMachineInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('machine.activateRefOsMachineInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

