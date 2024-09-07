require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const activeTasks = {}; // Stores active tasks with asset symbol as the key

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0];
    const asset = args[1]?.toUpperCase(); // Assumes asset is in the second position
    const intervalx = parseInt(args[2], 10); // Assumes interval is in the third position
    const durationx = parseInt(args[3], 10); // Assumes duration is in the fourth position

    const interval = intervalx * 60;
    const duration = durationx * 3600;

    // Command to start logging
    if (command === '!logstart' && asset && interval && duration) {
        if (activeTasks[asset]) {
            message.channel.send(`Task for ${asset} already exists. Use !pause or !end to manage it.`);
            return;
        }

        const endTime = Date.now() + duration * 1000;
        const task = setInterval(async () => {
            if (Date.now() > endTime) {
                clearInterval(task);
                delete activeTasks[asset];
                message.channel.send(`Logging ended for ${asset}.`);
                return;
            }

            try {
                const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`);
                const price = parseFloat(response.data.price);
                let formattedPrice;

                if (price < 1) {
                    formattedPrice = price.toFixed(4);
                } else if (price < 10) {
                    formattedPrice = price.toFixed(3);
                } else {
                    formattedPrice = price.toFixed(2);
                }

                message.channel.send(`Current ${asset} Price: $${formattedPrice}`);
            } catch (error) {
                console.error('Error fetching price:', error);
                message.channel.send(`Failed to fetch price for ${asset}.`);
            }
        }, interval * 1000);

        activeTasks[asset] = { task, endTime };
        message.channel.send(`Started logging ${asset} every ${intervalx} minutes for ${durationx} hour(s).`);
    }

    // Command to pause logging
    if (command === '!pause' && asset) {
        if (!activeTasks[asset]) {
            message.channel.send(`No active task for ${asset}.`);
            return;
        }

        clearInterval(activeTasks[asset].task);
        activeTasks[asset].paused = true;
        message.channel.send(`Paused logging for ${asset}.`);
    }

    // Command to unpause logging
    if (command === '!unpause' && asset) {
        if (!activeTasks[asset]) {
            message.channel.send(`No active task for ${asset}.`);
            return;
        }

        if (!activeTasks[asset].paused) {
            message.channel.send(`Task for ${asset} is not paused.`);
            return;
        }

        const endTime = activeTasks[asset].endTime;
        const interval = activeTasks[asset].interval;

        const task = setInterval(async () => {
            if (Date.now() > endTime) {
                clearInterval(task);
                delete activeTasks[asset];
                message.channel.send(`Logging ended for ${asset}.`);
                return;
            }

            try {
                const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${asset}USDT`);
                const price = parseFloat(response.data.price);
                let formattedPrice;

                if (price < 1) {
                    formattedPrice = price.toFixed(4);
                } else if (price < 10) {
                    formattedPrice = price.toFixed(3);
                } else {
                    formattedPrice = price.toFixed(2);
                }

            } catch (error) {
                console.error('Error fetching price:', error);
                message.channel.send(`Failed to fetch price for ${asset}.`);
            }
        }, interval * 1000);

        activeTasks[asset].task = task;
        activeTasks[asset].paused = false;
        message.channel.send(`Resumed logging for ${asset}.`);
    }

    // Command to end logging
    if (command === '!end' && asset) {
        if (!activeTasks[asset]) {
            message.channel.send(`No active task for ${asset}.`);
            return;
        }

        clearInterval(activeTasks[asset].task);
        delete activeTasks[asset];
        message.channel.send(`Ended logging for ${asset}.`);
    }
});

client.login(process.env.DISCORD_TOKEN);