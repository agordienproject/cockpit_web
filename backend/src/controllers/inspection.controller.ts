// Inspection feature has been removed. Keep placeholder endpoints returning 404
import { Request, Response } from "express";

const notAvailable = (res: Response) => res.status(404).json({ error: "Inspection endpoints removed" });

export const getInspections = async (_req: Request, res: Response) => notAvailable(res);
export const getInspection = async (_req: Request, res: Response) => notAvailable(res);
export const createInspection = async (_req: Request, res: Response) => notAvailable(res);
export const updateInspection = async (_req: Request, res: Response) => notAvailable(res);
export const updateInspectionStatus = async (_req: Request, res: Response) => notAvailable(res);
export const deleteInspection = async (_req: Request, res: Response) => notAvailable(res);
export const getRecentInspections = async (_req: Request, res: Response) => notAvailable(res);





