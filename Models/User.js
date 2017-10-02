
const mongoose = require("mongoose");
mongoose.set('debug', true);
const debug = require("debug")("popeye:models:user");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email: {type: String, lowercase: true, required: true, unique: true},
    password: {type: String, required: true},
    permissions: { type: [String], default: [] }
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
	debug("Finding user: ", email);
    return this
        .findOne({email: email})
        .then((result)=>{
            debug(result);
            return {error: false, data: result};
        })
        .catch((err)=>{
            debug(err);
            return {error: true};
        });
};

mongoose.set('debug', true);


userSchema.statics.getUser = async (userId) => {
		debug("getUser called model");
		return await User
				.findOne({ _id: userId })
				.then((result) => {
					debug("getUser: ", result);
				})
};

userSchema.statics.getPermissions = (userId) => {
		return User
				.findOne({ _id: userId }, { permissions: 1 })


};

userSchema.statics.updatePermissions = (userId, permissions) => {
    return User
        .findOneAndUpdate({_id: userId}, { $set: { permissions: permissions } } )
};


userSchema.methods.addPermissions = (permissions) => {
    for(let i=0; i<permissions.length; i++) {
			if (this.permissions.indexOf(permissions[i]) >= 0) {
				continue;
			}
			this.permissions.push(permissions[i]);
		}
	  if(this.isModified('permissions')) {
			return this.save();
		}
		return true;
};

const User = module.exports = mongoose.model('user', userSchema);