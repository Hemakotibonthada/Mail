# Using Existing GoDaddy Email with Your Custom Email Client

Since you already have email hosting with GoDaddy (hema@htresearchlab.com), this guide shows how to use your custom email client as a frontend while leveraging GoDaddy's infrastructure.

## 🎯 What This Setup Does

Your custom email system will:
- ✅ **Send emails** through GoDaddy's SMTP server (smtpout.secureserver.net)
- ✅ **Receive emails** by fetching from GoDaddy's IMAP server (imap.secureserver.net)
- ✅ **Store emails** in your Firebase Firestore database
- ✅ **Provide modern UI** with React frontend
- ✅ **Work with external domains** (Gmail, Outlook, etc.)

**Your existing MX record stays the same** - emails arrive at GoDaddy first, then get synced to your app.

## 📋 Prerequisites

✅ You already have:
- GoDaddy domain: htresearchlab.com
- GoDaddy email account: hema@htresearchlab.com
- MX record configured: mail.htresearchlab.com (Priority: 10)

## 🔧 Step 1: Configure Environment Variables

Your `.env` file is already set up with your GoDaddy credentials:

**File:** `server/.env`

```env
# Firebase Configuration (Get from Firebase Console)
FIREBASE_PROJECT_ID=circuvent
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMTP Configuration (for sending emails via GoDaddy)
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hema@htresearchlab.com
SMTP_PASS=Lucifer@003

# Email From Configuration
EMAIL_FROM=no-reply@htresearchlab.com
EMAIL_REPLY_TO=hema@htresearchlab.com

# Domain Configuration
PRIMARY_DOMAIN=htresearchlab.com
SECONDARY_DOMAIN=circuvent.com
ALLOWED_DOMAINS=htresearchlab.com,circuvent.com

# IMAP Configuration (for receiving emails from GoDaddy)
IMAP_HOST=imap.secureserver.net
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=hema@htresearchlab.com
IMAP_PASS=Lucifer@003

# Admin Configuration
ADMIN_EMAIL=hema@htresearchlab.com
ADMIN_PASSWORD=change-this-password

# Email Storage
MAX_ATTACHMENT_SIZE=26214400
# 25MB in bytes

# Rate Limiting
MAX_EMAILS_PER_HOUR=100
MAX_EMAILS_PER_DAY=500
```

### 🔑 Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **circuvent**
3. Click ⚙️ (Settings) → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Copy the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n newlines)

## 🚀 Step 2: Start the Email System

### Terminal 1 - Backend Server:
```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail\server
npm start
```

**You should see:**
```
🚀 Circuvent Mail API Server running on port 3001
📍 Environment: development
📧 SMTP Server listening on port 2525
📡 Starting IMAP email sync...
✅ IMAP connection established
📬 Checking for new emails...
```

### Terminal 2 - Frontend Client:
```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail\client
npm run dev
```

**Open browser:** http://localhost:5173

## 📬 How Email Flow Works

### Sending Email (htresearchlab.com → Gmail):

```
Your App (Compose) 
    ↓
Node.js Backend (Nodemailer)
    ↓
GoDaddy SMTP (smtpout.secureserver.net:587)
    ↓
Gmail Inbox ✅
```

### Receiving Email (Gmail → htresearchlab.com):

```
Gmail sends email to hema@htresearchlab.com
    ↓
GoDaddy Mail Server (via MX record)
    ↓
Stored in GoDaddy mailbox
    ↓
IMAP Service fetches every 2 minutes
    ↓
Stored in Firebase Firestore
    ↓
Appears in Your App Inbox ✅
```

## 🧪 Testing the System

### 1. Test Sending Email

1. Open http://localhost:5173
2. Login with: hema@htresearchlab.com / your-password
3. Click "Compose" → New Email
4. Send to your personal Gmail
5. Check Gmail inbox (may take 1-2 minutes)

### 2. Test Receiving Email

1. From your Gmail, send email to: hema@htresearchlab.com
2. Wait 2 minutes (IMAP sync interval)
3. Refresh your app inbox
4. Email should appear in inbox

### 3. Check Email Delivery Score

Visit: https://www.mail-tester.com
- Copy the test email address
- Send from your app
- View deliverability score (aim for 8+/10)

## 📊 Firebase Data Structure

Your emails are stored in Firestore:

```
users/
  └── {userId}/
      └── emails/
          └── {emailId}/
              - from: "sender@gmail.com"
              - to: ["hema@htresearchlab.com"]
              - subject: "Email subject"
              - body: "HTML content"
              - folder: "inbox"
              - isRead: false
              - receivedAt: timestamp
              - attachments: []
```

## 🔐 Security Considerations

### Current Setup (Development):
- ⚠️ Passwords in `.env` file (not in Git)
- ⚠️ SMTP on port 2525 (testing only)
- ⚠️ No SSL/TLS encryption

### For Production:

1. **Use Environment Variables (not .env file):**
   ```bash
   # In your hosting provider (Heroku/AWS/etc)
   Set SMTP_USER, SMTP_PASS as environment variables
   ```

2. **Enable SSL/TLS:**
   ```env
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

3. **Use App Passwords:**
   - GoDaddy → Email Settings → App Passwords
   - Generate app-specific password
   - Use instead of main password

4. **Enable 2FA on GoDaddy account**

## 🆕 Creating Additional Employee Email Accounts

Since you already have GoDaddy email hosting, you can:

### Option A: Add emails in GoDaddy (Recommended)
1. Log in to GoDaddy
2. Go to **Email & Office** → Workspace Email
3. Click **Add Email Account**
4. Create: employee@htresearchlab.com
5. Add credentials to your app (see Step 3 below)

### Option B: Use Email Aliases
1. GoDaddy Workspace → Email Settings
2. Add alias: sales@htresearchlab.com → hema@htresearchlab.com
3. All emails sent to alias arrive in main inbox

### Option C: Forward to Main Account
1. Create forwarding rules in GoDaddy
2. Forward: support@htresearchlab.com → hema@htresearchlab.com
3. Manage all in one inbox

## 🔄 Managing Multiple Email Accounts

If you create multiple GoDaddy email accounts:

**Update `server/.env`:**
```env
# Primary account (for sending)
SMTP_USER=hema@htresearchlab.com
SMTP_PASS=password1

# Additional accounts (for receiving)
IMAP_ACCOUNTS=[
  {"email":"hema@htresearchlab.com","password":"password1"},
  {"email":"support@htresearchlab.com","password":"password2"},
  {"email":"sales@htresearchlab.com","password":"password3"}
]
```

Then modify `imapService.js` to loop through accounts.

## 📈 Monitoring & Logs

### Check Email Sync Status:
```bash
# View server logs
cd server
npm start

# Look for:
📬 Found X new emails
✅ Email stored: [Subject]
```

### Check IMAP Connection:
```bash
# Test IMAP manually
telnet imap.secureserver.net 993
```

### Check SMTP Connection:
```bash
# Test SMTP manually
telnet smtpout.secureserver.net 587
```

## 🐛 Troubleshooting

### Problem: "IMAP connection error: Invalid credentials"

**Solution:**
1. Verify password in `.env` file
2. Check GoDaddy email settings
3. Try generating App Password in GoDaddy

### Problem: "No new emails" but Gmail sent email

**Solutions:**
1. Check GoDaddy webmail - is email there?
2. Wait 2 minutes for IMAP sync
3. Check spam folder in GoDaddy
4. Verify MX record: `nslookup -type=MX htresearchlab.com`

### Problem: Sent emails go to spam

**Solutions:**
1. Add SPF record (see GODADDY_DNS_SETUP.md)
2. Add DKIM record
3. Warm up IP (send gradually)
4. Use proper From address (hema@htresearchlab.com)

### Problem: IMAP fetches too many emails

**Solution:**
Modify `imapService.js`:
```javascript
// Fetch only last 24 hours
this.imap.search(['UNSEEN', ['SINCE', yesterday]], ...)
```

### Problem: Attachments not downloading

**Solution:**
1. Check Firebase Storage rules
2. Verify storage bucket permissions
3. Check MAX_ATTACHMENT_SIZE in .env

## 🎓 Understanding the Architecture

```
┌─────────────────┐
│  React Client   │  (http://localhost:5173)
│  (Port 5173)    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Node.js API    │  (http://localhost:3001)
│  (Port 3001)    │
└─┬───────────┬───┘
  │           │
  │           └─────→ Firebase (Firestore + Storage)
  │
  ├──→ SMTP Client (Nodemailer)
  │      ↓
  │    GoDaddy SMTP (smtpout.secureserver.net:587)
  │      ↓
  │    External Recipients (Gmail, etc.)
  │
  └──→ IMAP Client (node-imap)
         ↓
       GoDaddy IMAP (imap.secureserver.net:993)
         ↓
       Fetch emails every 2 minutes
```

## 📚 Next Steps

✅ System configured with GoDaddy  
✅ Email sending/receiving works  
✅ Frontend accessible at localhost:5173  

**What's Next:**
1. **Create admin user** in Firebase Console
2. **Test full email flow** (send + receive)
3. **Add employee accounts** in Admin Panel
4. **Deploy to production** (see DEPLOYMENT.md)
5. **Set up monitoring** (email logs, error tracking)

## 🔗 Related Documentation

- **GODADDY_DNS_SETUP.md** - Configure custom domain (if not using existing setup)
- **SETUP_GUIDE.md** - Complete installation guide
- **API_REFERENCE.md** - Backend API documentation
- **QUICKSTART.md** - 30-minute quick setup

---

**Current Setup:** Using GoDaddy's email infrastructure with custom frontend  
**Email Account:** hema@htresearchlab.com  
**Hosting:** GoDaddy (SMTP + IMAP)  
**Storage:** Firebase Firestore + Storage
