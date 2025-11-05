import { Router } from "express";
import * as userController from "../controllers/user.controller";
import * as serviceController from "../controllers/service.controller";
import { verifyRole, verifyUserId, requireAdmin, requireAdminOrChief } from "../middlewares/user.middleware";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyToken);

// Endpoints for user routes
router.get("/", requireAdminOrChief, userController.getUsersInfos);                         // Route to get all users information (admin/chief)
// Endpoints for service routes (define before parameterized user routes)
router.get("/services/", serviceController.getAllServicesInfos);                   // Route to get all service informations
router.get("/services/:id", serviceController.getServiceInfos);                    // Route to get service information by id
// Service referential management only allowed by admin
router.post("/services", requireAdmin, serviceController.createServiceInfos);                // Route to create service
router.put("/services/:id", requireAdmin, serviceController.updateServiceInfos);      // Route to update service
router.delete("/services/:id", requireAdmin, serviceController.deleteServiceInfos);          // Route to delete service by id

router.get("/:id", userController.getUserInfos);                                   // Route to get user information by id
// User management: only admin can create/modify/delete users
router.post("/", requireAdmin, userController.createUser);                           // Route to create user
router.put("/:id", verifyUserId, userController.updateUserProfile);                // Route to update user profile (info and/or password)
router.put("/:id/role", requireAdmin, userController.modifyUserRole);                // Route to modify user role by id
router.delete("/:id", requireAdmin, userController.deleteUser);                      // Route to delete user by id

export default router;
