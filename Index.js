require('dotenv').config();
const express = require('express');
const { initTelegramBot } = require('./services/telegram');
const { handleArxivRss } = require('./services/openclaw');

const app = express();
app.use(express.json());

// Initialize Telegram Bot
initTelegramBot();

// Webhook for Make.com to send ArXiv RSS feeds
app.post('/webhook/arxiv', async (req, res) => {
    try {
        console.log('Received ArXiv webhook from Make.com');
        const payload = req.body;
        // Delegate reasoning and action to the OpenClaw service
        await handleArxivRss(payload);
        res.status(200).send({ status: 'success', message: 'Processed ArXiv RSS update' });
    } catch (error) {
        console.error('Error processing ArXiv webhook:', error);
        res.status(500).send({ status: 'error', message: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`OpenClaw Agent runtime listening on port ${PORT}`);
});
