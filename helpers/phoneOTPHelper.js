/**
 * Created by haywire on 05/10/17.
 */

const debug = require('debug')('popeye:helpers:otpchannelhelper');
const SendOtp = require('sendotp');
const sendOtp = new SendOtp(process.env.MSG91_AUTH_KEY);
sendOtp.setOtpExpiry(process.env.OTP_EXPIRY_MINUTES.toString());

exports.sendOTP = (phone, otp) => {
		return new Promise((resolve, reject) => {
				sendOtp.send(phone, process.env.MSG91_SENDER_ID, otp, (err, data, response) => {
						debug('MSG91 response: ', err, data);
						if(err) return reject(err);
						resolve(data.type === 'success');
				});
		});
};

exports.resendOTP = (phone, shouldCall) => {
		return new Promise((resolve, reject) => {
				sendOtp.retry(phone, shouldCall, (err, data, response) => {
						debug('MSG91 response: ', err, data);
						if(err) return reject(err);
						resolve(data.type === 'success');
				});
		});
};

