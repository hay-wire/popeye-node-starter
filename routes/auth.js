const express = require('express');
const router = express.Router();

const userController = require("../controllers/user");


// signUp and signIn apis
router.post("/signin/otp/:channel/send", userController.generateOTP);
router.post("/signin/otp/:channel/resend", userController.resendOTP);
router.post("/signin/otp/:channel/verify", userController.OTPSignIn);
router.post("/signup", userController.validateAuthCredentials, userController.signUp);
router.post("/signin", userController.validateAuthCredentials, userController.signIn);


module.exports = router;
