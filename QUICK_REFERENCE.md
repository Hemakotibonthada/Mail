# ⚡ Quick Reference - Your Email System Setup

**Date:** November 7, 2025  
**Your Public IP:** 122.172.133.189  
**Domain:** htresearchlab.com (GoDaddy)  
**Primary Email:** hema@htresearchlab.com

---

## ✅ What You Already Have

✅ **Domain:** htresearchlab.com (registered with GoDaddy)  
✅ **Email Account:** hema@htresearchlab.com (active on GoDaddy)  
✅ **MX Record:** mail.htresearchlab.com (Priority: 10) - **ALREADY CONFIGURED**  
✅ **GoDaddy SMTP:** smtpout.secureserver.net:587  
✅ **GoDaddy IMAP:** imap.secureserver.net:993  

---

## 🎯 Two Setup Options

### Option 1: Use Your Existing GoDaddy Email (RECOMMENDED - Easiest)

**What happens:**
- You keep using GoDaddy's email servers (already working)
- Your custom app becomes a beautiful frontend interface
- Emails sync from GoDaddy every 2 minutes
- No DNS changes needed!

**Follow this guide:** `GODADDY_INTEGRATION.md`

✅ **Pros:**
- Setup in 10 minutes
- No DNS configuration needed
- Email works immediately
- Reliable delivery (GoDaddy infrastructure)

❌ **Cons:**
- Depends on GoDaddy service
- 2-minute delay for incoming emails
- Need GoDaddy subscription

---

### Option 2: Run Your Own Mail Server (Advanced)

**What happens:**
- Your server becomes the actual mail server
- Full control over everything
- No dependency on GoDaddy

**Follow this guide:** `GODADDY_DNS_SETUP.md`

**DNS Records to Add:**

```
Type    Name                Value                               Priority  TTL
────────────────────────────────────────────────────────────────────────────
A       mail                122.172.133.189                     -         1 Hour
TXT     @                   v=spf1 mx a ip4:122.172.133.189 ~all  -       1 Hour
TXT     default._domainkey  v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY   -         1 Hour
TXT     _dmarc              v=DMARC1; p=quarantine;              -         1 Hour
```

✅ **Pros:**
- Full control
- No ongoing GoDaddy email costs
- Instant email receipt

❌ **Cons:**
- More complex setup
- Need server with static IP
- DNS propagation takes 24-48 hours
- You manage deliverability

---

## 🚀 Recommended: Start with Option 1

Start with **Option 1 (GoDaddy Integration)** because:
1. ✅ Works immediately (no DNS wait)
2. ✅ Simpler to test and debug
3. ✅ Uses proven infrastructure
4. ✅ Can switch to Option 2 later

---

## 📝 Step-by-Step: Getting Started (Option 1)

### 1️⃣ Configure Firebase

**Get your Firebase credentials:**
1. Go to: https://console.firebase.google.com/project/circuvent
2. Click ⚙️ → Project Settings → Service Accounts
3. Click "Generate new private key"
4. Download the JSON file

**Update `server/.env`:**
```env
FIREBASE_PROJECT_ID=circuvent
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 2️⃣ Deploy Firebase Rules

```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 3️⃣ Start the Servers

**Terminal 1 - Backend:**
```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail\server
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail\client
npm run dev
```

### 4️⃣ Access Your Email System

Open browser: **http://localhost:5173**

**First login:**
- Email: hema@htresearchlab.com
- Password: (create admin account in Firebase Console first)

### 5️⃣ Create Admin User in Firebase

1. Go to: https://console.firebase.google.com/project/circuvent/authentication/users
2. Click "Add user"
3. Email: hema@htresearchlab.com
4. Password: (your choice)
5. Click "Add user"

Now you can login to your app!

---

## 🧪 Testing

### Test Sending:
1. Login to http://localhost:5173
2. Click "Compose"
3. Send to your personal Gmail
4. Check if it arrives (check spam folder)

### Test Receiving:
1. Send email FROM Gmail TO hema@htresearchlab.com
2. Wait 2 minutes (IMAP sync)
3. Check inbox in your app
4. Email should appear

---

## 📁 File Structure

```
C:\Users\v-hbonthada\WorkSpace\Mail\
├── server/
│   ├── .env                    ← Configure this!
│   ├── index.js                ← Main server
│   ├── services/
│   │   ├── emailService.js     ← Send emails
│   │   ├── imapService.js      ← Fetch from GoDaddy
│   │   └── userService.js      ← Manage employees
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/              ← Email UI
│   │   └── services/api.js
│   └── package.json
├── GODADDY_INTEGRATION.md      ← Read this for Option 1
├── GODADDY_DNS_SETUP.md        ← Read this for Option 2
└── QUICK_REFERENCE.md          ← This file!
```

---

## 🔧 Your Current Configuration

**Already in `server/.env`:**
```env
# SMTP (Sending via GoDaddy)
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=hema@htresearchlab.com
SMTP_PASS=Lucifer@003

# IMAP (Receiving from GoDaddy)
IMAP_HOST=imap.secureserver.net
IMAP_PORT=993
IMAP_USER=hema@htresearchlab.com
IMAP_PASS=Lucifer@003

# Domain
PRIMARY_DOMAIN=htresearchlab.com
SECONDARY_DOMAIN=circuvent.com
```

**Still need to add:**
- ✅ Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- ✅ JWT_SECRET (any random string)
- ✅ ADMIN_PASSWORD (for admin account)

---

## 🆘 Quick Troubleshooting

### "Cannot connect to Firebase"
→ Add Firebase credentials to `server/.env`

### "IMAP connection failed"
→ Check password for hema@htresearchlab.com in GoDaddy

### "Cannot send email"
→ Verify SMTP credentials are correct

### "Port 3001 already in use"
→ Kill process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process`

### "npm install failed"
→ Already fixed! Dependencies installed with `--ignore-scripts`

---

## 📚 Full Documentation

- **GODADDY_INTEGRATION.md** - Using existing GoDaddy email (RECOMMENDED)
- **GODADDY_DNS_SETUP.md** - Running your own mail server
- **SETUP_GUIDE.md** - Complete setup guide
- **API_REFERENCE.md** - All API endpoints
- **QUICKSTART.md** - 30-minute quick start

---

## ✅ Next Actions

1. ✅ **npm install** - DONE ✓
2. ⏩ **Add Firebase credentials** to `server/.env`
3. ⏩ **Deploy Firebase rules** (`firebase deploy`)
4. ⏩ **Create admin user** in Firebase Console
5. ⏩ **Start servers** (`npm start` + `npm run dev`)
6. ⏩ **Test email flow** (send + receive)

---

**Status:** Ready to configure Firebase and start testing!  
**Recommended Next Step:** Follow `GODADDY_INTEGRATION.md` for easiest setup  
**Your IP:** 122.172.133.189 (use this if running your own mail server)
