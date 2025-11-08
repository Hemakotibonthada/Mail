# Multi-Domain SMTP Configuration Guide

## Problem
Your email system was sending all emails from `hema@htresearchlab.com` regardless of the actual user's email address. This defeats the purpose of a multi-user email system.

## Solution
The email service now uses **domain-specific SMTP configurations**. Each user's email will be sent using their own domain's SMTP server.

---

## Current Users by Domain

### htresearchlab.com
- hema@htresearchlab.com ✅ (Already configured)

### ai.com
- hemakoti@ai.com
- hemanaidu@ai.com  
- hema@ai.com

### circuvent.com
- admin@circuvent.com
- superadmin@circuvent.com

### Other (Gmail, etc.)
- Multiple @gmail.com users
- These need to use app-specific passwords

---

## SMTP Configuration Steps

### Option 1: Add ai.com Domain to GoDaddy (RECOMMENDED)

1. **Add ai.com domain to your GoDaddy account**
   - Go to GoDaddy Domain Management
   - Add ai.com as a domain
   - Set up MX records for ai.com

2. **Create email accounts**
   - Create mailboxes: hemakoti@ai.com, hemanaidu@ai.com, hema@ai.com
   - Set passwords for each

3. **Update .env file**
   ```bash
   # AI.com Domain SMTP Configuration
   SMTP_HOST_AI=smtpout.secureserver.net
   SMTP_PORT_AI=587
   SMTP_USER_AI=hemakoti@ai.com
   SMTP_PASS_AI=your_password_here
   ```

### Option 2: Use Existing ai.com Email Provider

If ai.com emails already exist with another provider:

1. **Get SMTP credentials from ai.com email provider**
   - SMTP Host (e.g., smtp.ai.com)
   - Port (usually 587 or 465)
   - Authentication credentials

2. **Update .env file**
   ```bash
   # AI.com Domain SMTP Configuration  
   SMTP_HOST_AI=smtp.ai.com
   SMTP_PORT_AI=587
   SMTP_USER_AI=hemakoti@ai.com
   SMTP_PASS_AI=actual_password
   ```

### Option 3: Use a Relay Service (RECOMMENDED FOR PRODUCTION)

Use services like SendGrid, Amazon SES, or Mailgun that support multi-domain sending:

1. **Sign up for SendGrid/Amazon SES**
2. **Verify all your domains** (htresearchlab.com, ai.com, circuvent.com)
3. **Get API credentials**
4. **Update email service** to use the relay service

---

## Environment Variables Required

Add these to your `.env` file:

```bash
# Primary domain (htresearchlab.com) - Already configured
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=hema@htresearchlab.com
SMTP_PASS=Lucifer@003

# AI.com domain - ADD THESE
SMTP_HOST_AI=smtpout.secureserver.net
SMTP_PORT_AI=587
SMTP_USER_AI=hemakoti@ai.com
SMTP_PASS_AI=YOUR_AI_COM_PASSWORD_HERE

# Circuvent.com domain - ADD THESE
SMTP_HOST_CIRCUVENT=smtpout.secureserver.net
SMTP_PORT_CIRCUVENT=587
SMTP_USER_CIRCUVENT=admin@circuvent.com
SMTP_PASS_CIRCUVENT=YOUR_CIRCUVENT_PASSWORD_HERE
```

---

## Testing Each Domain

After configuration, test sending from each domain:

```bash
# Test htresearchlab.com
node server/scripts/testEmailSend.js hema@htresearchlab.com

# Test ai.com (will fail until configured)
node server/scripts/testEmailSend.js hemakoti@ai.com

# Test circuvent.com (will fail until configured)
node server/scripts/testEmailSend.js admin@circuvent.com
```

---

## Important Notes

⚠️ **SMTP Authentication Requirements:**
- You CANNOT send from `@ai.com` using `@htresearchlab.com` SMTP credentials
- Each domain needs its own authenticated SMTP connection
- This is an anti-spoofing security measure by email providers

✅ **What's Fixed:**
- Email service now uses correct sender email (user's actual email)
- System selects appropriate SMTP server based on sender domain
- Better error messages when domain SMTP is not configured

❌ **What Still Needs Setup:**
- ai.com SMTP credentials (Option 1 or 2 above)
- circuvent.com SMTP credentials
- Gmail users need app-specific passwords

---

## Quick Fix for Testing

If you want to test RIGHT NOW without setting up all domains:

**Temporarily update all users to use htresearchlab.com domain:**

```javascript
// Run this in server directory
node -e "
import('./config/firebase.js').then(async ({db}) => {
  const users = await db.collection('users').get();
  for (const doc of users.docs) {
    const data = doc.data();
    if (data.email && !data.email.includes('@htresearchlab.com')) {
      const newEmail = data.email.split('@')[0] + '@htresearchlab.com';
      await db.collection('users').doc(doc.id).update({
        email: newEmail,
        domain: 'htresearchlab.com'
      });
      console.log('Updated:', data.email, '->', newEmail);
    }
  }
  console.log('✅ Done');
  process.exit(0);
});
"
```

Then create those email accounts in GoDaddy for htresearchlab.com.
