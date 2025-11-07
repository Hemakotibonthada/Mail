# 📧 Circuvent Mail - Self-Hosted Email System

**A complete, production-ready email solution for organizations with custom domains**

## 🎯 Overview

Circuvent Mail is a fully self-hosted email system that allows your organization to:
- Create unlimited employee emails with custom domains (@circuvent.com, @htresearchlab.com)
- Send and receive emails to/from ANY domain (Gmail, Yahoo, Outlook, etc.)
- Maintain complete control over your email data stored in YOUR Firebase infrastructure
- Provide employees with a modern, full-featured email experience

## ✨ Features

### 📬 Email Operations
- ✅ Send emails to any domain (Gmail, Yahoo, Outlook, etc.)
- ✅ Receive emails from any domain
- ✅ Rich text email composer with formatting
- ✅ File attachments (up to 25MB)
- ✅ Email folders (Inbox, Sent, Drafts, Trash, Spam)
- ✅ Star/flag important emails
- ✅ Search and filter emails
- ✅ Email threads and replies
- ✅ Auto-save drafts

### 👥 User Management
- ✅ Admin panel for employee management
- ✅ Automatic email account creation (employee@circuvent.com)
- ✅ Role-based access control (Admin/Employee)
- ✅ User activation/deactivation
- ✅ Storage quota management (default 5GB per user)
- ✅ Custom email signatures

### 🔒 Security
- ✅ Firebase Authentication
- ✅ End-to-end secure communication
- ✅ Firestore security rules
- ✅ Role-based permissions
- ✅ Audit logging
- ✅ SPF, DKIM, DMARC support

### 🎨 User Interface
- ✅ Modern Material-UI design
- ✅ Responsive (works on desktop and mobile)
- ✅ Dark/Light theme support
- ✅ Real-time updates
- ✅ Intuitive email management

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Web Client                      │
│              (Vite + Material-UI + React)                │
│                    Port: 3000                            │
└────────────────────┬─────────────────────────────────────┘
                     │ REST API
                     ▼
┌──────────────────────────────────────────────────────────┐
│              Express.js Backend Server                    │
│          (Authentication + Email Service)                │
│                    Port: 3001                            │
└────────┬────────────────────────────┬────────────────────┘
         │                            │
         ▼                            ▼
┌─────────────────┐         ┌─────────────────────┐
│  SMTP Server    │         │   Firebase Services │
│  (Send/Receive) │         │  - Firestore DB     │
│   Port: 2525    │         │  - Auth             │
└─────────────────┘         │  - Storage          │
                            └─────────────────────┘
```

## 📋 Technology Stack

**Frontend:**
- React 18
- Vite (Build tool)
- Material-UI (UI Framework)
- React Router (Navigation)
- Zustand (State management)
- React Quill (Rich text editor)
- Axios (HTTP client)

**Backend:**
- Node.js + Express.js
- Firebase Admin SDK
- Nodemailer (Email sending)
- SMTP Server (Email receiving)
- Multer (File uploads)
- JWT (Authentication)

**Infrastructure:**
- Firebase Firestore (Database)
- Firebase Storage (File storage)
- Firebase Authentication (User management)
- Firebase Hosting (Web hosting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project (circuvent)
- Domain names configured

### Installation

```bash
# Clone repository
cd c:\Users\v-hbonthada\WorkSpace\Mail

# Install all dependencies
npm run install-all

# Configure environment (see SETUP_GUIDE.md)
cp server/.env.example server/.env
# Edit server/.env with your Firebase credentials

# Deploy Firestore rules
firebase deploy --only firestore:rules,firestore:indexes,storage

# Start development servers
npm run dev
```

Access the application:
- Web UI: http://localhost:3000
- API: http://localhost:3001
- SMTP: localhost:2525

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup and deployment guide
- **[DNS_SETUP.md](./DNS_SETUP.md)** - DNS configuration for email delivery (MX, SPF, DKIM, DMARC)

## 👨‍💼 Creating Employee Accounts

### Via Admin Panel (Recommended)
1. Login as admin
2. Navigate to "Admin Panel"
3. Click "Add Employee"
4. Fill in details:
   - Username: john.doe
   - Domain: @circuvent.com or @htresearchlab.com
   - Display Name: John Doe
   - Password: (secure password)
   - Role: Employee/Admin
5. Click "Create Employee"

The system automatically:
- Creates Firebase Auth account
- Generates email: john.doe@circuvent.com
- Sets up default folders
- Assigns 5GB storage quota

### Via API
```bash
POST /api/users/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "john.doe",
  "displayName": "John Doe",
  "password": "SecurePass123",
  "domain": "circuvent.com",
  "role": "employee"
}
```

## 📧 Email Usage

### Sending Emails
1. Click "Compose" button
2. Enter recipient(s) - can be ANY domain:
   - internal@circuvent.com
   - external@gmail.com
   - anyone@yahoo.com
3. Add subject and compose message
4. Attach files (optional, max 25MB each)
5. Click "Send"

### Receiving Emails
- Emails from ANY domain automatically appear in Inbox
- Real-time notifications
- Automatic spam filtering

### Key Features
- Reply and Forward
- Cc and Bcc support
- Rich text formatting
- File attachments
- Email search
- Folder organization
- Star important emails
- Bulk operations

## 🌐 Domain Configuration

**CRITICAL:** Configure DNS records for email delivery:

### Required DNS Records
1. **MX Record** - Routes incoming emails
2. **A Record** - Points to your mail server
3. **SPF Record** - Prevents spoofing
4. **DKIM Record** - Email authentication
5. **DMARC Record** - Email policy

See **[DNS_SETUP.md](./DNS_SETUP.md)** for detailed instructions.

## 🔐 Security Features

- Firebase Authentication for user login
- JWT tokens for API authentication
- Firestore security rules prevent unauthorized access
- Storage rules protect attachments
- Audit logging tracks admin actions
- Password hashing (bcrypt)
- Role-based permissions

## 📊 Database Collections

| Collection | Purpose | Access |
|-----------|---------|--------|
| `users` | Employee profiles and settings | Users: own; Admins: all |
| `emails` | Email messages | Users: own only |
| `folders` | Custom email folders | Users: own only |
| `contacts` | Contact lists | Users: own only |
| `attachments` | File metadata | Users: own only |
| `auditLogs` | Admin action tracking | Admins only |

## 🛠️ API Endpoints

### Email Operations
- `POST /api/emails/send` - Send email
- `GET /api/emails/folder/:folder` - Get emails by folder
- `GET /api/emails/:id` - Get single email
- `PATCH /api/emails/:id` - Update email (mark read, star, etc.)
- `DELETE /api/emails/:id` - Move to trash
- `POST /api/emails/attachments` - Upload attachment

### Admin Operations
- `POST /api/users/employees` - Create employee
- `GET /api/users/employees` - List employees
- `PUT /api/users/employees/:id` - Update employee
- `POST /api/users/employees/:id/deactivate` - Deactivate account
- `DELETE /api/users/employees/:id` - Delete employee

All endpoints require `Authorization: Bearer <firebase-token>` header.

## 🚀 Production Deployment

1. **Configure DNS** (see DNS_SETUP.md)
2. **Get SSL Certificate** (Let's Encrypt)
3. **Set Environment Variables**
4. **Build Frontend:** `cd client && npm run build`
5. **Deploy to Firebase:** `firebase deploy`
6. **Deploy Backend** (Google Cloud Run, AWS, VPS)
7. **Configure Firewall** (ports 25, 587, 2525, 80, 443)

## 📈 Monitoring & Maintenance

- Check server logs: `server/logs/`
- Monitor Firebase Console for errors
- Review audit logs in Admin Panel
- Check email delivery rates
- Monitor storage quotas

## 🐛 Troubleshooting

**Emails not sending?**
- Verify DNS records (MX, SPF, DKIM)
- Check SMTP server is running
- Review firewall settings

**Authentication errors?**
- Verify Firebase configuration
- Check token expiration
- Ensure user is active

**Attachments failing?**
- Check file size (max 25MB)
- Verify Firebase Storage rules
- Check user quota

See SETUP_GUIDE.md for detailed troubleshooting.

## 📄 Configuration Details

### Firebase Project
- **Project ID:** circuvent
- **Web App ID:** 1:743562898363:web:607e7f6d181a794948b29e
- **Android Package:** mail.circuvent.com
- **Custom Domain:** mail.htresearchlab.com

### Supported Domains
- @circuvent.com
- @htresearchlab.com

### Default Settings
- Storage quota: 5GB per user
- Max attachment size: 25MB
- Emails per page: 25
- Session timeout: 7 days

## 🤝 Support

For issues or questions:
- Check documentation in SETUP_GUIDE.md
- Review Firebase Console logs
- Check server logs
- Verify DNS configuration

## 📄 License

MIT License

---

**Circuvent Mail** - Complete self-hosted email solution  
Built with ❤️ using Firebase, React, Node.js, and Express  
Version 1.0.0 | 2025
