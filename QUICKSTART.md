# 🚀 Quick Start Guide - Circuvent Mail

Get your self-hosted email system running in 30 minutes!

## Step 1: Get Firebase Admin Credentials (5 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **"circuvent"** project
3. Click ⚙️ Settings > **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the downloaded JSON file

## Step 2: Install Dependencies (5 min)

```powershell
# Navigate to project
cd c:\Users\v-hbonthada\WorkSpace\Mail

# Install all dependencies
npm install
cd server
npm install
cd ../client
npm install
cd ..
```

## Step 3: Configure Environment (5 min)

Create `server/.env` file:

```env
# Copy from Firebase Admin SDK JSON
FIREBASE_PROJECT_ID=circuvent
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Server Settings
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-random-string-here-change-this

# Email Server
SMTP_HOST=smtp.circuvent.com
SMTP_PORT=587
SMTP_SECURE=false

# Domains
PRIMARY_DOMAIN=circuvent.com
SECONDARY_DOMAIN=htresearchlab.com
ALLOWED_DOMAINS=circuvent.com,htresearchlab.com

# First Admin Account
ADMIN_EMAIL=admin@circuvent.com
ADMIN_PASSWORD=ChangeThisPassword123

# Limits
MAX_ATTACHMENT_SIZE=26214400
MAX_EMAILS_PER_HOUR=100
MAX_EMAILS_PER_DAY=500
```

**Replace:**
- `FIREBASE_CLIENT_EMAIL` - from Firebase JSON
- `FIREBASE_PRIVATE_KEY` - from Firebase JSON (keep the quotes and \n)
- `JWT_SECRET` - generate random string
- `ADMIN_PASSWORD` - your secure password

## Step 4: Deploy Firebase Security Rules (5 min)

```powershell
# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Step 5: Create First Admin User (5 min)

### Option A: Via Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **circuvent** project
3. Go to **Authentication** > **Users**
4. Click **Add User**
5. Enter:
   - Email: `admin@circuvent.com`
   - Password: (same as in .env)
6. Click **Add User**

### Option B: Via Firebase CLI

```powershell
# Create user
firebase auth:export users.json
# Edit users.json to add user with customClaims: {"role": "admin"}
firebase auth:import users.json
```

## Step 6: Start the Application (2 min)

```powershell
# From project root
npm run dev
```

This starts:
- ✅ React Client: http://localhost:3000
- ✅ Express API: http://localhost:3001
- ✅ SMTP Server: localhost:2525

## Step 7: Login and Test (3 min)

1. Open browser: **http://localhost:3000**
2. Login with:
   - Email: `admin@circuvent.com`
   - Password: (your admin password)
3. Click **"Admin Panel"**
4. Click **"Add Employee"**
5. Create test employee:
   - Username: `john.doe`
   - Domain: `@circuvent.com`
   - Display Name: `John Doe`
   - Password: `Test123456`
   - Role: `Employee`
6. Click **"Create Employee"**
7. Logout and login as: `john.doe@circuvent.com`
8. Click **"Compose"**
9. Send test email to yourself

## ✅ You're Done!

Your email system is now running locally.

## Next Steps

### For Development/Testing
- Create more employees
- Test sending emails between internal users
- Try composing emails with attachments
- Test folder management

### For Production (See SETUP_GUIDE.md)
1. **Configure DNS Records** (CRITICAL for external email)
   - MX records
   - SPF, DKIM, DMARC
   - See DNS_SETUP.md

2. **Get SSL Certificate**
   ```bash
   sudo certbot --nginx -d mail.htresearchlab.com
   ```

3. **Deploy Backend**
   - Google Cloud Run
   - AWS EC2
   - Or any VPS

4. **Build and Deploy Frontend**
   ```bash
   cd client
   npm run build
   firebase deploy --only hosting
   ```

## Common Commands

```powershell
# Start development
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
cd client
npm run build

# Deploy to Firebase
firebase deploy

# View logs
# Server logs will appear in terminal
# Check Firebase Console for database logs
```

## Troubleshooting

### "Firebase Admin SDK error"
- Check `FIREBASE_PRIVATE_KEY` has proper newlines (\n)
- Verify `FIREBASE_CLIENT_EMAIL` is correct
- Ensure Firebase project ID matches

### "Cannot find module"
- Run `npm install` in root, server, and client directories
- Delete node_modules and reinstall

### "Port already in use"
- Change PORT in server/.env
- Kill process using the port:
  ```powershell
  netstat -ano | findstr :3001
  taskkill /PID <process_id> /F
  ```

### "Authentication failed"
- Verify admin user exists in Firebase Console
- Check password matches .env file
- Clear browser cache and try again

### "Emails not sending"
- For local testing, emails won't reach external domains
- Configure DNS records for production (see DNS_SETUP.md)
- Check SMTP server is running (should see log on startup)

## Quick Reference

### Default Login
- Admin: `admin@circuvent.com` / (your password)

### Ports
- Client: 3000
- API: 3001
- SMTP: 2525

### Key Folders
- `client/` - React frontend
- `server/` - Express backend
- `server/.env` - Configuration
- `firestore.rules` - Security rules

### Important Files
- `SETUP_GUIDE.md` - Full setup documentation
- `DNS_SETUP.md` - DNS configuration guide
- `server/.env.example` - Environment template

## Support

Need help?
1. Check `SETUP_GUIDE.md` for detailed instructions
2. Check `DNS_SETUP.md` for email delivery setup
3. Review Firebase Console for errors
4. Check terminal logs for error messages

## What's Working Now

✅ User authentication  
✅ Admin panel  
✅ Employee creation  
✅ Email composition  
✅ Email storage  
✅ File attachments  
✅ Folder management  
✅ Internal email delivery  

## What Needs DNS Configuration

❌ Send to external domains (Gmail, Yahoo, etc.)  
❌ Receive from external domains  
❌ Email deliverability  
❌ SPF/DKIM/DMARC validation  

**To enable external email:** Follow DNS_SETUP.md

---

🎉 **Congratulations!** Your self-hosted email system is running!

For production deployment, see **SETUP_GUIDE.md**
