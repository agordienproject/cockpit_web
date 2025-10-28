import { prismaPSQL } from "../prisma/client_psql";
import { fixUserIdSequence } from "../utils/db-fixes";
import bcrypt from "bcryptjs";


const SALT_ROUNDS = 12;


// ------------------- Fonctions utiles ------------------- //

// Function to hash password
export const hashPassword = async (password: any) => {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
};

// ------------------- Fonctions user ------------------- //

// User creation function //
export const registerUser = async (data: any) => {

    try {
        // Email verification
        const existingUser = await prismaPSQL.dIM_USER.findFirst({
            where: { email: data.email },
        });
        if (existingUser) throw new Error("Email already in use.");

        // Password hashing
        const hashedPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);

        // Verify if role is valid
        if (data.role !== "admin" && data.role !== "chief" && data.role !== "inspector") {
            throw new Error("Invalid role.");
        }

        try {
            console.log("Creating user...");
            // User creation
            const response = await prismaPSQL.dIM_USER.create({
                data: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    pseudo: data.pseudo,
                    email: data.email,
                    password: hashedPassword,
                    role: data.role,
                },
            });
            if (!response) throw new Error("Error while creating user.");
            console.log("User created: ", response);
            return response;
        } catch (createError: any) {
            // If we get a unique constraint error on id_user, try to fix the sequence and retry
            if (createError.code === 'P2002' && createError.meta?.target?.includes('id_user')) {
                console.log("Attempting to fix user ID sequence...");
                await fixUserIdSequence();
                // Retry the creation
                const response = await prismaPSQL.dIM_USER.create({
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        pseudo: data.pseudo,
                        email: data.email,
                        password: hashedPassword,
                        role: data.role,
                    },
                });
                if (!response) throw new Error("Error while creating user.");
                console.log("User created after sequence fix: ", response);
                return response;
            }
            throw createError;
        }
    } catch (error) {
        console.error("Error while creating user:", error);
        if (error.message === "Email already in use.") {
            throw new Error("Email already in use.");
        }
        else {
            throw new Error("Error while creating user.");
        }
    }
};

// Function to get all users
export const getAllUsers = async () => {
    const users = await prismaPSQL.dIM_USER.findMany();
    return users;
};

// Function to get user information by id
export const getUserInfosById = async (id: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { id_user: id },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

// Function to modify user information by id
export const modifyUserInfosById = async (id: any, userData: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { id_user: id },
    });
    if (!user) {
        throw new Error("User not found");
    }

    const updatedUser = await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: {
            last_name: userData.last_name,
            first_name: userData.first_name,
            pseudo: userData.pseudo,
            email: userData.email,
        },
    });

    return updatedUser;
};

// Function to modify user password by id
export const modifyUserPasswordById = async (id: any, oldPassword: any, newPassword: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { id_user: id },
    });
    if (!user) {
        throw new Error("User not found");
    }

    // Verify if old password matches
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await hashPassword(newPassword);

    const updatedUser = await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: { password: hashedPassword },
    });

    return updatedUser;
};

// Function to modify user role by id
export const modifyUserRoleById = async (id: any, role: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { id_user: id },
    });
    if (!user) {
        throw new Error("User not found");
    }

    const updatedUser = await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: { role: role },
    });

    return updatedUser;
};


// Function to delete user by id (soft delete with suspended column)
export const deleteUserById = async (id: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { 
            id_user: id,
            deleted: false 
        },
    });
    if (!user) {
        throw new Error("User not found or already deleted");
    }

    await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: { deleted: true },
    });
    console.log(`User with id ${id} has been deleted (soft delete).`);

    return user;
};

// Function to reactivate user by id (soft delete with suspended column)
export const activateUserById = async (id: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { 
            id_user: id,
            deleted: true 
        },
    });
    if (!user) {
        throw new Error("User not found or not suspended");
    }

    const updatedUser = await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: { deleted: false },
    });
    console.log(`User with id ${id} has been reactivated.`);

    return updatedUser;
}

// Function to update user profile (info and/or password) by id
export const updateUserProfileById = async (id: any, profileData: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { id_user: id },
    });
    if (!user) {
        throw new Error("User not found");
    }

    // Prepare update data
    const updateData: any = {};
    if (profileData.first_name) updateData.first_name = profileData.first_name;
    if (profileData.last_name) updateData.last_name = profileData.last_name;
    if (profileData.pseudo) updateData.pseudo = profileData.pseudo;
    if (profileData.email) updateData.email = profileData.email;

    // If password change is requested
    if (profileData.currentPassword && profileData.newPassword) {
        // Verify old password
        const isPasswordValid = await bcrypt.compare(profileData.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error("Current password is incorrect");
        }
        updateData.password = await hashPassword(profileData.newPassword);
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("No profile fields to update");
    }

    const updatedUser = await prismaPSQL.dIM_USER.update({
        where: { id_user: id },
        data: updateData,
    });
    return updatedUser;
};