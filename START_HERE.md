# 🚀 Quick Start Without Firebase (Testing Mode)

If you want to test the email system **without setting up Firebase credentials**, follow these steps:

## Option 1: Test Frontend Only (No Backend)

The frontend can run independently to see the UI:

```powershell
cd C:\Users\v-hbonthada\WorkSpace\Mail\client
npm run dev
```

Open: http://localhost:5173

You'll see the login page and UI, but can't send/receive emails yet.

---

## Option 2: Get Firebase Credentials (Required for Full System)

To actually send/receive emails, you MUST configure Firebase:

### Quick Steps:

1. **Open this link:** https://console.firebase.google.com/project/circuvent/settings/serviceaccounts/adminsdk

2. **Click "Generate new private key"** → Download JSON file

3. **Open the downloaded JSON file** in Notepad

4. **Copy these 3 values to `server\.env`:**
   - `project_id` → Line 2: `FIREBASE_PROJECT_ID=circuvent`
   - `client_email` → Line 3: `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com`
   - `private_key` → Line 4: `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your key...\n-----END PRIVATE KEY-----\n"`

5. **Change JWT secret** on Line 11:
   ```env
   JWT_SECRET=my-random-secret-key-12345
   ```

6. **Save the file** and run:
   ```powershell
   npm run dev
   ```

---

## Current Error Explained

```
FirebaseAppError: Service account object must contain a string "project_id" property.
```

**What it means:**  
The server is trying to connect to Firebase but can't find your credentials.

**Why it happens:**  
Your `server\.env` file has placeholder values:
- `FIREBASE_CLIENT_EMAIL=your-firebase-admin-email@circuvent.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"`

These are NOT real credentials - they're placeholders!

**How to fix:**  
Replace them with actual values from Firebase Console (see Option 2 above).

---

## 📁 What You Need to Edit

**File:** `C:\Users\v-hbonthada\WorkSpace\Mail\server\.env`

**Lines to change:**
```env
FIREBASE_PROJECT_ID=circuvent  ← Should already be correct
FIREBASE_CLIENT_EMAIL=your-firebase-admin-email@circuvent.iam.gserviceaccount.com  ← CHANGE THIS
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"  ← CHANGE THIS
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production  ← CHANGE THIS
```

---

## ✅ After Configuration

Once you've updated the `.env` file, run:

```powershell
npm run dev
```

**You should see:**
```
🚀 Circuvent Mail API Server running on port 3001
📍 Environment: development
📧 SMTP Server listening on port 2525
📡 Starting IMAP email sync...
✅ IMAP connection established
```

**Then open:** http://localhost:5173

---

## 🔗 More Help

- **FIREBASE_SETUP.md** - Detailed Firebase setup guide
- **GODADDY_INTEGRATION.md** - Complete email system setup
- **QUICK_REFERENCE.md** - Quick reference card

---

**Next Step:** Get Firebase credentials from console.firebase.google.com!
