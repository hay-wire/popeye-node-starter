/**
 * Created by haywire on 01/10/17.
 */

const debug = require('debug')('popeye:helpers:userhelper');

exports.ensurePermission = (permission) => {
	return (req, res, next) => {

		// if user has all permissions or has this specific permission
		if( hasPermission(req.user, permission) ){
			// user has the required permissions
			return next();
		}

		// block the user
		return res.status(403).json({
			error: true,
			msg:"Not sufficient permissions"
		})
	}
};


const hasPermission = exports.hasPermission = (user, permission) => {
	debug(user, "has permission: ", permission, " isSuperUSER? ", (user.permissions.indexOf('*') >= 0), " or has local permission: ", (user.permissions.indexOf(permission) >= 0));
	return (user.permissions.indexOf('*') >= 0) || (user.permissions.indexOf(permission) >= 0);
};