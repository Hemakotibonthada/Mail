# 📡 Circuvent Mail API Reference

Complete API documentation for Circuvent Mail backend services.

## Base URL

- **Development:** `http://localhost:3001/api`
- **Production:** `https://mail-api.htresearchlab.com/api`

## Authentication

All API endpoints (except health check) require authentication.

### Authorization Header

```http
Authorization: Bearer <firebase_id_token>
```

### Getting Firebase Token

```javascript
import { auth } from './config/firebase';

const user = auth.currentUser;
const token = await user.getIdToken();
```

---

## 📧 Email Endpoints

### Send Email

Send an email to one or more recipients.

```http
POST /emails/send
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": [
    { "email": "recipient@example.com", "name": "John Doe" }
  ],
  "cc": [
    { "email": "cc@example.com", "name": "Jane Smith" }
  ],
  "bcc": [],
  "subject": "Hello from Circuvent Mail",
  "body": "<p>This is the email body with <strong>HTML</strong></p>",
  "plainText": "This is the plain text version",
  "attachments": ["attachment-id-1", "attachment-id-2"],
  "inReplyTo": "original-message-id" // optional
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "uuid-of-email",
  "messageId": "smtp-message-id"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `401` - Unauthorized
- `500` - Server error

---

### Get Emails by Folder

Retrieve emails from a specific folder.

```http
GET /emails/folder/:folder?limit=50&offset=0&searchQuery=
Authorization: Bearer <token>
```

**Path Parameters:**
- `folder` - Folder name: `inbox`, `sent`, `drafts`, `trash`, `spam`

**Query Parameters:**
- `limit` (optional) - Number of emails to return (default: 50)
- `offset` (optional) - Pagination offset (default: 0)
- `searchQuery` (optional) - Search term

**Response:**
```json
[
  {
    "id": "email-uuid",
    "messageId": "smtp-message-id",
    "from": {
      "email": "sender@example.com",
      "name": "Sender Name"
    },
    "to": [
      { "email": "recipient@example.com", "name": "Recipient" }
    ],
    "cc": [],
    "bcc": [],
    "subject": "Email Subject",
    "body": "<p>HTML body</p>",
    "plainText": "Plain text body",
    "attachments": ["attachment-id"],
    "folder": "inbox",
    "isRead": false,
    "isStarred": false,
    "labels": [],
    "threadId": "thread-id",
    "createdAt": "2025-11-07T10:00:00Z",
    "userId": "user-uid"
  }
]
```

---

### Get Single Email

Retrieve a specific email by ID.

```http
GET /emails/:id
Authorization: Bearer <token>
```

**Path Parameters:**
- `id` - Email UUID

**Response:**
```json
{
  "id": "email-uuid",
  "messageId": "smtp-message-id",
  "from": { "email": "sender@example.com", "name": "Sender" },
  "to": [{ "email": "recipient@example.com", "name": "Recipient" }],
  "subject": "Email Subject",
  "body": "<p>HTML body</p>",
  "attachments": [],
  "folder": "inbox",
  "isRead": false,
  "isStarred": false,
  "createdAt": "2025-11-07T10:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Email not found
- `403` - Unauthorized (not your email)

---

### Update Email

Update email properties (mark as read, star, move folder, etc.)

```http
PATCH /emails/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "isRead": true,
  "isStarred": false,
  "folder": "trash",
  "labels": ["important", "work"]
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Delete Email

Move email to trash or permanently delete.

```http
DELETE /emails/:id?permanent=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `permanent` (optional) - If `true`, permanently deletes. If `false` (default), moves to trash.

**Response:**
```json
{
  "success": true
}
```

---

### Search Emails

Search emails by query.

```http
GET /emails/search?q=search+term&folder=inbox&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` - Search query
- `folder` (optional) - Filter by folder
- `limit` (optional) - Results limit (default: 50)

**Response:** Array of email objects

---

### Save Draft

Save email as draft.

```http
POST /emails/drafts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "draft-uuid", // optional, for updating existing draft
  "to": [{ "email": "recipient@example.com", "name": "" }],
  "subject": "Draft subject",
  "body": "<p>Draft content</p>",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "draft-uuid"
}
```

---

### Upload Attachment

Upload a file attachment.

```http
POST /emails/attachments
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` - File to upload (max 25MB)
- `emailId` - Email or draft ID

**Response:**
```json
{
  "id": "attachment-uuid",
  "emailId": "email-uuid",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "storageUrl": "https://storage.googleapis.com/...",
  "createdAt": "2025-11-07T10:00:00Z"
}
```

---

### Bulk Operations

Perform operations on multiple emails.

```http
POST /emails/bulk
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "emailIds": ["uuid-1", "uuid-2", "uuid-3"],
  "action": "delete",
  "data": {
    "permanent": false
  }
}
```

**Actions:**
- `delete` - Delete emails
- `update` - Update properties (provide `data` with properties to update)

**Response:**
```json
{
  "results": [
    { "emailId": "uuid-1", "success": true },
    { "emailId": "uuid-2", "success": true },
    { "emailId": "uuid-3", "success": false, "error": "Not found" }
  ]
}
```

---

## 👥 User Endpoints (Admin Only)

### Create Employee

Create a new employee account.

```http
POST /users/employees
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john.doe",
  "displayName": "John Doe",
  "password": "SecurePassword123",
  "domain": "circuvent.com",
  "role": "employee"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "firebase-uid",
  "email": "john.doe@circuvent.com"
}
```

**Status Codes:**
- `201` - Created
- `400` - Invalid data or email exists
- `403` - Not admin

---

### Get All Employees

List all employee accounts.

```http
GET /users/employees?limit=100&offset=0&isActive=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Results limit (default: 100)
- `offset` (optional) - Pagination offset
- `isActive` (optional) - Filter by active status

**Response:**
```json
[
  {
    "id": "user-uid",
    "email": "john.doe@circuvent.com",
    "displayName": "John Doe",
    "domain": "circuvent.com",
    "role": "employee",
    "isActive": true,
    "quotaUsed": 1073741824,
    "quotaLimit": 5368709120,
    "createdAt": "2025-11-07T10:00:00Z"
  }
]
```

---

### Get Single Employee

Get employee details by ID.

```http
GET /users/employees/:id
Authorization: Bearer <token>
```

**Response:** Single user object

**Access:**
- Users can view their own profile
- Admins can view any profile

---

### Update Employee

Update employee details.

```http
PUT /users/employees/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (Admin):**
```json
{
  "displayName": "John Smith",
  "email": "john.smith@circuvent.com",
  "role": "admin",
  "quotaLimit": 10737418240,
  "isActive": true
}
```

**Request Body (Self - Limited):**
```json
{
  "displayName": "John Smith",
  "signature": "<p>Best regards,<br>John</p>",
  "preferences": {
    "theme": "dark",
    "emailsPerPage": 50
  }
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Deactivate Employee

Deactivate an employee account.

```http
POST /users/employees/:id/deactivate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Reactivate Employee

Reactivate an employee account.

```http
POST /users/employees/:id/reactivate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Delete Employee

Permanently delete an employee account.

```http
DELETE /users/employees/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

**Warning:** This permanently deletes:
- User account
- All emails
- All attachments
- Cannot be undone

---

### Get Audit Logs

View audit logs of admin actions.

```http
GET /users/audit-logs?limit=100&targetUser=user-uid
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional) - Results limit (default: 100)
- `targetUser` (optional) - Filter by target user

**Response:**
```json
[
  {
    "id": "log-uuid",
    "action": "USER_CREATED",
    "performedBy": "admin-uid",
    "targetUser": "new-user-uid",
    "details": {
      "email": "new@circuvent.com",
      "role": "employee"
    },
    "timestamp": "2025-11-07T10:00:00Z"
  }
]
```

**Audit Actions:**
- `USER_CREATED`
- `USER_UPDATED`
- `USER_DEACTIVATED`
- `USER_REACTIVATED`
- `USER_DELETED`

---

## 🏥 Health Check

Check if the API is running.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T10:00:00Z",
  "service": "Circuvent Mail Server"
}
```

**No authentication required**

---

## 🔐 Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Usage Examples

### JavaScript/React

```javascript
import axios from 'axios';
import { auth } from './config/firebase';

// Get token
const token = await auth.currentUser.getIdToken();

// Send email
const response = await axios.post(
  'http://localhost:3001/api/emails/send',
  {
    to: [{ email: 'recipient@example.com', name: 'John' }],
    subject: 'Hello',
    body: '<p>Email content</p>'
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### cURL

```bash
# Get emails
curl -X GET \
  http://localhost:3001/api/emails/folder/inbox \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'

# Send email
curl -X POST \
  http://localhost:3001/api/emails/send \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": [{"email": "test@example.com", "name": "Test"}],
    "subject": "Test Email",
    "body": "<p>Test content</p>"
  }'
```

### PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    to = @(
        @{
            email = "recipient@example.com"
            name = "John Doe"
        }
    )
    subject = "Test Email"
    body = "<p>Test content</p>"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3001/api/emails/send" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

---

## 🔄 Rate Limiting

Current limits (configurable in `.env`):
- 100 emails per hour per user
- 500 emails per day per user
- 25MB max attachment size

---

## 🌐 CORS

Allowed origins:
- `http://localhost:3000` (development)
- `https://mail.htresearchlab.com` (production)

Credentials: Enabled

---

## 📊 Response Times

Typical response times:
- Health check: < 10ms
- Get emails: 50-200ms
- Send email: 500-2000ms
- Upload attachment: 1000-5000ms (depends on file size)

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Token expired - get new token
- Invalid token format
- User not authenticated

### 403 Forbidden
- Insufficient permissions
- Admin endpoint accessed by non-admin
- Accessing another user's data

### 500 Server Error
- Check server logs
- Verify Firebase configuration
- Check database connection

---

## 📞 Support

For API issues:
1. Check server console logs
2. Verify token is valid
3. Check request format matches examples
4. Review Firebase Console for errors

---

**Circuvent Mail API v1.0.0**  
Complete REST API for self-hosted email system  
© 2025 All Rights Reserved
