# JZ Developer V2 — Pairing Site

No downloads needed. Users just enter number → get code → enter in WhatsApp → bot connected!

## Deploy on Render.com (FREE)

### Step 1: Get your SESSION_ID
On your computer/Katabump, find your bot's creds.json file.
Run: `node encode_session.js creds.json`
Copy the output — this is your SESSION_ID.

### Step 2: Push to GitHub
Create new GitHub repo "jz-pairing-site"
Upload all these files.

### Step 3: Deploy on Render.com
1. render.com → New → Web Service
2. Connect your GitHub repo
3. Build: npm install
4. Start: node server.js
5. Add Environment Variable:
   - Key: SESSION_ID
   - Value: (paste your encoded session)
6. Plan: Free → Deploy!

### Step 4: Done!
Your pairing site is live at: https://your-app.onrender.com

Users visit → enter number → get 8-digit code → enter in WhatsApp Linked Devices → bot runs on their WhatsApp!
