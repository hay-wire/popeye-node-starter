/**
 * Created by sachin on 6/8/17.
 */

"use strict";

const debug = require('debug')("popeye:controllers:user");
const User = require('../Models/User');
const tokenHelper = require('../helpers/tokenHelper');
const userHelper = require('../helpers/userHelper');
const configConsts = require('../config/constants');
const moment = require('moment');

exports.validateAuthCredentials = (req, res, next)=>{

    req.assert("email", "Email cannot be empty.").notEmpty();
    req.assert("password", "Password cannot be empty").notEmpty();
    req.assert("email", "Invalid email.").isEmail();
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

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name || null;

    User.checkIfUserExists(email)
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

            let userObj = {email: email, password: password};
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
    let email = req.body.email;
    let password = req.body.password;
    debug('sign in called');

    User.checkIfUserExists(email)
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
                        email: user.email,
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