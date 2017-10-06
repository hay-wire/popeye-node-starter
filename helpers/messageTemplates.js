let moment = require('moment');
let debug = require('debug')("popeye:helpers:messageTemplates");


exports.forgotPasswordMailTemplate = function(details) {
    let content = `Hey! We heard you lost your password. Well, just use <b>${details.otp}</b> as a token to reset it. It expires in next 10 minutes!`;
    return mailTemplate(content, 'Forgot Password?');
};

exports.passwordResetConfirmation = function(){
    let content = `Hi! This is to confirm that your password has been reset successfully. In case it wasn't you, contact our customer support immediately!`;
    return mailTemplate(content,  'Password Reset Confirmation!');
};


exports.emailVerificationOTP = function(details) {
		let content = `Hi there! Please use <b>${details.otp}</b> as the token to verify your email. It expires in next 10 minutes!`;
		return mailTemplate(content, 'Verify Your Email-Id');
};



let mailTemplate =  function(content, title){
    return `<html>
              <head>
                  <title>${title}</title>
              </head>
              <body>${content}</body>
          </html>`;
};

