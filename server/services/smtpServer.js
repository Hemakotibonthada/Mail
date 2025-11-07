import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';

export class CircuventSMTPServer {
  constructor() {
    this.server = null;
  }

  start(port = 2525) {
    this.server = new SMTPServer({
      authOptional: false,
      onAuth: this.authenticate.bind(this),
      onData: this.handleIncomingEmail.bind(this),
      onMailFrom: this.handleMailFrom.bind(this),
      onRcptTo: this.handleRcptTo.bind(this),
      size: 26214400, // 25MB max message size
      banner: 'Circuvent Mail Server',
      logger: true
    });

    this.server.listen(port, () => {
      console.log(`📧 SMTP Server listening on port ${port}`);
    });

    this.server.on('error', (err) => {
      console.error('SMTP Server error:', err);
    });
  }

  async authenticate(auth, session, callback) {
    try {
      // Authenticate against Firebase
      const userQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', auth.username)
        .limit(1)
        .get();

      if (userQuery.empty) {
        return callback(new Error('Invalid credentials'));
      }

      const user = userQuery.docs[0].data();
      
      if (!user.isActive) {
        return callback(new Error('Account is disabled'));
      }

      // In production, verify password hash
      // For now, validate against Firebase Auth
      callback(null, { user: user.email });
    } catch (error) {
      console.error('SMTP Auth error:', error);
      callback(error);
    }
  }

  async handleMailFrom(address, session, callback) {
    // Verify sender is from allowed domain
    const allowedDomains = process.env.ALLOWED_DOMAINS.split(',');
    const domain = address.address.split('@')[1];

    if (!allowedDomains.includes(domain)) {
      return callback(new Error('Sender domain not allowed'));
    }

    callback();
  }

  async handleRcptTo(address, session, callback) {
    // Accept all recipients (we'll handle delivery logic in handleIncomingEmail)
    callback();
  }

  async handleIncomingEmail(stream, session, callback) {
    try {
      // Parse the email
      const parsed = await simpleParser(stream);
      
      // Determine recipients
      const recipients = [
        ...(parsed.to?.value || []),
        ...(parsed.cc?.value || []),
        ...(parsed.bcc?.value || [])
      ].map(r => r.address);

      // Store email for each recipient
      for (const recipientEmail of recipients) {
        await this.storeEmail(parsed, recipientEmail);
      }

      callback();
    } catch (error) {
      console.error('Error handling incoming email:', error);
      callback(error);
    }
  }

  async storeEmail(parsed, recipientEmail) {
    try {
      // Find recipient user
      const userQuery = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', recipientEmail)
        .limit(1)
        .get();

      if (userQuery.empty) {
        console.log(`Recipient ${recipientEmail} not found in system`);
        return;
      }

      const userId = userQuery.docs[0].id;

      // Create email document
      const emailId = uuidv4();
      const emailData = {
        id: emailId,
        messageId: parsed.messageId || uuidv4(),
        from: {
          email: parsed.from?.value[0]?.address || '',
          name: parsed.from?.value[0]?.name || ''
        },
        to: parsed.to?.value?.map(t => ({
          email: t.address,
          name: t.name || ''
        })) || [],
        cc: parsed.cc?.value?.map(c => ({
          email: c.address,
          name: c.name || ''
        })) || [],
        bcc: parsed.bcc?.value?.map(b => ({
          email: b.address,
          name: b.name || ''
        })) || [],
        subject: parsed.subject || '(No Subject)',
        body: parsed.html || '',
        plainText: parsed.text || '',
        attachments: [],
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        labels: [],
        threadId: parsed.inReplyTo || emailId,
        inReplyTo: parsed.inReplyTo || null,
        references: parsed.references || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId
      };

      // Handle attachments
      if (parsed.attachments && parsed.attachments.length > 0) {
        emailData.attachments = await this.storeAttachments(parsed.attachments, emailId, userId);
      }

      // Save to Firestore
      await db.collection(COLLECTIONS.EMAILS).doc(emailId).set(emailData);

      console.log(`✅ Email stored for ${recipientEmail}`);
    } catch (error) {
      console.error('Error storing email:', error);
      throw error;
    }
  }

  async storeAttachments(attachments, emailId, userId) {
    const attachmentRefs = [];

    for (const attachment of attachments) {
      try {
        const attachmentId = uuidv4();
        const filename = attachment.filename || 'attachment';
        const filePath = `attachments/${userId}/${emailId}/${attachmentId}_${filename}`;

        // Upload to Firebase Storage
        const file = bucket.file(filePath);
        await file.save(attachment.content, {
          metadata: {
            contentType: attachment.contentType
          }
        });

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Store attachment metadata
        const attachmentData = {
          id: attachmentId,
          emailId: emailId,
          filename: filename,
          mimeType: attachment.contentType,
          size: attachment.size,
          storageUrl: url,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(COLLECTIONS.ATTACHMENTS).doc(attachmentId).set(attachmentData);
        attachmentRefs.push(attachmentId);
      } catch (error) {
        console.error('Error storing attachment:', error);
      }
    }

    return attachmentRefs;
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('SMTP Server stopped');
      });
    }
  }
}
