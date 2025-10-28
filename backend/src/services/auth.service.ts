import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaPSQL } from "../prisma/client_psql";
import { fixUserIdSequence } from "../utils/db-fixes";
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const SALT_ROUNDS = 12;

// ------------------- Utility Functions ------------------- //

// ------------------- Authentication Functions ------------------- //

// User creation function //
export const registerUser = async (data: any) => {

    try {
        // Email verification
        const existingUser = await prismaPSQL.dIM_USER.findFirst({
            where: { email: data.email },
        });
        if (existingUser) throw new Error("Email already in use.");

        // Get user role
        data.role = "inspector";

        // Password hashing
        const hashedPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);

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

// User authentication function //
export const authenticateUser = async (data: any) => {
    const user = await prismaPSQL.dIM_USER.findFirst({
        where: { email: data.email },
    });
    if (!user || !bcrypt.compareSync(data.password, user.password)) {
        throw new Error("Incorrect credentials.");
    }
    console.log("User: ", user);
    // Check if user is deleted
    if (user.deleted) {
        throw new Error("User has been deleted.");
    }

    // Get role name
    const roleName = user.role;
    const token = jwt.sign({ id: user.id_user.toString(), role: roleName }, JWT_SECRET, { expiresIn: "1h" });
    console.log("Token: ", token);
    console.log("User logged in: ", user.email);
    return { message: "Login successful", token, id_user: user.id_user, role: roleName };
};
