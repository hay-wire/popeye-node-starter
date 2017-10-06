/**
 * Created by sachin on 6/8/17.
 */

"use strict";

const debug = require('debug')("popeye:controllers:user");
const User = require('../Models/User');
const tokenHelper = require('../helpers/tokenHelper');
const userHelper = require('../helpers/userHelper');
const phoneOTPHelper = require('../helpers/phoneOTPHelper');
const mailHelper = require('../helpers/mailHelper');
const configConsts = require('../config/constants');
const randomstring = require('randomstring');
const moment = require('moment');
const otplib = require('otplib');
const slackBot = require('../helpers/slackMessenger');

const expireOTPInSeconds = 60 * parseInt(process.env.OTP_EXPIRY_MINUTES);
otplib.authenticator.options = {
	step: expireOTPInSeconds   // seconds
};

const possibleOTPChannels = [];	// phone, email
for(let key in configConsts.OTP_CHANNELS){
		possibleOTPChannels.push(configConsts.OTP_CHANNELS[key]);
}
debug("Possible OTP Channels: ", possibleOTPChannels);


exports.validateAuthCredentials = (req, res, next)=>{

    req.assert("username", "username cannot be empty.").notEmpty();
    req.assert("password", "Password cannot be empty").notEmpty();
    req.assert("password", "Must be between 6 to 20 characters").len(6,20);

    req.getValidationResult()
        .then((result)=>{
            if(!result.isEmpty()){
                result.useFirstErrorOnly();
                return res.status(400).json({
                    error: true,
                    errors: result.array(),
                    data: []
                });
            }
            next();
        });
};

exports.signUp = (req, res)=>{

    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name || null;

    User.checkIfUserExists(username)
        .then((result) => {
            if (result.error) {
                return res.status(500).json({
                    error: true,
                    errors: [{
                        param: "DB_ERROR",
                        msg: "INTERNAL_SERVER_ERROR"
                    }],
                    msg: "INTERNAL_SERVER_ERROR",
                    data: []
                });
            } else if (result.data) {
                return res.status(400).json({
                    error: true,
                    errors: [{
                        param: "User",
                        msg: "USER_EXISTS"
                    }],
                    msg: "USER_EXISTS",
                    data: []
                });
            }

            let userObj = {username: username, password: password};
            if(name){
                userObj.name = name;
            }

            let user = new User(userObj);

            user.save((err) => {
                // debug(err);
                if (err) {
									  debug("Sign up save user Error: ", err);
                    return res.status(400).json({
                        error: true,
                        errors: [{
                            param: "Saving",
                            msg: err.message
                        }],
                        msg: "ERROR_OCCURRED_WHILE_SAVING_USER",
                        data: []
                    });
                }
                return res.status(200).json({
                    error: false,
                    errors: [],
                    msg: "USER_REGISTERED",
                    data: {}
                });
            })
            .catch((err) => {
							  debug("Sign up mini Error: ", err);
                return res.status(500).json({
                    error: true,
                    errors: [{
                        param: "Internal error",
                        msg: err.message
                    }],
                    msg: "INTERNAL_SERVER_ERROR",
                    data: []
                });
            });
        }).catch((err)=>{
            debug("Sign up mega Error: ", err);
            res.status(400).json({
                error: true,
                errors: [{
                    param: "User",
                    msg: err.message
                }],
                msg: "ERROR_OCCURRED_WHILE_SEARCHING_SIMILAR_USER",
                data: []
            });
        });
};


exports.signIn = (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    debug('sign in called');

    User.checkIfUserExists(username)
        .then((result) => {
        debug("sign in checkIfUserExists result", result);
            if (result.error) {
							  debug("Sign in checkIfUserExists Error: ");
                return res.status(500).json({
                    error: true,
                    errors: [{
                        param: "DB_ERROR",
                        msg: "INTERNAL_SERVER_ERROR"
                    }],
                    msg: "INTERNAL_SERVER_ERROR",
                    data: []
                });
            } else if (!result.data) {
							  debug("Sign in no user signed up ");
                return res.status(400).json({
                    error: true,
                    errors: [{
                        param: "User",
                        msg: "Please SignUp first."
                    }],
                    msg: "USER_NOT_SIGNED_UP",
                    data: []
                });
            }

            let user = result.data;

            user.comparePassword(password, function(err, isMatch) {
                // debug("after comparing passwords!");
							  debug("Sign in compare password matched?: ", isMatch, err);
                if (isMatch) {

                    const token = tokenHelper.sign({
												_id: user._id,
												name: user.name,
												email: user.email,
												phone: user.phone,
												permissions: user.permissions
										});

                    return res.status(200).json({
                        error: false,
                        msg: "Login Successfully",
                        data: [{
                            token: token
                        }]
                    });

                } else {

                    return res.status(401).json({
                        error: true,
                        errors: [{
                            param: "Password",
                            msg: "Password did not matched."
                        }],
                        msg:"Incorrect password."
                    });
                 // return done(null, false, { msg: 'Invalid username or password.' });
                }
            });

        });
};


/**
 *

    const secret = otplib.authenticator.generateSecret();
    const token = otplib.authenticator.generate(secret);
    const isValid = otplib.authenticator.check(123456, secret);

    // or

    const isValid = otplib.authenticator.verify({
        secret,
        token: 123456
    });

 *
 */

exports.generateOTP = async (req, res) => {

    req.assert("username", "username cannot be empty.").notEmpty();

    const errors = await req.getValidationResult();
    if(!errors.isEmpty()) {
    	debug(" errors: ", errors);
        return res.status(400).send({
            error: true,
            errors: errors.mapped(),
            data: {}
        });
    }

		const otpChannel = req.params.channel;
    const username = req.body.username;

		// ensure req.params.kind is of correct kind
		if(possibleOTPChannels.indexOf(otpChannel) < 0){
				return res.status(400).send({
						error: true,
						errors: [{ param: 'OTP_CHANNEL', message: 'Invalid OTP Channel. Use email or phone' }],
						data: {}
				});
		}

		debug('sending otp on ', otpChannel);
		const secret = req.body.username + process.env.OTP_SECRET_SALT;
		const token = otplib.authenticator.generate(secret);

		debug("Secret: ", secret, " token: ", token);

		let didSend = false;
		if(otpChannel === configConsts.OTP_CHANNELS.PHONE) {
				didSend = await phoneOTPHelper.sendOTP(username, token);
		}
		else if(otpChannel === configConsts.OTP_CHANNELS.EMAIL) {
				didSend = await mailHelper.sendOTP(username, token);
		}

		slackBot.sendMessage(`OTP for ${username}: ${token}`);


		debug("Did sent: ", didSend);
		if(!didSend) {
				return res.status(500).send({
						error: true,
						errors: [{param: 'OTP_ERROR', msg: 'An error occurred in sending the OTP. Please try again.'}],
						data: {}
				});
		}
		else {
				res.send({
						error: false,
						errors: [],
						data: 'SENT_OTP_TO_'+username
				});
		}

};


exports.resendOTP = async (req, res) => {
		req.assert("username", "username cannot be empty.").notEmpty();
		// req.query.shouldCall if set, call the guy

		const errors = await req.getValidationResult();
		if(!errors.isEmpty()) {
				return res.status(400).send({
						error: true,
						errors: errors.mapped(),
						data: {}
				});
		}

		const otpChannel = req.params.channel;
		const username = req.body.username;

		// ensure req.params.kind is of correct kind
		if(possibleOTPChannels.indexOf(otpChannel) < 0){
				return res.status(400).send({
						error: true,
						errors: [{ param: 'OTP_CHANNEL', message: 'Invalid OTP Channel. Use email or phone' }],
						data: {}
				});
		}

		let didSend = false;
		if(otpChannel === configConsts.OTP_CHANNELS.PHONE) {
				let shouldCall = false;
				if(req.query.shouldCall){
						shouldCall = true;
				}
				didSend = await phoneOTPHelper.resendOTP(username, shouldCall);
				debug("didSend: ", didSend)
		}
		else if(otpChannel === configConsts.OTP_CHANNELS.EMAIL) {
				let secret = req.query.username + process.env.OTP_SECRET_SALT;
				let token = otplib.authenticator.generate(secret);

				didSend = await mailHelper.sendOTP(username, token);
				slackBot.sendMessage(`OTP for ${username}: ${token}`);
		}

		if(!didSend) {
				return res.status(500).send({
						error: true,
						errors: [{param: 'OTP_ERROR', msg: 'An error occurred in resending the OTP. Please try again.'}],
						data: {}
				});
		}
		else {
				res.send({
						error: false,
						errors: [],
						data: 'RESENT_OTP_TO_'+username
				});
		}

};


exports.OTPSignIn  = async (req, res) => {
    req.assert("username", "username cannot be empty.").notEmpty();
    req.assert("otp", "OTP cannot be empty").notEmpty();

    const errors = await req.getValidationResult();
    if(!errors.isEmpty()) {
        return res.status(400).send({
            error: true,
            errors: errors.mapped(),
            data: {}
        });
    }

		const otpChannel = req.params.channel;
		const username = req.body.username;

		const secret = req.query.username + process.env.OTP_SECRET_SALT;
    const isValid = otplib.authenticator.verify({
        secret,
        token: req.body.otp
    });
		debug('isValid: ', isValid);

    if(false && !isValid) {
        return res.status(400).send({
            error: true,
            errors: [{ param: 'otp', message: 'Incorrect OTP' }],
            data: {}
        });
    }

    // ensure req.params.kind is of correct kind
    if(possibleOTPChannels.indexOf(otpChannel) < 0){
				return res.status(400).send({
						error: true,
						errors: [{ param: 'OTP_CHANNEL', message: 'Invalid OTP Channel. Use email or phone' }],
						data: {}
				});
		}

    // valid. lets check the db for this user's record
		let existingUser = await User.checkIfUserExists(req.body.username, otpChannel);
		let user = {};

    if(!existingUser){
    		const userData = {
						password: randomstring.generate(),
						status: configConsts.USER_STATUS.ACTIVE
				};

				// push email/phone in the user data
    		userData[otpChannel] = req.body.username;

    		// user does not exist. create one!
    		user = new User(userData);
				user = await user.save();
		}
		else {
    		user = existingUser;
    		delete user.password;
		}

		if(!user || !user._id){
				return res.status(500).send({
						error: true,
						errors: [{ param: 'DB_ERROR', message: 'Error saving user. Please try again later.' }],
						data: {}
				});
		}
		else {

				const token = tokenHelper.sign({
						_id: user._id,
						name: user.name,
						email: user.email,
						phone: user.phone,
						permissions: user.permissions
				});

				res.send({
						error: false,
						errors: [],
						data: token
				});
		}
};



exports.getUser = async (req, res) => {
    let userId = req.user._id;  // current user's ID

    // if this user has permission to manage other users and he is not asking about himself
    if(userHelper.hasPermission(req.user, configConsts.USER_PERMISSIONS.MANAGE_USERS) && (req.params.userId !== 'me')) {
        // allow him to use other user's id
        userId = req.params.userId;
    }

    debug('get user: ', userId);
    const user = await User.getUser(userId);
    debug('user details: ', user);
    res.json({
      error: false,
      errors: [],
      data: user
    });

};

exports.updatePermissions = async (req, res) => {
    let permissions = req.body.permissions;
    let userId = req.user._id;  // current user's ID

    // if this user has permission to manage other users and he is not asking about himself
    if(userHelper.hasPermission(req.user, configConsts.USER_PERMISSIONS.MANAGE_USERS) && (req.params.userId !== 'me')) {
        // allow him to use other user's id
        userId = req.params.userId;
    }

	  const result = await User.updatePermissions(userId, permissions);
    res.json({ error: false, errors: [], data: result });
};

exports.getPermissions = async(req, res) => {
    let userId = req.user._id;  // current user's ID

    // if this user has permission to manage other users and he is not asking about himself
    if(userHelper.hasPermission(req.user, configConsts.USER_PERMISSIONS.MANAGE_USERS) && (req.params.userId !== 'me')) {
        // allow him to use other user's id
        userId = req.params.userId;
    }

    const userPermissions = await User.getPermissions(userId);
    res.json({error: false, errors:[], data: userPermissions});
};