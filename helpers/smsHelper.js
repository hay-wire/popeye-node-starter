const request = require('request') ;
const debug = require('debug')('popeye:helpers:sms');

exports.sendSMS = function(phoneNo, message){

    let formData = {
        username: encodeURIComponent(process.env.TEXTLOCAL_EMAIL),
        hash: encodeURIComponent(process.env.TEXTLOCAL_HASH_KEY),
        numbers: encodeURIComponent([phoneNo]),
        sender: process.env.TEXTLOCAL_SENDER,
        message: encodeURIComponent(message)
    };

    return new Promise(function(resolve, reject){
        request.post({
                url: process.env.TEXTLOCAL_BASEURL,
                form: formData
            },
            function(err, response, body) {
                try {
                    body = JSON.parse(body);
                    if(body.status !== 'success'){
                        debug("Failed to send sms", err, "body: ", body);
                        reject(new Error(JSON.stringify({exception: false, data: {body: body, error: err}})));
                    }
                    else {
                        resolve(true);
                    }
                }
                catch(ex){
                    debug("Exception in sending sms", ex);
                    reject(new Error(JSON.stringify({exception: true, data: {exception: ex.message, body: body, error: err }})));
                }
            })

    });
};


exports.sendBulkSMS = function(messages){
    let options = {
        method: 'POST',
        url: process.env.TEXTLOCAL_BULK_BASEURL,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            hash: process.env.TEXTLOCAL_BULK_HASH_KEY,
            username: encodeURIComponent(process.env.TEXTLOCAL_BULK_EMAIL),
            data: encodeURIComponent(JSON.stringify(messages.data)),
        }
    };

    return new Promise(function (resolve, reject) {

        request(options, function (err, response, body) {
            debug('send Bulk SMS: API hit response: ', body);
            if(err){
                reject(new Error("Message did not sent"));
                return;
            }
            resolve(body);
        });
    });
};


