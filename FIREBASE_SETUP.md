# 🔑 Firebase Credentials Setup Guide

You need to get Firebase Admin SDK credentials to make the server work.

## 📋 Step-by-Step Instructions

### 1. Go to Firebase Console
Open: https://console.firebase.google.com/project/circuvent/settings/serviceaccounts/adminsdk

### 2. Generate Service Account Key

1. You'll see "Firebase Admin SDK" section
2. Click the **"Generate new private key"** button
3. A popup will appear - click **"Generate key"**
4. A JSON file will download (e.g., `circuvent-firebase-adminsdk-xxxxx.json`)

### 3. Open the Downloaded JSON File

The file will look like this:

```json
{
  "type": "service_account",
  "project_id": "circuvent",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40circuvent.iam.gserviceaccount.com"
}
```

### 4. Copy Values to server/.env

Open: `C:\Users\v-hbonthada\WorkSpace\Mail\server\.env`

Replace these lines:

```env
# FROM THE JSON FILE:
FIREBASE_PROJECT_ID=circuvent
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

**Copy exactly:**
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters!)

### 5. Also Update JWT Secret

Change this line to any random string:

```env
JWT_SECRET=your-own-random-string-here-make-it-long-and-secure-abc123xyz
```

### 6. Save the File

Save `server/.env` with your actual values.

---

## ⚡ Quick Alternative: Use Environment Variables Directly

If you don't want to edit the file, you can set them in PowerShell:

```powershell
# Set environment variables (replace with your actual values)
$env:FIREBASE_PROJECT_ID="circuvent"
$env:FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@circuvent.iam.gserviceaccount.com"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----`nYOUR_KEY_HERE`n-----END PRIVATE KEY-----`n"
$env:JWT_SECRET="my-secret-key-12345"

# Then run
npm run dev
```

---

## 🔒 Security Note

**NEVER commit the `.env` file or service account JSON to Git!**

The `.gitignore` file already excludes:
- `.env`
- `*.json` (service account files)

---

## ✅ Once Configured

After you've added the Firebase credentials, run:

```powershell
npm run dev
```

The server should start successfully! 🎉

---

## 🆘 Troubleshooting

### Error: "Service account object must contain a string 'project_id' property"
→ You need to add the Firebase credentials to `server/.env`

### Error: "Invalid service account certificate"
→ Make sure the private key includes the BEGIN/END markers and \n characters

### Error: "Permission denied"
→ Check Firebase Console → Settings → Service Accounts → ensure Admin SDK is enabled

---

**Next Step:** Follow the instructions above to get your Firebase credentials!
