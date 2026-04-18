const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Bot's session directory - uses BOT's own creds.json
const BOT_SESSION_DIR = process.env.SESSION_DIR || path.join(__dirname, 'bot_session');

// Track pairing requests
const pairRequests = new Map();

// Global bot socket - stays connected
let botSock = null;
let botConnected = false;

// Decode SESSION_ID if provided as env variable
async function setupSession() {
    fs.mkdirSync(BOT_SESSION_DIR, { recursive: true });
    
    // If SESSION_ID env is set, decode and write creds.json
    const sessionId = process.env.SESSION_ID;
    if (sessionId) {
        try {
            const credsPath = path.join(BOT_SESSION_DIR, 'creds.json');
            if (!fs.existsSync(credsPath)) {
                // SESSION_ID is base64 encoded creds.json content
                const decoded = Buffer.from(sessionId, 'base64').toString('utf8');
                fs.writeFileSync(credsPath, decoded);
                console.log('✅ Session decoded from SESSION_ID');
            }
        } catch (err) {
            console.error('❌ Failed to decode SESSION_ID:', err.message);
        }
    }
}

async function startBot() {
    await setupSession();
    
    const { state, saveCreds } = await useMultiFileAuthState(BOT_SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    botSock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['JZ Developer V2', 'Chrome', '3.0.7'],
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false
    });

    botSock.ev.on('creds.update', saveCreds);

    botSock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            botConnected = true;
            console.log('✅ Bot connected to WhatsApp!');
        }
        if (connection === 'close') {
            botConnected = false;
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnecting...');
                setTimeout(startBot, 5000);
            } else {
                console.log('❌ Logged out. Please update SESSION_ID.');
            }
        }
    });
}

// Cooldown map
const cooldowns = new Map();

// POST /pair — generate code for user's number
app.post('/pair', async (req, res) => {
    if (!botConnected || !botSock) {
        return res.status(503).json({ error: 'Bot is not connected yet. Please wait and try again.' });
    }

    const { number } = req.body;
    if (!number || !/^\d{10,15}$/.test(number.replace(/[\s+\-]/g, ''))) {
        return res.status(400).json({ error: 'Invalid number. Include country code (e.g. 923001234567)' });
    }

    const cleanNum = number.replace(/[\s+\-]/g, '');

    // Cooldown check - 40 seconds per number
    const now = Date.now();
    const lastReq = cooldowns.get(cleanNum) || 0;
    if (now - lastReq < 40000) {
        const wait = Math.ceil((40000 - (now - lastReq)) / 1000);
        return res.status(429).json({ error: `Wait ${wait} seconds before trying again.` });
    }

    try {
        // Check if number is on WhatsApp
        const exists = await botSock.onWhatsApp(cleanNum + '@s.whatsapp.net');
        if (!exists || !exists[0]?.exists) {
            return res.status(400).json({ error: `+${cleanNum} is not registered on WhatsApp!` });
        }

        cooldowns.set(cleanNum, now);

        // Generate pairing code using bot's connected socket
        const code = await botSock.requestPairingCode(cleanNum);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        // Auto-clear cooldown after 2 min
        setTimeout(() => cooldowns.delete(cleanNum), 120000);

        res.json({ code: formatted, number: cleanNum });

    } catch (err) {
        cooldowns.delete(cleanNum);
        console.error('Pair error:', err.message);

        let msg = 'Failed to generate code. Try again.';
        if (err.message?.includes('rate-overlimit')) msg = 'WhatsApp rate limit hit. Wait 1 minute.';
        else if (err.message?.includes('not-authorized')) msg = 'Number not authorized on WhatsApp.';

        res.status(500).json({ error: msg });
    }
});

// GET /health
app.get('/health', (req, res) => {
    res.json({ connected: botConnected, status: botConnected ? 'online' : 'offline' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start bot then server
startBot().then(() => {
    app.listen(PORT, () => console.log(`✅ JZ Pairing Site running on port ${PORT}`));
}).catch(err => {
    console.error('Failed to start:', err);
    app.listen(PORT, () => console.log(`✅ Server running (bot offline) on port ${PORT}`));
});
