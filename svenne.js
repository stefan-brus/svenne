/**
 * Svenne bot main entry point
 *
 * Author: Stefan Brus (github.com/stefan-brus)
 * Copyright: Yes
 * License: Beerware
 */

/**
 * `RTMClient` is used to connect to slack's real time messaging API
 */

const { RTMClient } = require('@slack/client');

/**
 * `yargs` is used for simple command line argument parsing.
 */

const argv = require('yargs').argv;

const Phrasebook = require('./phrasebook.js');

// Command line arguments
const token = argv.token;
const botUserId = argv.botuser;

// Config constants
const pbOrder = 3;
const pbFile = 'phrasebook.dat';

// Connect to slack
const rtm = new RTMClient(token);
rtm.start();

// Set up phrasebook
const pb = new Phrasebook(pbOrder, pbFile);
pb.load();
const maxPhraseLength = 20;

rtm.on('message', (message) => {
    // Log the message
    console.log(`[${message.ts}] (channel:${message.channel}) ${message.user} says: ${message.text}`);

    // Skip messages from myself
    if(message.user === botUserId) {
        return;
    }

    // Learn and respond to messages
    if(typeof(message.text) !== undefined && message.text !== undefined) {
        // Put message into phrasebook, ignore bots
        if(!message.bot_id) {
            pb.learn(message.text);
            pb.dump();
        }

        if(message.text.includes(`<@${botUserId}>`)) {
            const response = pb.generate(maxPhraseLength);
            rtm.sendMessage(response, message.channel)
                .then((res) => {
                    // Log the response
                    console.log(`[${message.ts}] (channel:${message.channel}) ${message.user} response: ${response}`);
                })
                .catch(console.error);
        }
    }
});
