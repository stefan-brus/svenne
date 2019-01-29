const { RTMClient } = require('@slack/client');

// TODO: Read from file
const token = 'bluff';

const bot_user_id = 'UFTAL8WH4';

// Connect to slack
const rtm = new RTMClient(token);
rtm.start();

rtm.on('message', (message) => {
    // Skip messages from myself
    if(message.user === bot_user_id) {
        return;
    }

    // Respond to messages mentioning me
    if(message.text.includes(`<@${bot_user_id}>`)) {
        rtm.sendMessage('börk börk', message.channel)
            .then((res) => {
                console.log('Message sent: ', res.ts);
            })
            .catch(console.error);
    }

    // Log the message
    console.log(`[${message.ts}] (channel:${message.channel}) ${message.user} says: ${message.text}`);
});
