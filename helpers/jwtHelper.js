const jwt = require('jsonwebtoken');
const debug = require("debug")("popeye:helpers:jwtHelper");

exports.sign = (payload)=>{
    return jwt.sign(payload, process.env.TOKEN_SECRET);
};

exports.verify = (req, res, next)=>{

    let token = req.headers['authorization'];

    if(token){
        jwt.verify(token, process.env.TOKEN_SECRET , function (err, decoded) {
            if(err){
                return res.status(403).json({
                    error: true,
                    msg: "Unauthorized."
                });
            }else{
                req.user = decoded;
                next();
            }
        });
    }else{
        return res.status(403).json({
            error: true,
            msg:"Unauthorized."
        });
    }
};