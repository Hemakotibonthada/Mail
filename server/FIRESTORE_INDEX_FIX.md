# Firestore Index Setup Instructions

## Problem
Emails are being sent successfully but not loading in inbox/sent folders.

## Root Cause
Missing Firestore composite index for the query:
```javascript
.where('folder', '==', folder)
.where('userId', '==', userId)
.orderBy('createdAt', 'desc')
```

## Solution

### Create the Firestore Index

**Option 1: Auto-generated Link (Fastest)**

Click this link to auto-create the index:
https://console.firebase.google.com/v1/r/project/circuvent/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9jaXJjdXZlbnQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2VtYWlscy9pbmRleGVzL18QARoKCgZmb2xkZXIQARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXhAC

**Option 2: Manual Creation**

1. Go to: https://console.firebase.google.com/project/circuvent/firestore/indexes
2. Click "Create Index"
3. Collection: `emails`
4. Add fields:
   - Field: `folder`, Order: `Ascending`
   - Field: `userId`, Order: `Ascending`
   - Field: `createdAt`, Order: `Descending`
5. Click "Create Index"

**Option 3: Using Firebase CLI**

```bash
cd server
firebase deploy --only firestore:indexes
```

This uses the `firestore.indexes.json` file already in the server directory.

## Timeline
- Index creation: 2-5 minutes
- Once complete, all folders will load emails immediately

## Verification

After index is created, test:
1. Go to Inbox → Should show received emails
2. Go to Sent → Should show sent emails (currently has 9 emails)
3. All folders should load without errors

## Current Status
✅ Sending emails: Working
✅ Saving to Firestore: Working
❌ Loading emails: Blocked by missing index
✅ Fix implemented: Enhanced logging and timestamp conversion
⏳ Waiting for: Firestore index creation

## Users with Sent Emails
- cjzO8DN2O8awl9OGIlC6TALifhl1: 2 emails
- eWPy13lflEOdcxJSSp5uWCUbjxg2: 3 emails
- dTIBBLyxwnSavSsaO6HNqBd4znx1: 2 emails
- EzcJtlKPCRZ6CgrkU43riXnDGIz2: 1 email
- uz2pgO5PHZfVONWlmstKWzFdNUv1: 1 email

Total: 9 sent emails ready to display once index is active.
