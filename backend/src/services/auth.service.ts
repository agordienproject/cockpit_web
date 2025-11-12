import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prismaPSQL } from "../prisma/client_psql";
import { info, error as logError } from "../utils/logger";
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
// Make token lifetime configurable. Default to 7 days to avoid frequent expiry during development.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 12;

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

    // Default role for self-registered users
    data.role = "user";

        // Password hashing
        const hashedPassword = bcrypt.hashSync(data.password, SALT_ROUNDS);

    info('auth.registerUser - creating user', { email: data.email });
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
        info('auth.registerUser - user created', { id: (response as any)?.id_user, email: response.email });
        return response;
    } catch (error) {
        logError('auth.registerUser - error', { error: (error as any)?.message || error, stack: (error as any)?.stack });
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
    info('auth.authenticateUser - found user', { id: user.id_user, email: user.email });
    // Check if user is deleted
    if (user.deleted) {
        throw new Error("User has been deleted.");
    }

    // Get role name
    const roleName = user.role;
    const token = jwt.sign({ id: user.id_user.toString(), role: roleName }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    info('auth.authenticateUser - token created', { id: user.id_user });
    info('auth.authenticateUser - user logged in', { email: user.email });
    return { message: "Login successful", token, id_user: user.id_user, role: roleName };
};
