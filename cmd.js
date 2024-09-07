require('dotenv').config();
re
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Ready!');
});
client.on('messageCreate', async message => {

    if (message.author.bot) return; //ignore

    if (message.content.startsWith('!') && message.content.length > 1) {

        const asset = message.content.slice(1).trim(); 
        if (!asset) {
            message.channel.send('Please specify an asset.');
            return;
        }
        const symbol = asset.toUpperCase() + 'USDT'; 

        try {

            const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
            

            const price = parseFloat(response.data.lastPrice);
            const priceChangePercent = parseFloat(response.data.priceChangePercent);
            const pricechanged = parseFloat(response.data.priceChange)
            
            let pricechange;
            if (price < 1) {
                pricechange = pricechanged.toFixed(4);
            } else if (price < 10) {
                pricechange = pricechanged.toFixed(3);
            } else {
                pricechange = pricechanged.toFixed(2);
            }

            let formattedPrice;
            if (price < 1) {
                formattedPrice = price.toFixed(4);
            } else if (price < 10) {
                formattedPrice = price.toFixed(3);
            } else {
                formattedPrice = price.toFixed(2);
            }

            let formattedpricechange;
            if (pricechange > 0) {
                formattedpricechange = '+'+pricechange;
            } else if (pricechange < 0) {
                formattedpricechange = pricechange;
            }

            const formattedChangePercent = priceChangePercent.toFixed(2);

            if (formattedChangePercent < 0) {
                message.channel.send(`Current ${asset.toUpperCase()} Price: $${formattedPrice} | 24h Change: ${formattedChangePercent}% (${formattedpricechange}$)`);
            } else {
                message.channel.send(`Current ${asset.toUpperCase()} Price: $${formattedPrice} | 24h Change: +${formattedChangePercent}% (${formattedpricechange}$)`);
            }
        
        } catch (error) {
            console.error('Error fetching price:', error);
            message.channel.send('Failed to fetch price or price change. Please make sure the asset symbol is correct.');
        }
    }
});


client.login(process.env.DISCORD_TOKEN);