import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import { info, error as logError } from "../utils/logger";

const redactConnectionForLog = (connection: any) => {
    if (!connection) return undefined;
    const { password, ...rest } = connection;
    return { ...rest, password: password ? "***" : undefined };
};

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllDatabasesInfos = async (req: Request, res: Response) => {
    try {
        info('database.getAllDatabasesInfos - start', { user: req.user?.id });
        const resp = await dbService.getAllDatabases();
        info('database.getAllDatabasesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.getAllDatabasesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getDatabaseInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('database.getDatabaseInfos - start', { id, user: req.user?.id });
        const resp = await dbService.getDatabaseById(id);
        info('database.getDatabaseInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.getDatabaseInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createDatabaseInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        const { connection, ...rest } = data || {};
        info('database.createDatabaseInfos - start', { body: { ...rest, connection: redactConnectionForLog(connection) }, user: user_id });
        const resp = await dbService.createDatabase(data, user_id);
        info('database.createDatabaseInfos - success', { id: (resp as any)?.id_db });
        res.status(201).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.createDatabaseInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateDatabaseInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        const { connection, ...rest } = data || {};
        info('database.updateDatabaseInfos - start', { id, body: { ...rest, connection: redactConnectionForLog(connection) }, user: user_id });
        const resp = await dbService.updateDatabase(id, data, user_id);
        info('database.updateDatabaseInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.updateDatabaseInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteDatabaseInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('database.deleteDatabaseInfos - start', { id, user: user_id });
        const resp = await dbService.deleteDatabase(id, user_id);
        info('database.deleteDatabaseInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.deleteDatabaseInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

// Database Type Referential
export const getAllRefDatabaseTypesInfos = async (req: Request, res: Response) => {
    try {
        info('database.getAllRefDatabaseTypesInfos - start', { user: req.user?.id });
        const resp = await dbService.getAllRefDatabaseTypes();
        info('database.getAllRefDatabaseTypesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.getAllRefDatabaseTypesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getRefDatabaseTypeInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        info('database.getRefDatabaseTypeInfos - start', { id, user: req.user?.id });
        const resp = await dbService.getRefDatabaseTypeById(id);
        info('database.getRefDatabaseTypeInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.getRefDatabaseTypeInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const createRefDatabaseTypeInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const user_id = req.user?.id;
        info('database.createRefDatabaseTypeInfos - start', { body: data, user: user_id });
        const resp = await dbService.createRefDatabaseType(data, user_id);
        info('database.createRefDatabaseTypeInfos - success', { id: (resp as any)?.id_type_db });
        res.status(201).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.createRefDatabaseTypeInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const updateRefDatabaseTypeInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user_id = req.user?.id;
        info('database.updateRefDatabaseTypeInfos - start', { id, body: data, user: user_id });
        const resp = await dbService.updateRefDatabaseType(id, data, user_id);
        info('database.updateRefDatabaseTypeInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.updateRefDatabaseTypeInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const deleteRefDatabaseTypeInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('database.deleteRefDatabaseTypeInfos - start', { id, user: user_id });
        const resp = await dbService.deleteRefDatabaseType(id, user_id);
        info('database.deleteRefDatabaseTypeInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.deleteRefDatabaseTypeInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const getAllDisabledRefDatabaseTypesInfos = async (req: Request, res: Response) => {
    try {
        info('database.getAllDisabledRefDatabaseTypesInfos - start', { user: req.user?.id });
        const resp = await dbService.getAllDisabledRefDatabaseTypes();
        info('database.getAllDisabledRefDatabaseTypesInfos - success', { count: Array.isArray(resp) ? resp.length : undefined });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.getAllDisabledRefDatabaseTypesInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const activateRefDatabaseTypeInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user_id = req.user?.id;
        info('database.activateRefDatabaseTypeInfos - start', { id, user: user_id });
        const resp = await dbService.activateRefDatabaseType(id, user_id);
        info('database.activateRefDatabaseTypeInfos - success', { id });
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        logError('database.activateRefDatabaseTypeInfos - error', { error: error?.message || error });
        res.status(500).json({ error: error.message });
    }
};

export const testDatabaseConnection = async (req: Request, res: Response) => {
    try {
        const body = req.body as any;
        const connection = body?.connection;
        const typeId = body?.id_type_db;
        console.log("Received test connection request for typeId:", typeId, "with connection:", redactConnectionForLog(connection));

        if (!connection) {
            return res.status(400).json({ ok: false, error: "Missing connection" });
        }
        if (!connection.host || !connection.user || !connection.password) {
            return res.status(400).json({ ok: false, error: "Host, user and password are required" });
        }
        info('database.testDatabaseConnection - start', { user: req.user?.id, typeId });
        await dbService.testConnection(connection, typeId);
        info('database.testDatabaseConnection - success');
        res.status(200).json({ ok: true });
    } catch (error: any) {
        logError('database.testDatabaseConnection - error', { error: error?.message || error });
        res.status(200).json({ ok: false, error: error?.message || 'Connection failed' });
    }
};
