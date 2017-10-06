/**
 * Created by haywire on 14/09/16.
 */

const debug = require('debug')('popeye:helpers:slackbot');
const _ = require('lodash');

if(process.env.OFFLINE){
    exports.sendAlert = debug;
    exports.sendMessage = debug;
}
else {
    const SlackBot = require('slackbots');
    const bot = new SlackBot({
        token: process.env.SLACK_BOT_TOKEN, // Add a bot https://my.slack.com/services/new/bot and put the token
        name: 'Popeye Bot'
    });

    bot.on('start', function () {
        // more information about additional params https://api.slack.com/methods/chat.postMessage
        // define channel, where bot exist. You can adjust it there https://my.slack.com/services
        exports.sendAlert = function (msg) {
            bot.postMessageToChannel('alerts', msg, {
                icon_emoji: ':crying_cat_face:'
            });
        };

        exports.sendMessage = function (msg, channel, options) {
            _.extend(options || {}, {
                icon_emoji: ':robot_face:'
            });
            bot.postMessageToChannel(channel || 'notifications', msg, options)
                .then((a,b,c) => {
                    debug("bot post message: ", a, b, c);
                })
        };

        // define existing username instead of 'user_name'
        //bot.postMessageToUser('sipu', 'meow!', params);

        // If you add a 'slackbot' property,
        // you will post to another user's slackbot channel instead of a direct message
        //bot.postMessageToUser('saurabh2590', 'meow!', { 'slackbot': true, icon_emoji: ':cat:' });

        // define private group instead of 'private_group', where bot exist
        //bot.postMessageToGroup('private_group', 'meow!', params);
    });
}