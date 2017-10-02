const express = require('express');
const router = express.Router();
const userHelper = require("../helpers/userHelper");
const configConsts = require('../config/constants');

const userController = require("../controllers/user");


// user permissions control apis
router.get("/:userId", userController.getUser);
router.post("/:userId/permissions", userHelper.ensurePermission(configConsts.USER_PERMISSIONS.MANAGE_USERS), userController.updatePermissions);
router.get("/:userId/permissions", userController.getPermissions);


module.exports = router;
