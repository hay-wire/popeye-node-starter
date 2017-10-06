/**
 * Created by haywire on 06/10/17.
 */

const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const GoogleTokenStrategy = require('passport-google-token').Strategy;
const debug = require('debug')('popeye:helpers:passportauthhelper');

passport.use(new FacebookTokenStrategy({
				clientID: process.env.FACEBOOK_APP_ID,
				clientSecret: process.env.FACEBOOK_APP_SECRET
		}, function(accessToken, refreshToken, profile, done) {
				debug("Found Facebook User Profile: ", ...{profile, kind: 'google'} );
				done(null, ...{profile, kind: 'facebook'} );
		}
));

passport.use(new GoogleTokenStrategy({
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET
		}, function(accessToken, refreshToken, profile, done) {
				debug('Found Google User Profile: ', ...{profile, kind: 'google'} );
				done(null, ...{profile, kind: 'google'});
		}
));
