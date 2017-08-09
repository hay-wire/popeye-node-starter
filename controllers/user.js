/**
 * Created by sachin on 6/8/17.
 */

const debug = require('debug')("popeye:controllers:user");
const User = require('../Models/User');
const JWT = require('../helpers/jwtHelper');

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
            let user = new User(userObj);

            user.save((err) => {
                // debug(err);
                if (err) {
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
                    errors: [{
                        param: "User",
                        msg: "Successfully saved a new user."
                    }],
                    msg: "USER_SAVED",
                    data: []
                });
            }).catch((err) => {
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
            } else if (!result.data) {
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
                if (isMatch) {

                    const token = JWT.sign({
                        _id: user._id,
                        email: user.email});

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