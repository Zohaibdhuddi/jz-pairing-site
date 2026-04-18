# JZ Developer V2 — Pairing Site

## Deploy on Koyeb (FREE - No Card Required!)

### Step 1: Get SESSION_ID
Run: node encode_session.js
Copy the output

### Step 2: Deploy on Koyeb
1. Go to: https://app.koyeb.com
2. Sign up FREE with GitHub (no card needed)
3. New App → GitHub → select jz-pairing-site repo
4. Settings:
   - Build: npm install
   - Run: node server.js
   - Port: 3000
5. Environment Variables → Add:
   - Name: SESSION_ID
   - Value: (your encoded session)
6. Deploy!

Your site: https://your-app.koyeb.app
