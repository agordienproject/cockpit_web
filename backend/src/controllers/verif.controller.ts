import { Request, Response } from "express";
import * as verifService from "../services/verif.service";

const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

export const getAllVerifInfos = async (req: Request, res: Response) => {
    try {
        const resp = await verifService.getAllVerifs();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllCurrentVerifInfos = async (req: Request, res: Response) => {
    try {
        const resp = await verifService.getLatestVerifPerSystem();
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await verifService.getVerifById(id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createVerifInfos = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const resp = await verifService.createVerif(data, req.user?.id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const resp = await verifService.updateVerif(id, data, req.user?.id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteVerifInfos = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const resp = await verifService.deleteVerifById(id, req.user?.id);
        res.status(200).json(convertBigIntToString(resp));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
