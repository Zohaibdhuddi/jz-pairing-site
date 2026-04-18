/**
 * JZ Developer V2 — Session Encoder
 * Run: node encode_session.js
 * Paste your creds.json content when asked
 */
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n╔══════════════════════════════════╗');
console.log('║  JZ Developer V2 - Session Tool  ║');
console.log('╚══════════════════════════════════╝\n');
console.log('Paste the FULL path to your creds.json file:');
console.log('Example: ./session/creds.json\n');

rl.question('Path: ', (filePath) => {
    const trimmed = filePath.trim().replace(/['"]/g, '');
    if (!fs.existsSync(trimmed)) {
        console.log('\n❌ File not found: ' + trimmed);
        rl.close();
        return;
    }
    const content = fs.readFileSync(trimmed, 'utf8');
    const encoded = Buffer.from(content).toString('base64');
    console.log('\n✅ YOUR SESSION_ID:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(encoded);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nCopy this and paste it in Render.com → Environment Variables → SESSION_ID\n');
    rl.close();
});
