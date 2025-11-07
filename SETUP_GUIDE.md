# Circuvent Mail - Self-Hosted Email System

A complete, self-hosted email solution for organizations with custom domains (@circuvent.com, @htresearchlab.com).

## 🎯 Features

- **Custom Domain Emails**: Create unlimited employee emails with your own domains
- **Full Email Functionality**: Send/receive emails to ANY domain (Gmail, Yahoo, etc.)
- **Web-Based Interface**: Modern React UI for reading, composing, and managing emails
- **Admin Panel**: Easy employee management and email account creation
- **Firebase Backend**: All data stored securely in your Firebase infrastructure
- **SMTP/IMAP Support**: Standard email protocols for compatibility
- **Attachments**: Support for file attachments up to 25MB
- **Search & Filters**: Powerful email search and folder organization
- **Security**: Firebase Authentication, role-based access control, data encryption

## 📋 Architecture

```
┌─────────────────┐
│  React Client   │  (Web UI - Port 3000)
│  (Vite + MUI)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │  (REST API - Port 3001)
│   + Firebase    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌────────┐
│ SMTP  │ │Firebase│
│Server │ │(Store) │
│(2525) │ │        │
└───────┘ └────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase Project (already configured: circuvent)
- Domain names: circuvent.com, htresearchlab.com
- Firebase Admin SDK credentials

### Installation

1. **Clone and Install Dependencies**

```bash
cd c:\Users\v-hbonthada\WorkSpace\Mail

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Configure Firebase Admin SDK**

Create `server/.env` from `server/.env.example`:

```env
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=circuvent
FIREBASE_CLIENT_EMAIL=your-firebase-admin@circuvent.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Server Config
PORT=3001
NODE_ENV=development
JWT_SECRET=change-this-to-a-secure-random-string

# SMTP
SMTP_HOST=smtp.circuvent.com
SMTP_PORT=587

# Domains
ALLOWED_DOMAINS=circuvent.com,htresearchlab.com

# Admin Account
ADMIN_EMAIL=admin@circuvent.com
ADMIN_PASSWORD=ChangeThisPassword123
```

**To get Firebase credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select "circuvent" project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Copy the values from the downloaded JSON to your `.env` file

3. **Deploy Firestore Rules and Indexes**

```bash
# Login to Firebase
firebase login

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage
```

4. **Start Development Servers**

```bash
# From root directory
npm run dev
```

This starts:
- React Client: http://localhost:3000
- Express API: http://localhost:3001
- SMTP Server: localhost:2525

## 👥 Creating Employees

### Via Admin Panel (UI)

1. Login as admin
2. Navigate to "Admin Panel"
3. Click "Add Employee"
4. Fill in:
   - Username (e.g., "john.doe")
   - Domain (@circuvent.com or @htresearchlab.com)
   - Display Name
   - Password
   - Role (Employee or Admin)

The system will automatically create:
- Firebase Auth account
- Email address: username@domain
- Default folders (Inbox, Sent, Drafts, Trash, Spam)
- 5GB storage quota

### Via API

```javascript
POST /api/users/employees
Authorization: Bearer <firebase-token>

{
  "email": "employee",
  "displayName": "John Doe",
  "password": "securePassword123",
  "domain": "circuvent.com",
  "role": "employee"
}
```

## 📧 Email Operations

### Sending Emails

**From UI**: Click "Compose" button, fill in recipients, subject, body, and attachments.

**From API**:
```javascript
POST /api/emails/send
Authorization: Bearer <firebase-token>

{
  "to": [{"email": "recipient@example.com", "name": "Recipient"}],
  "cc": [],
  "bcc": [],
  "subject": "Hello",
  "body": "<p>Email content</p>",
  "attachments": []
}
```

### Receiving Emails

The SMTP server automatically:
1. Receives incoming emails on port 2525
2. Authenticates sender
3. Parses email content
4. Stores in Firestore
5. Uploads attachments to Firebase Storage
6. Notifies recipient

## 🌐 DNS Configuration for Custom Domains

**CRITICAL**: Configure these DNS records for your domains to enable email delivery:

### MX Records (Mail Exchange)

```
Domain: circuvent.com
Type: MX
Priority: 10
Value: mail.htresearchlab.com

Domain: htresearchlab.com
Type: MX
Priority: 10
Value: mail.htresearchlab.com
```

### A Record (Mail Server)

```
Type: A
Host: mail.htresearchlab.com
Value: <YOUR_SERVER_IP>
```

### SPF Record (Sender Policy Framework)

```
Type: TXT
Host: @
Value: v=spf1 ip4:<YOUR_SERVER_IP> include:_spf.google.com ~all
```

### DKIM (DomainKeys Identified Mail)

Generate DKIM keys:
```bash
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem
```

Add TXT record:
```
Type: TXT
Host: default._domainkey
Value: v=DKIM1; k=rsa; p=<PUBLIC_KEY_HERE>
```

### DMARC (Domain-based Message Authentication)

```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@circuvent.com
```

## 🔒 Security

### Firestore Security Rules

- Users can only read/write their own emails
- Admins can manage all users
- Role-based access control enforced
- Attachment access restricted to owners

### Firebase Storage Rules

- 25MB max attachment size
- Only authenticated users can upload
- Users can only access their own attachments

### Authentication

- Firebase Authentication for user management
- JWT tokens for API authentication
- Password reset via Firebase
- Custom claims for role management

## 🚀 Production Deployment

### 1. Build Frontend

```bash
cd client
npm run build
```

### 2. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### 3. Deploy Backend

Deploy Express server to your hosting (e.g., Google Cloud Run, AWS, VPS):

```bash
cd server

# Set environment variables
export NODE_ENV=production
export PORT=3001
# ... other env vars

# Start server
npm start
```

### 4. Configure Production Environment

Update `client/.env.production`:
```env
VITE_API_URL=https://mail-api.htresearchlab.com/api
```

### 5. Setup SSL/TLS

Use Let's Encrypt for free SSL certificates:

```bash
sudo certbot --nginx -d mail.htresearchlab.com
```

## 📊 Database Collections

### users
- User profiles, preferences, quotas
- Access: Users read own, admins read all

### emails
- Email messages and metadata
- Access: Users read/write own

### folders
- Custom email folders
- Access: Users manage own

### contacts
- User contact lists
- Access: Users manage own

### attachments
- File metadata and URLs
- Access: Users access own

### auditLogs
- Admin action tracking
- Access: Admins only

## 🛠️ API Endpoints

### Authentication
- All endpoints require `Authorization: Bearer <token>` header

### Email Endpoints
- `POST /api/emails/send` - Send email
- `GET /api/emails/folder/:folder` - Get emails by folder
- `GET /api/emails/:id` - Get single email
- `PATCH /api/emails/:id` - Update email (mark read, star, etc.)
- `DELETE /api/emails/:id` - Delete email
- `POST /api/emails/attachments` - Upload attachment

### User Endpoints (Admin)
- `POST /api/users/employees` - Create employee
- `GET /api/users/employees` - List all employees
- `GET /api/users/employees/:id` - Get employee
- `PUT /api/users/employees/:id` - Update employee
- `POST /api/users/employees/:id/deactivate` - Deactivate
- `POST /api/users/employees/:id/reactivate` - Reactivate
- `DELETE /api/users/employees/:id` - Delete employee
- `GET /api/users/audit-logs` - Get audit logs

## 🧪 Testing

### Create Test Admin Account

```bash
# Using Firebase Console
1. Go to Authentication > Users
2. Add User manually:
   Email: admin@circuvent.com
   Password: YourPassword123

# Then set custom claims via Firebase CLI
firebase auth:export users.json
# Edit users.json to add customClaims: {"role": "admin"}
firebase auth:import users.json --hash-algo=STANDARD_SCRYPT
```

Or use Firebase Admin SDK in server console.

## 📝 Common Tasks

### Reset User Password (Admin)

Via Firebase Console > Authentication > Users > Click user > Reset Password

### Increase User Quota

```javascript
PUT /api/users/employees/:userId
{
  "quotaLimit": 10737418240  // 10GB in bytes
}
```

### Export All Emails

Use Firestore export:
```bash
gcloud firestore export gs://circuvent-backup/emails
```

## 🐛 Troubleshooting

### Emails not sending

1. Check SMTP server is running (port 2525)
2. Verify DNS MX records
3. Check firewall allows port 2525, 587
4. Review server logs

### Authentication errors

1. Verify Firebase config in client/src/config/firebase.js
2. Check token expiration
3. Ensure user is active in Firestore

### Attachment upload fails

1. Check Firebase Storage rules
2. Verify file size < 25MB
3. Check quota not exceeded

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Nodemailer Guide](https://nodemailer.com/)
- [SMTP RFC](https://tools.ietf.org/html/rfc5321)
- [Email Security Best Practices](https://www.cloudflare.com/learning/email-security/what-is-email-security/)

## 🤝 Support

For issues or questions:
- Check logs in `server/logs/`
- Review Firebase Console for errors
- Check Firestore Security Rules

## 📄 License

MIT License - See LICENSE file

---

**Circuvent Mail** - Self-hosted email solution
Built with ❤️ using Firebase, React, and Node.js
