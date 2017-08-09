
const mongoose = require("mongoose");
const debug = require("debug")("popeye:models:user");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email: {type: String, lowercase: true, required: true, unique: true},
    password: {type: String, required: true},
},{timestamps: true});

userSchema.pre('save', function(next) {
    var user = this;
    const saltRounds = 12;

    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.hash(user.password, saltRounds, function(err, hash) {
        debug(hash, user.password,"err: ", err);
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

userSchema.statics.checkIfUserExists = function(email){
    return this
        .findOne({email: email})
        .then((result)=>{
            // debug(result);
            return {error: false, data: result};
        })
        .catch((err)=>{
            // debug(err);
            return {error: true};
        });
};

module.exports = mongoose.model('user', userSchema);