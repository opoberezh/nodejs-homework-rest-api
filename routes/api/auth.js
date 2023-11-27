const express = require("express");
const validateBody = require("../../middlewares/validateBody");
const auth = require("../../middlewares/authenticate");
const schemas = require("../../schemas/user");
const ctrl = require("../../controllers/auth");
const upload = require("../../middlewares/upload");
const router = express.Router();

router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.get("/current", auth, ctrl.getCurrent);

router.post("/logout", auth, ctrl.logout);

router.patch("/", auth, ctrl.updateSubscription);

router.get("/current", auth, ctrl.getCurrent);

router.patch("/avatar", upload.single("avatar"), auth, ctrl.uploadAvatar);

router.get("/avatar", ctrl.uploadAvatar)

module.exports = router;
