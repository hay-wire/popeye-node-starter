const jwt = require('jsonwebtoken');
const debug = require("debug")("popeye:helpers:tokenHelper");
const moment = require('moment');
const configConsts = require('../config/constants');

exports.sign = (payload)=>{
    return jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: configConsts.AUTH_TOKEN_EXPIRY_HOURS +'h'
    });
};

exports.validate = (req, res, next)=>{

    let token = req.headers['authorization'];

    if(token){
        jwt.verify(token, process.env.TOKEN_SECRET , function (err, decoded) {
            if(err) {
                return res.status(403).json({
                    error: true,
                    errors: [{param: 'AUTH_TOKEN', msg: err.message}]
                });
            } else {
                req.user = decoded;
                next();
            }
        });

    }
    else {
        return res.status(403).json({
            error: true,
					  errors: [{param: 'AUTH_TOKEN', msg: 'no token supplied'}]
        });
    }
};

