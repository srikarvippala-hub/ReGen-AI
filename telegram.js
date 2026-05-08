const TelegramBot = require('node-telegram-bot-api');
const { handleTelegramCommand } = require('./openclaw');

let bot;

function initTelegramBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token === 'your_telegram_bot_token') {
        console.warn('Telegram Bot Token not configured. Skipping Telegram initialization.');
        return;
    }

    bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/(.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const command = match[1];

        console.log(`Received Telegram command: ${command}`);
        const response = await handleTelegramCommand(command, msg);
        
        bot.sendMessage(chatId, response);
    });

    console.log('Telegram Bot initialized.');
}

function sendTelegramAlert(message) {
    // Requires a known chat ID, which you would typically store after a user interacts with the bot
    console.log(`[Telegram Alert Simulation]: ${message}`);
}

module.exports = { initTelegramBot, sendTelegramAlert };
