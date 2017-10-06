
const mongoose = require("mongoose");
const debug = require("debug")("popeye:models:user");
const bcrypt = require("bcrypt");
const configConsts = require('../config/constants');

const userSchema = new mongoose.Schema({
		name: { type: String, default: null },

		phone: { type: String, sparse: true, required: false, unique: true },
		email: { type: String, lowercase: true, sparse: true, required: false, unique: true },
		password: {type: String, required: true},

		facebook: { type: String, sparse: true, required: false, unique: true },	// facebook user id
		google: { type: String, sparse: true, required: false, unique: true },		// google user id

    status: { type: String, default: configConsts.USER_STATUS.PENDING },
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

userSchema.statics.checkIfUserExists = function(username, kind){
		debug("Finding user: ", username, ' of type: ', kind);
		const where = {};
		if(!kind){
				where['email'] = username;
		}
		else {
				where[kind] = username;
		}
    return this
        .findOne(where)
        .then((result)=>{
            debug(result);
            return result;
        })
        .catch((err)=>{
            debug(err);
            throw err;
        });
};


userSchema.statics.getUser = (userId) => {
		debug("getUser called model");
		return User
				.findOne({ _id: userId }, {password: 0, _v: 0})
				.then((result) => {
					debug("getUser: ", result);
					return result;
				})
};

userSchema.statics.getUsersList = (page, searchTerm, permissionsList)=>{
		page = page || 1;
		const where = {};

		if(searchTerm){
				searchTerm = new RegExp('.*'+searchTerm+'.*', 'i');
				where['$or'] = [ { name: searchTerm}, { phone: searchTerm}, { email: searchTerm } ]
		}

		if(permissionsList && permissionsList.length){
				where['permissions'] = { $in: permissionsList }
		}

		return User.find(where, { password: 0 })
				.skip((page-1)*configConsts.USERS_PAGINATION_PER_PAGE_LIMIT)
				.limit(configConsts.USERS_PAGINATION_PER_PAGE_LIMIT);
};


userSchema.statics.getPermissions = (userId) => {
		return User
				.findOne({ _id: userId }, { permissions: 1 })


};

userSchema.statics.updatePermissions = (userId, permissions) => {
    return User
        .findOneAndUpdate({_id: userId}, { $set: { permissions: permissions } }, {new: true, fields: { permissions: 1 }} )
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
