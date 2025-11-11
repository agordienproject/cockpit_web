import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { info, error as logError } from "../utils/logger";

// Function to convert BigInt to String
const convertBigIntToString = (obj: any) => {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    ));
};

// Function to create user
export const createUser = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        info('user.createUser - start', { body: data, user: req.user?.id });
        const response = await userService.registerUser(data);
        info('user.createUser - created', { id: (response as any)?.id_user });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.createUser - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}

// Function to get all users information
export const getUsersInfos = async (req: Request, res: Response) => {
    try {
        info('user.getUsersInfos - start', { user: req.user?.id });
        const response = await userService.getAllUsers();
        info('user.getUsersInfos - success', { count: Array.isArray(response) ? response.length : undefined });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.getUsersInfos - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}

// Function to get user information by id
export const getUserInfos = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        info('user.getUserInfos - start', { id, user: req.user?.id });
        const response = await userService.getUserInfosById(id);
        info('user.getUserInfos - success', { id });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.getUserInfos - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
};

// Function to update user profile (info and/or password) by id
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        info('user.updateUserProfile - start', { id, body: data, user: req.user?.id });
        // Prevent non-admins from changing a user's service affiliation
        const requester: any = (req as any).user;
        // If the payload explicitly contains id_service and the requester is not admin, strip it.
        if (Object.prototype.hasOwnProperty.call(data, 'id_service') && requester?.role !== 'admin') {
            delete data.id_service;
        }
        const response = await userService.updateUserProfileById(id, data);
        info('user.updateUserProfile - success', { id });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.updateUserProfile - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}

// Function to modify user role by id
export const modifyUserRole = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        const data = req.body;
        info('user.modifyUserRole - start', { id, body: data, user: req.user?.id });
        const response = await userService.modifyUserRoleById(id, data.role);
        info('user.modifyUserRole - success', { id, role: data.role });
        info('user.modifyUserRole - response', { response });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.modifyUserRole - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}

// Function to delete user by id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        info('user.deleteUser - start', { id, user: req.user?.id });
        // Delete user
        await userService.deleteUserById(id);
        info('user.deleteUser - success', { id });
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        logError('user.deleteUser - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}

// Function to activate user by id (reactivate user)
export const activateUser = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        info('user.activateUser - start', { id, user: req.user?.id });
        // Activate user
        const response = await userService.activateUserById(id);
        info('user.activateUser - success', { id });
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        logError('user.activateUser - error', { error: (error as any)?.message || error });
        res.status(500).json({ error: (error as any)?.message || 'Internal error' });
    }
}
