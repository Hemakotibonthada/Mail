// Firestore Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  EMAILS: 'emails',
  FOLDERS: 'folders',
  CONTACTS: 'contacts',
  SETTINGS: 'settings',
  DOMAINS: 'domains',
  ATTACHMENTS: 'attachments',
  EMAIL_QUEUE: 'emailQueue',
  AUDIT_LOGS: 'auditLogs',
  EMAIL_RULES: 'emailRules',
  AUTO_REPLIES: 'autoReplies',
  EVENTS: 'events',
  TEMPLATES: 'templates',
  SIGNATURES: 'signatures'
};

// Email Schema
export const EmailSchema = {
  id: 'string', // UUID
  messageId: 'string', // SMTP Message-ID
  from: {
    email: 'string',
    name: 'string'
  },
  to: ['array of { email: string, name: string }'],
  cc: ['array'],
  bcc: ['array'],
  subject: 'string',
  body: 'string', // HTML content
  plainText: 'string',
  attachments: ['array of attachment references'],
  folder: 'string', // inbox, sent, drafts, trash, spam
  isRead: 'boolean',
  isStarred: 'boolean',
  labels: ['array of strings'],
  threadId: 'string',
  inReplyTo: 'string',
  references: ['array'],
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  userId: 'string' // Owner of the email
};

// User Schema
export const UserSchema = {
  uid: 'string', // Firebase Auth UID
  email: 'string', // employee@circuvent.com
  displayName: 'string',
  domain: 'string', // circuvent.com or htresearchlab.com
  role: 'string', // admin, employee
  isActive: 'boolean',
  quotaUsed: 'number', // in bytes
  quotaLimit: 'number', // in bytes
  signature: 'string', // HTML signature
  preferences: {
    theme: 'string',
    emailsPerPage: 'number',
    autoReply: 'boolean',
    autoReplyMessage: 'string'
  },
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  lastLoginAt: 'timestamp'
};

// Folder Schema
export const FolderSchema = {
  id: 'string',
  name: 'string',
  userId: 'string',
  parentId: 'string', // null for root folders
  color: 'string',
  order: 'number',
  createdAt: 'timestamp'
};

// Contact Schema
export const ContactSchema = {
  id: 'string',
  userId: 'string',
  email: 'string',
  name: 'string',
  phone: 'string',
  company: 'string',
  notes: 'string',
  avatar: 'string',
  isFavorite: 'boolean',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Attachment Schema
export const AttachmentSchema = {
  id: 'string',
  emailId: 'string',
  filename: 'string',
  mimeType: 'string',
  size: 'number', // bytes
  storageUrl: 'string', // Firebase Storage URL
  createdAt: 'timestamp'
};

// Email Rule Schema
export const EmailRuleSchema = {
  id: 'string',
  userId: 'string',
  name: 'string',
  isActive: 'boolean',
  priority: 'number', // Lower number = higher priority
  conditions: {
    type: 'string', // 'all' or 'any'
    rules: [
      {
        field: 'string', // 'from', 'to', 'subject', 'body', 'hasAttachment'
        operator: 'string', // 'contains', 'equals', 'startsWith', 'endsWith', 'exists'
        value: 'string'
      }
    ]
  },
  actions: [
    {
      type: 'string', // 'moveToFolder', 'addLabel', 'markAsRead', 'star', 'forward', 'delete'
      value: 'string' // folder name, label name, email address, etc.
    }
  ],
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

// Auto Reply Schema
export const AutoReplySchema = {
  id: 'string',
  userId: 'string',
  isActive: 'boolean',
  subject: 'string',
  message: 'string', // HTML content
  startDate: 'timestamp',
  endDate: 'timestamp',
  sendOnlyOnce: 'boolean', // Send only once per sender
  respondedTo: ['array of email addresses'],
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};
