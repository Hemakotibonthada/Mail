import nodemailer from 'nodemailer';
import { db, bucket } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

export class EmailService {
  constructor() {
    // Store SMTP configurations for different domains
    this.smtpConfigs = {
      'htresearchlab.com': {
        host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
          pass: process.env.SMTP_PASS || process.env.ADMIN_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      },
      'circuvent.com': {
        host: process.env.SMTP_HOST_CIRCUVENT || process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT_CIRCUVENT || process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER_CIRCUVENT || process.env.ADMIN_EMAIL,
          pass: process.env.SMTP_PASS_CIRCUVENT || process.env.ADMIN_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      },
      'ai.com': {
        host: process.env.SMTP_HOST_AI || 'smtpout.secureserver.net',
        port: parseInt(process.env.SMTP_PORT_AI || process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER_AI || null,
          pass: process.env.SMTP_PASS_AI || null
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    };
    
    // Default transporter (will be created per-email based on sender domain)
    this.transporter = null;
  }

  getTransporterForDomain(domain) {
    // Get SMTP config for the user's domain
    let config = this.smtpConfigs[domain];
    
    // If domain doesn't have config or credentials are missing, use htresearchlab.com as fallback
    if (!config || !config.auth.user || !config.auth.pass) {
      console.log(`⚠️  No SMTP config for ${domain}, using htresearchlab.com SMTP as relay`);
      config = this.smtpConfigs['htresearchlab.com'];
    }
    
    // Final check - if still no credentials, throw error
    if (!config.auth.user || !config.auth.pass) {
      throw new Error(`SMTP not configured for domain: ${domain}. Please add email credentials.`);
    }
    
    return nodemailer.createTransport(config);
  }

  async sendEmail(emailData, userId) {
    try {
      const { to, cc, bcc, subject, body, plainText, attachments, inReplyTo } = emailData;

      // Get sender info
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      let userData = userDoc.data();

      // If user doesn't exist in Firestore, create a basic user document
      if (!userData) {
        console.log(`User ${userId} not found in Firestore, creating basic user document...`);
        
        // Get user email from Firebase Auth
        const userRecord = await admin.auth().getUser(userId);
        userData = {
          uid: userId,
          email: userRecord.email || 'unknown@example.com',
          displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
          domain: userRecord.email?.split('@')[1] || 'circuvent.com',
          role: 'employee',
          isActive: true,
          quotaUsed: 0,
          quotaLimit: 5368709120, // 5GB
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save the user document
        await db.collection(COLLECTIONS.USERS).doc(userId).set(userData);
        console.log(`✅ User document created for ${userData.email}`);
      }

      if (!userData.isActive) {
        throw new Error('User account is inactive');
      }

      // Extract domain from user email
      const userDomain = userData.domain || userData.email?.split('@')[1] || 'htresearchlab.com';
      
      console.log(`📧 Sending email from: ${userData.email} (Domain: ${userDomain})`);

      // Check if domain has valid MX records (only htresearchlab.com is configured)
      const validatedDomains = ['htresearchlab.com'];
      const needsRelay = !validatedDomains.includes(userDomain);
      
      // Determine actual sender and reply-to
      let fromAddress, replyToAddress;
      if (needsRelay) {
        // Use htresearchlab.com as sender for domains without MX records
        fromAddress = `${userData.displayName || userData.email} via HTResearchLab <${process.env.SMTP_USER}>`;
        replyToAddress = userData.email;
        console.log(`⚠️ Domain ${userDomain} not validated - using relay with Reply-To: ${replyToAddress}`);
      } else {
        // Use actual user email for validated domains
        fromAddress = `${userData.displayName || userData.email} <${userData.email}>`;
        replyToAddress = userData.email;
      }

      // Get the appropriate transporter (always use htresearchlab.com for now)
      const transporter = this.getTransporterForDomain('htresearchlab.com');

      // Prepare email options
      const mailOptions = {
        from: fromAddress,
        replyTo: replyToAddress,
        to: to.map(t => t.email).join(', '),
        cc: cc?.map(c => c.email).join(', ') || '',
        bcc: bcc?.map(b => b.email).join(', ') || '',
        subject: subject || '(No Subject)',
        html: body || '',
        text: plainText || this.stripHtml(body) || '',
        inReplyTo: inReplyTo || '',
        messageId: `<${uuidv4()}@htresearchlab.com>`,
        attachments: []
      };

      // Handle attachments
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = await this.prepareAttachments(attachments);
      }

      // Send email using domain-specific transporter
      console.log(`📤 Sending via SMTP: ${this.smtpConfigs[userDomain]?.host || 'default'}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);

      // Store in sent folder
      const emailId = uuidv4();
      const storedEmail = {
        id: emailId,
        messageId: mailOptions.messageId,
        from: {
          email: userData.email || '',
          name: userData.displayName || userData.email || ''
        },
        to: to,
        cc: cc || [],
        bcc: bcc || [],
        subject: subject || '(No Subject)',
        body: body || '',
        plainText: plainText || this.stripHtml(body) || '',
        attachments: attachments || [],
        folder: 'sent',
        isRead: true,
        isStarred: false,
        labels: [],
        threadId: inReplyTo || emailId,
        inReplyTo: inReplyTo || null,
        references: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId,
        smtpInfo: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted || [],
          rejected: info.rejected || []
        }
      };

      await db.collection(COLLECTIONS.EMAILS).doc(emailId).set(storedEmail);

      return {
        success: true,
        emailId: emailId,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async saveDraft(emailData, userId) {
    try {
      const emailId = emailData.id || uuidv4();
      
      const draftData = {
        id: emailId,
        to: emailData.to || [],
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: emailData.subject || '(No Subject)',
        body: emailData.body || '',
        plainText: emailData.plainText || '',
        attachments: emailData.attachments || [],
        from: emailData.from || { email: '', name: '' },
        folder: 'drafts',
        isRead: false,
        isStarred: false,
        labels: [],
        userId: userId,
        createdAt: emailData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(COLLECTIONS.EMAILS).doc(emailId).set(draftData, { merge: true });

      return { success: true, emailId };
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  async getEmails(userId, folder = 'inbox', options = {}) {
    try {
      console.log(`🔍 Fetching emails - userId: ${userId}, folder: ${folder}`);
      const { limit = 50, offset = 0, searchQuery = '' } = options;

      let query = db.collection(COLLECTIONS.EMAILS)
        .where('folder', '==', folder)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (offset > 0) {
        query = query.offset(offset);
      }

      const snapshot = await query.get();
      const emails = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert Firestore timestamps to ISO strings
        const emailData = {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
        emails.push(emailData);
      });

      console.log(`✅ Found ${emails.length} emails in ${folder} for user ${userId}`);
      return emails;
    } catch (error) {
      console.error('❌ Error getting emails:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        userId,
        folder
      });
      throw error;
    }
  }

  async getEmailById(emailId, userId) {
    try {
      console.log(`🔍 Fetching email by ID: ${emailId} for user: ${userId}`);
      const emailDoc = await db.collection(COLLECTIONS.EMAILS).doc(emailId).get();
      
      if (!emailDoc.exists) {
        throw new Error('Email not found');
      }

      const emailData = emailDoc.data();

      // Verify ownership
      if (emailData.userId !== userId) {
        throw new Error('Unauthorized');
      }

      // Convert timestamps
      const result = {
        ...emailData,
        id: emailDoc.id,
        createdAt: emailData.createdAt?.toDate?.()?.toISOString() || emailData.createdAt,
        updatedAt: emailData.updatedAt?.toDate?.()?.toISOString() || emailData.updatedAt
      };

      console.log(`✅ Email found: ${emailId}`);
      return result;
    } catch (error) {
      console.error('❌ Error getting email:', error);
      throw error;
    }
  }

  async updateEmail(emailId, userId, updates) {
    try {
      const emailRef = db.collection(COLLECTIONS.EMAILS).doc(emailId);
      const emailDoc = await emailRef.get();

      if (!emailDoc.exists || emailDoc.data().userId !== userId) {
        throw new Error('Email not found or unauthorized');
      }

      await emailRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async deleteEmail(emailId, userId, permanent = false) {
    try {
      const emailRef = db.collection(COLLECTIONS.EMAILS).doc(emailId);
      const emailDoc = await emailRef.get();

      if (!emailDoc.exists || emailDoc.data().userId !== userId) {
        throw new Error('Email not found or unauthorized');
      }

      if (permanent) {
        // Delete attachments from storage
        const emailData = emailDoc.data();
        if (emailData.attachments && emailData.attachments.length > 0) {
          for (const attachmentId of emailData.attachments) {
            await this.deleteAttachment(attachmentId);
          }
        }

        // Delete email document
        await emailRef.delete();
      } else {
        // Move to trash
        await emailRef.update({
          folder: 'trash',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }

  async searchEmails(userId, searchQuery, options = {}) {
    try {
      const { folder, limit = 50 } = options;

      // Basic search - in production, use Algolia or Elastic Search
      let query = db.collection(COLLECTIONS.EMAILS)
        .where('userId', '==', userId);

      if (folder) {
        query = query.where('folder', '==', folder);
      }

      const snapshot = await query.limit(limit).get();
      const emails = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const searchLower = searchQuery.toLowerCase();
        
        if (
          data.subject?.toLowerCase().includes(searchLower) ||
          data.plainText?.toLowerCase().includes(searchLower) ||
          data.from?.email?.toLowerCase().includes(searchLower)
        ) {
          emails.push({ id: doc.id, ...data });
        }
      });

      return emails;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  async uploadAttachment(file, userId, emailId) {
    try {
      const attachmentId = uuidv4();
      const filename = file.originalname;
      const filePath = `attachments/${userId}/${emailId}/${attachmentId}_${filename}`;

      const fileBuffer = file.buffer;
      const fileUpload = bucket.file(filePath);

      await fileUpload.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype
        }
      });

      const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const attachmentData = {
        id: attachmentId,
        emailId: emailId,
        filename: filename,
        mimeType: file.mimetype,
        size: file.size,
        storageUrl: url,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(COLLECTIONS.ATTACHMENTS).doc(attachmentId).set(attachmentData);

      return attachmentData;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  async deleteAttachment(attachmentId) {
    try {
      const attachmentDoc = await db.collection(COLLECTIONS.ATTACHMENTS).doc(attachmentId).get();
      
      if (attachmentDoc.exists) {
        const data = attachmentDoc.data();
        // Extract file path from storage URL and delete
        await attachmentDoc.ref.delete();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  }

  async prepareAttachments(attachmentIds) {
    const attachments = [];

    for (const attachmentId of attachmentIds) {
      const attachmentDoc = await db.collection(COLLECTIONS.ATTACHMENTS).doc(attachmentId).get();
      
      if (attachmentDoc.exists) {
        const data = attachmentDoc.data();
        attachments.push({
          filename: data.filename,
          path: data.storageUrl
        });
      }
    }

    return attachments;
  }

  stripHtml(html) {
    return html?.replace(/<[^>]*>/g, '') || '';
  }
}
