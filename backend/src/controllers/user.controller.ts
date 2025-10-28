import { Request, Response } from "express";
import * as userService from "../services/user.service";

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
        console.log("Data: ", data);
        const response = await userService.registerUser(data);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to get all users information
export const getUsersInfos = async (req: Request, res: Response) => {
    try {
        const response = await userService.getAllUsers();
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to get user information by id
export const getUserInfos = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        console.log("User id: ", id);
        const response = await userService.getUserInfosById(id);
        console.log("User found");
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to update user profile (info and/or password) by id
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const data = req.body;
        console.log("User id: ", id);
        const response = await userService.updateUserProfileById(id, data);
        console.log("User profile updated");
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to modify user role by id
export const modifyUserRole = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        const data = req.body;
        console.log("User id: ", id);
        const response = await userService.modifyUserRoleById(id, data.role);
        console.log("User role modified");
        console.log("Modification response: ", response);
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to delete user by id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        console.log("User id: ", id);
        // Delete user
        await userService.deleteUserById(id);
        console.log("User deleted");
        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Function to activate user by id (reactivate user)
export const activateUser = async (req: Request, res: Response) => {
    try {
        // Get user id from url
        const id = req.params.id;
        console.log("User id: ", id);
        // Activate user
        const response = await userService.activateUserById(id);
        console.log("User activated");
        res.status(200).json(convertBigIntToString(response));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
