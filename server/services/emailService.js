import nodemailer from 'nodemailer';
import { db, bucket } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

export class EmailService {
  constructor() {
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 2525,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(emailData, userId) {
    try {
      const { to, cc, bcc, subject, body, plainText, attachments, inReplyTo } = emailData;

      // Get sender info
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      const userData = userDoc.data();

      if (!userData || !userData.isActive) {
        throw new Error('User not found or inactive');
      }

      // Prepare email options
      const mailOptions = {
        from: `${userData.displayName} <${userData.email}>`,
        to: to.map(t => t.email).join(', '),
        cc: cc?.map(c => c.email).join(', '),
        bcc: bcc?.map(b => b.email).join(', '),
        subject: subject,
        html: body,
        text: plainText || this.stripHtml(body),
        inReplyTo: inReplyTo,
        messageId: `<${uuidv4()}@${userData.domain}>`,
        attachments: []
      };

      // Handle attachments
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = await this.prepareAttachments(attachments);
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Store in sent folder
      const emailId = uuidv4();
      const storedEmail = {
        id: emailId,
        messageId: mailOptions.messageId,
        from: {
          email: userData.email,
          name: userData.displayName
        },
        to: to,
        cc: cc || [],
        bcc: bcc || [],
        subject: subject,
        body: body,
        plainText: plainText || this.stripHtml(body),
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
          accepted: info.accepted,
          rejected: info.rejected
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
        ...emailData,
        folder: 'drafts',
        isRead: false,
        userId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
      const { limit = 50, offset = 0, searchQuery = '' } = options;

      let query = db.collection(COLLECTIONS.EMAILS)
        .where('userId', '==', userId)
        .where('folder', '==', folder)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      const snapshot = await query.get();
      const emails = [];

      snapshot.forEach(doc => {
        emails.push({ id: doc.id, ...doc.data() });
      });

      return emails;
    } catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  }

  async getEmailById(emailId, userId) {
    try {
      const emailDoc = await db.collection(COLLECTIONS.EMAILS).doc(emailId).get();
      
      if (!emailDoc.exists) {
        throw new Error('Email not found');
      }

      const emailData = emailDoc.data();

      // Verify ownership
      if (emailData.userId !== userId) {
        throw new Error('Unauthorized');
      }

      return { id: emailDoc.id, ...emailData };
    } catch (error) {
      console.error('Error getting email:', error);
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
