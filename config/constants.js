/**
 * Created by haywire on 30/09/17.
 */

module.exports = {

	AUTH_TOKEN_EXPIRY_HOURS: 168, // 7 days

	OTP_CHANNELS: {
			PHONE: 'phone',
			EMAIL: 'email'
	},

	USER_PERMISSIONS: {
		MANAGE_USERS: 'manage_users'
	},

	USER_STATUS: {
		BLOCKED: -1,
		PENDING: 0,
		ACTIVE: 1
	},
	USERS_PAGINATION_PER_PAGE_LIMIT: 50,

};