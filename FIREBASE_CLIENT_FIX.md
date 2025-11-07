# 🔥 Firebase Client Configuration Fix

Your React frontend is trying to connect to Firebase with an invalid API key.

## Error Explanation

```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

**What it means:** The `apiKey` in your client-side Firebase configuration is incorrect or expired.

## Quick Fix - Get Correct Firebase Web Config

### Step 1: Go to Firebase Console

Open: https://console.firebase.google.com/project/circuvent/settings/general

### Step 2: Find Your Web App Configuration

```
┌─────────────────────────────────────────────────────────────┐
│         FIREBASE CONSOLE NAVIGATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Project: circuvent                                      │
│     ⚙️ (Click Settings Icon)                                │
│        └──► Project settings                                │
│              │                                               │
│              └──► General Tab                               │
│                    │                                         │
│                    └──► Scroll to "Your apps" section       │
│                          │                                   │
│                          └──► Look for Web app (</> icon)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Copy Firebase SDK Configuration

You should see a section like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...YOUR_ACTUAL_API_KEY",
  authDomain: "circuvent.firebaseapp.com",
  projectId: "circuvent",
  storageBucket: "circuvent.firebasestorage.app",
  messagingSenderId: "743562898363",
  appId: "1:743562898363:web:...",
  measurementId: "G-..."
};
```

**Copy the entire config object!**

### Step 4: Update Client Configuration

**File to edit:** `client/src/config/firebase.js`

Replace the entire `firebaseConfig` object with the one from Firebase Console:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// PASTE YOUR CONFIG FROM FIREBASE CONSOLE HERE:
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_FROM_CONSOLE",
  authDomain: "circuvent.firebaseapp.com",
  databaseURL: "https://circuvent-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "circuvent",
  storageBucket: "circuvent.firebasestorage.app",
  messagingSenderId: "743562898363",
  appId: "YOUR_ACTUAL_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;
```

### Step 5: Save and Restart Frontend

The frontend should automatically reload. If not:

```powershell
# Stop the dev server (Ctrl+C)
# Then restart:
cd C:\Users\v-hbonthada\WorkSpace\Mail\client
npm run dev
```

## If You Don't Have a Web App Yet

If you don't see a Web app in Firebase Console:

### Create New Web App:

1. **Go to:** https://console.firebase.google.com/project/circuvent/settings/general

2. **Scroll down to "Your apps"**

3. **Click the `</>` icon** (Web app)

4. **Register app:**
   ```
   App nickname: Circuvent Mail Web
   ☐ Also set up Firebase Hosting (optional)
   ```

5. **Click "Register app"**

6. **Copy the configuration** that appears

7. **Click "Continue to console"**

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│              WHERE TO FIND WEB CONFIG                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Firebase Console → circuvent                               │
│    │                                                         │
│    └──► ⚙️ Project Settings                                 │
│          │                                                   │
│          └──► General Tab                                   │
│                │                                             │
│                └──► Scroll Down                             │
│                      │                                       │
│                      ▼                                       │
│            ┌─────────────────────────┐                      │
│            │    Your apps             │                      │
│            ├─────────────────────────┤                      │
│            │                          │                      │
│            │  Web Apps:               │                      │
│            │  ┌────────────────────┐ │                      │
│            │  │ </> Circuvent Mail │ │                      │
│            │  │                     │ │                      │
│            │  │ [SDK setup and...] │◄─── Click this        │
│            │  └────────────────────┘ │                      │
│            │                          │                      │
│            │  ┌──────────────────────────────┐             │
│            │  │  Firebase SDK snippet        │             │
│            │  │  ○ Config                    │◄── Select   │
│            │  │  ○ CDN                       │             │
│            │  │                               │             │
│            │  │  const firebaseConfig = {    │             │
│            │  │    apiKey: "AIza...",        │◄── Copy All │
│            │  │    authDomain: "...",        │             │
│            │  │    projectId: "circuvent",   │             │
│            │  │    ...                        │             │
│            │  │  };                           │             │
│            │  └──────────────────────────────┘             │
│            │                                  │             │
│            └──────────────────────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Alternative: Use Environment Variables

For better security, use environment variables:

### Step 1: Create `.env` file in client folder

**File:** `client/.env`

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=circuvent.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=circuvent
VITE_FIREBASE_STORAGE_BUCKET=circuvent.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=743562898363
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

### Step 2: Update `client/src/config/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: "https://circuvent-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

export default app;
```

### Step 3: Restart Vite

```powershell
# Vite must be restarted to load .env changes
cd client
npm run dev
```

## Testing After Fix

Once you've updated the config, open http://localhost:3000 in your browser.

**You should NOT see:**
- ❌ "API key not valid" errors
- ❌ 400 Bad Request errors

**You SHOULD see:**
- ✅ Login page loads correctly
- ✅ No Firebase errors in console
- ✅ Able to login with Firebase Auth

## Current vs Correct Configuration

```
┌─────────────────────────────────────────────────────────────┐
│              CONFIGURATION COMPARISON                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ Current (INVALID):                                      │
│  apiKey: "AIzaSyBM7vV6rfZ4n8a_c4Ku3zvfJ98psf0zO-M"         │
│  └──► This key is invalid/expired                          │
│                                                              │
│  ✅ Correct (FROM FIREBASE CONSOLE):                        │
│  apiKey: "AIza...get-from-firebase-console..."             │
│  └──► Copy exact key from Project Settings                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/circuvent
- **Project Settings:** https://console.firebase.google.com/project/circuvent/settings/general
- **Web App Config:** Scroll to "Your apps" → Web app → Config

---

**Next Step:** Get the correct API key from Firebase Console and update `client/src/config/firebase.js`! 🔑
