import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { EmailService } from './emailService.js';

export class AutoReplyService {
  constructor() {
    this.emailService = new EmailService();
  }
  
  // Create or update auto-reply settings
  async setAutoReply(autoReplyData, userId) {
    try {
      // Check if user already has an auto-reply
      const existingSnapshot = await db.collection(COLLECTIONS.AUTO_REPLIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      let autoReplyId;
      
      if (!existingSnapshot.empty) {
        // Update existing auto-reply
        autoReplyId = existingSnapshot.docs[0].id;
        const updates = {
          ...autoReplyData,
          respondedTo: existingSnapshot.docs[0].data().respondedTo || [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection(COLLECTIONS.AUTO_REPLIES).doc(autoReplyId).update(updates);
        console.log(`✅ Auto-reply updated for user: ${userId}`);
      } else {
        // Create new auto-reply
        autoReplyId = uuidv4();
        const autoReply = {
          id: autoReplyId,
          userId: userId,
          isActive: autoReplyData.isActive !== false,
          subject: autoReplyData.subject || 'Out of Office',
          message: autoReplyData.message || 'I am currently out of office.',
          startDate: autoReplyData.startDate || admin.firestore.FieldValue.serverTimestamp(),
          endDate: autoReplyData.endDate || null,
          sendOnlyOnce: autoReplyData.sendOnlyOnce !== false,
          respondedTo: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(COLLECTIONS.AUTO_REPLIES).doc(autoReplyId).set(autoReply);
        console.log(`✅ Auto-reply created for user: ${userId}`);
      }

      return { success: true, autoReplyId };
    } catch (error) {
      console.error('Error setting auto-reply:', error);
      throw error;
    }
  }

  // Get user's auto-reply settings
  async getAutoReply(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.AUTO_REPLIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting auto-reply:', error);
      throw error;
    }
  }

  // Delete auto-reply
  async deleteAutoReply(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.AUTO_REPLIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.delete();
        console.log(`✅ Auto-reply deleted for user: ${userId}`);
        return { success: true };
      }

      return { success: false, message: 'No auto-reply found' };
    } catch (error) {
      console.error('Error deleting auto-reply:', error);
      throw error;
    }
  }

  // Toggle auto-reply active status
  async toggleAutoReply(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.AUTO_REPLIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('No auto-reply found');
      }

      const doc = snapshot.docs[0];
      const currentStatus = doc.data().isActive;

      await doc.ref.update({
        isActive: !currentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Auto-reply toggled for user: ${userId} - Active: ${!currentStatus}`);
      return { success: true, isActive: !currentStatus };
    } catch (error) {
      console.error('Error toggling auto-reply:', error);
      throw error;
    }
  }

  // Check and send auto-reply if needed
  async checkAndSendAutoReply(incomingEmail, recipientUserId) {
    try {
      // Get recipient's auto-reply settings
      const autoReply = await this.getAutoReply(recipientUserId);

      if (!autoReply || !autoReply.isActive) {
        return { sent: false, reason: 'Auto-reply not active' };
      }

      // Check date range
      const now = new Date();
      const startDate = autoReply.startDate?.toDate();
      const endDate = autoReply.endDate?.toDate();

      if (startDate && now < startDate) {
        return { sent: false, reason: 'Auto-reply not started yet' };
      }

      if (endDate && now > endDate) {
        // Auto-reply expired, deactivate it
        await db.collection(COLLECTIONS.AUTO_REPLIES).doc(autoReply.id).update({
          isActive: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { sent: false, reason: 'Auto-reply expired' };
      }

      // Check if already responded to this sender
      const senderEmail = incomingEmail.from?.email;
      if (!senderEmail) {
        return { sent: false, reason: 'No sender email' };
      }

      if (autoReply.sendOnlyOnce && autoReply.respondedTo?.includes(senderEmail)) {
        return { sent: false, reason: 'Already responded to this sender' };
      }

      // Don't auto-reply to no-reply addresses or mailing lists
      if (this.shouldSkipAutoReply(senderEmail)) {
        return { sent: false, reason: 'Skipped (no-reply or mailing list)' };
      }

      // Get recipient's user data
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(recipientUserId).get();
      const userData = userDoc.data();

      if (!userData) {
        return { sent: false, reason: 'User not found' };
      }

      // Send auto-reply
      const autoReplyEmailData = {
        to: [{ email: senderEmail, name: incomingEmail.from?.name || '' }],
        subject: autoReply.subject,
        body: this.formatAutoReplyMessage(autoReply.message, userData, incomingEmail),
        plainText: this.stripHtml(autoReply.message),
        inReplyTo: incomingEmail.messageId
      };

      await this.emailService.sendEmail(autoReplyEmailData, recipientUserId);

      // Add sender to respondedTo list if sendOnlyOnce is enabled
      if (autoReply.sendOnlyOnce) {
        await db.collection(COLLECTIONS.AUTO_REPLIES).doc(autoReply.id).update({
          respondedTo: admin.firestore.FieldValue.arrayUnion(senderEmail),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log(`📧 Auto-reply sent to: ${senderEmail}`);
      return { sent: true, to: senderEmail };
    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return { sent: false, error: error.message };
    }
  }

  // Format auto-reply message with variables
  formatAutoReplyMessage(message, userData, incomingEmail) {
    let formattedMessage = message;

    // Replace variables
    formattedMessage = formattedMessage.replace(/\{name\}/g, userData.displayName || 'User');
    formattedMessage = formattedMessage.replace(/\{email\}/g, userData.email || '');
    formattedMessage = formattedMessage.replace(/\{sender\}/g, incomingEmail.from?.name || incomingEmail.from?.email || '');
    formattedMessage = formattedMessage.replace(/\{date\}/g, new Date().toLocaleDateString());
    formattedMessage = formattedMessage.replace(/\{time\}/g, new Date().toLocaleTimeString());

    return formattedMessage;
  }

  // Check if auto-reply should be skipped
  shouldSkipAutoReply(email) {
    const skipPatterns = [
      /^no-?reply@/i,
      /^noreply@/i,
      /^donotreply@/i,
      /^bounce@/i,
      /^mailer-daemon@/i,
      /^postmaster@/i,
      /-bounces@/i,
      /-noreply@/i
    ];

    return skipPatterns.some(pattern => pattern.test(email));
  }

  // Strip HTML tags
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Clear responded-to list (useful for testing or resetting)
  async clearRespondedList(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.AUTO_REPLIES)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          respondedTo: [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Cleared responded-to list for user: ${userId}`);
        return { success: true };
      }

      return { success: false, message: 'No auto-reply found' };
    } catch (error) {
      console.error('Error clearing responded list:', error);
      throw error;
    }
  }
}

export default new AutoReplyService();
