const express = require('express');
const router = express.Router();

const userController = require("../controllers/user");


// signUp and signIn apis
router.post("/signup", userController.validateAuthCredentials, userController.signUp);
router.post("/signin", userController.validateAuthCredentials, userController.signIn);


module.exports = router;
