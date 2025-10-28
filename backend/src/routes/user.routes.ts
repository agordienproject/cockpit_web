import { Router } from "express";
import * as userController from "../controllers/user.controller";
import * as serviceController from "../controllers/service.controller";
import { verifyRole, verifyUserId } from "../middlewares/user.middleware";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyToken);

// Endpoints for user routes
router.get("/", verifyRole, userController.getUsersInfos);                         // Route to get all users information
router.get("/:id", userController.getUserInfos);                                   // Route to get user information by id
router.post("/", verifyRole, userController.createUser);                           // Route to create user
router.put("/:id", verifyUserId, userController.updateUserProfile);                // Route to update user profile (info and/or password)
router.put("/:id/role", verifyRole, userController.modifyUserRole);                // Route to modify user role by id
router.delete("/:id", verifyRole, userController.deleteUser);                      // Route to delete user by id

// Endpoints for service routes
router.get("/services/", serviceController.getAllServicesInfos);                   // Route to get all service informations
router.get("/services/:id", serviceController.getServiceInfos);                    // Route to get service information by id
router.post("/services", verifyRole, serviceController.createUser);                // Route to create service
router.put("/services/:id", verifyRole, serviceController.updateUserProfile);      // Route to update service
router.delete("/services/:id", verifyRole, serviceController.deleteUser);          // Route to delete service by id

export default router;
