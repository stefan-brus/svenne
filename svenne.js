/**
 * Svenne bot main entry point
 *
 * Author: Stefan Brus (github.com/stefan-brus)
 * Copyright: Yes
 * License: Beerware
 */

/**
 * RTMClient is used to connect to slack's real time messaging API
 */

const { RTMClient } = require('@slack/client');

/**
 * `yargs` is used for simple command line argument parsing.
 */

const argv = require('yargs').argv;

const token = argv.token;
const botUserId = argv.botuser;

// Connect to slack
const rtm = new RTMClient(token);
rtm.start();

rtm.on('message', (message) => {
    // Skip messages from myself
    if(message.user === botUserId) {
        return;
    }

    // Respond to messages mentioning me
    if(message.text.includes(`<@${botUserId}>`)) {
        rtm.sendMessage('börk börk', message.channel)
            .then((res) => {
                console.log('Message sent: ', res.ts);
            })
            .catch(console.error);
    }

    // Log the message
    console.log(`[${message.ts}] (channel:${message.channel}) ${message.user} says: ${message.text}`);
});
