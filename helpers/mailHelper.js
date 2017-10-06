const nodemailer = require("nodemailer");
const request = require("request");
const messageTemplates = require('../helpers/messageTemplates');
const debug = require('debug')('popeye:helpers:mailer');

const transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
    }
});

const sendMail = exports.sendMail = function(details){
    const mailOptions = {
        to: details.to,
        subject: details.subject,
        html: details.html,

        cc: details.cc || null,
        bcc: details.bcc || null,
        from: details.from || process.env.DEFAULT_EMAIL_FROM_ADDRESS
    };

    return new Promise(function(resolve, reject){

        transporter.sendMail(mailOptions, function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(true);
            }

        });

    });
};



// sendBulkMail({
//      to:["abc@gmail.com","def@gmail.com","ghi@gmail.com", "jkl@gmail.com"],
//      text: "This is a testing mail for bulk mail.",
//      from:"hello@xyz.com",
//      subject:"Batch Mail Testing"
// });

exports.sendBulkMail = (formattedData)=>{

    // debug('formatted data:', formattedData);
    let options = {
        method: 'POST',
        url: process.env.MAILGUN_BULK_API,
        headers:
            {
                'cache-control': 'no-cache',
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
            },
        formData: formattedData,
        qsStringifyOptions: {arrayFormat: 'repeat'}
    };

    // debug('options: ', options);

    return new Promise((resolve, reject)=> {
        debug("inside promise before api hit");
        request(options, function (error, response, body) {
            debug("able to hit: ", body, error);
            if (error){
                debug('error after hitting: ', error);
                reject(false);
                return;
            }
            resolve(body);
            // console.log('response: ',response,'\nerror', error,'\n body', body);
        });
    });
};

exports.sendOTP = (email, otp) => {
    return sendMail({
        to: email,
        html: messageTemplates.emailVerificationOTP({otp}),
        subject: 'OTP Verification'
    });
};