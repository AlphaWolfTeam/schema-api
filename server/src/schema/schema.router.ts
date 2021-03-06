import { Router } from "express";
import { wrapAsync, wrapAsyncPermissions } from "../utils/wrapper";
import Controller from "../schema/schema.controller";
import { checkPermission } from "../utils/permissions/permissions";
import { config } from "../utils/permissions/permissions.config";

const schemaRouter: Router = Router();

schemaRouter.post(
  "/",
  wrapAsyncPermissions(checkPermission, config.create),
  wrapAsync(Controller.create)
);
schemaRouter.put(
  "/:id",
  wrapAsyncPermissions(checkPermission, config.update),
  wrapAsync(Controller.update)
);
schemaRouter.delete(
  "/:id",
  wrapAsyncPermissions(checkPermission, config.deleteSchema),
  wrapAsync(Controller.deleteSchema)
);
schemaRouter.delete(
  "/:id/:propertyId",
  wrapAsyncPermissions(checkPermission, config.deleteProperty),
  wrapAsync(Controller.deleteProperty)
);
schemaRouter.get(
  "/:id",
  wrapAsyncPermissions(checkPermission, config.getById),
  wrapAsync(Controller.getById)
);
schemaRouter.get(
  "/",
  wrapAsyncPermissions(checkPermission, config.getAll),
  wrapAsync(Controller.getAll)
);

export default schemaRouter;
