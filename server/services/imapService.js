import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'crypto';

class ImapService {
  constructor() {
    this.db = getFirestore();
    this.storage = getStorage();
    this.imap = null;
    this.isConnected = false;
  }

  /**
   * Connect to IMAP server
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.imap) {
        return resolve();
      }

      this.imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: process.env.IMAP_SECURE === 'true',
        tlsOptions: { rejectUnauthorized: false }
      });

      this.imap.once('ready', () => {
        console.log('✅ IMAP connection established');
        this.isConnected = true;
        resolve();
      });

      this.imap.once('error', (err) => {
        console.error('❌ IMAP connection error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('📪 IMAP connection ended');
        this.isConnected = false;
      });

      this.imap.connect();
    });
  }

  /**
   * Disconnect from IMAP server
   */
  disconnect() {
    if (this.imap && this.isConnected) {
      this.imap.end();
      this.isConnected = false;
    }
  }

  /**
   * Fetch new emails from INBOX
   */
  async fetchNewEmails() {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            return reject(err);
          }

          // Search for unseen emails
          this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              return reject(err);
            }

            if (results.length === 0) {
              console.log('📭 No new emails');
              return resolve([]);
            }

            console.log(`📬 Found ${results.length} new emails`);
            const fetch = this.imap.fetch(results, { bodies: '' });
            const emails = [];

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }

                  try {
                    const email = await this.processEmail(parsed);
                    emails.push(email);
                  } catch (error) {
                    console.error('Error processing email:', error);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });

            fetch.once('end', () => {
              console.log(`✅ Processed ${emails.length} emails`);
              resolve(emails);
            });
          });
        });
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Process and store email in Firestore
   */
  async processEmail(parsed) {
    try {
      const emailId = crypto.randomBytes(16).toString('hex');
      
      // Extract recipient email
      const to = parsed.to?.value?.[0]?.address || '';
      const recipientEmail = to.toLowerCase();

      // Find user by email
      const usersRef = this.db.collection('users');
      
      // Try case-sensitive match first
      let userSnapshot = await usersRef
        .where('email', '==', recipientEmail)
        .limit(1)
        .get();

      // If not found, try case-insensitive match
      if (userSnapshot.empty) {
        const allUsersSnap = await usersRef.get();
        const matchingUser = allUsersSnap.docs.find(doc => 
          doc.data().email?.toLowerCase() === recipientEmail.toLowerCase()
        );
        
        if (matchingUser) {
          userSnapshot = { empty: false, docs: [matchingUser] };
          console.log(`✅ Found user with case-insensitive match: ${matchingUser.data().email}`);
        }
      }

      if (userSnapshot.empty) {
        console.log(`⚠️ No user found for email: ${recipientEmail}`);
        return null;
      }

      const userId = userSnapshot.docs[0].id;

      // Process attachments
      const attachments = [];
      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const attachment of parsed.attachments) {
          const attachmentUrl = await this.uploadAttachment(
            userId,
            emailId,
            attachment
          );
          attachments.push({
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            url: attachmentUrl
          });
        }
      }

      // Create email document
      const emailData = {
        id: emailId,
        userId,
        from: parsed.from?.value?.[0]?.address || '',
        fromName: parsed.from?.value?.[0]?.name || '',
        to: [recipientEmail],
        cc: parsed.cc?.value?.map(a => a.address) || [],
        bcc: parsed.bcc?.value?.map(a => a.address) || [],
        subject: parsed.subject || '(No Subject)',
        body: parsed.html || parsed.textAsHtml || parsed.text || '',
        textContent: parsed.text || '',
        attachments,
        folder: 'inbox',
        isRead: false,
        isStarred: false,
        labels: [],
        receivedAt: parsed.date || new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in Firestore
      await this.db
        .collection('users')
        .doc(userId)
        .collection('emails')
        .doc(emailId)
        .set(emailData);

      console.log(`✅ Email stored: ${emailData.subject}`);
      return emailData;
    } catch (error) {
      console.error('Error processing email:', error);
      throw error;
    }
  }

  /**
   * Upload attachment to Firebase Storage
   */
  async uploadAttachment(userId, emailId, attachment) {
    try {
      const bucket = this.storage.bucket();
      const filename = `attachments/${userId}/${emailId}/${attachment.filename}`;
      const file = bucket.file(filename);

      await file.save(attachment.content, {
        contentType: attachment.contentType,
        metadata: {
          metadata: {
            originalName: attachment.filename,
            size: attachment.size
          }
        }
      });

      // Get public URL
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Start periodic email fetching
   */
  startPeriodicFetch(intervalMinutes = 2) {
    console.log(`📡 Starting periodic email fetch (every ${intervalMinutes} minutes)`);
    
    // Fetch immediately
    this.fetchNewEmails().catch(console.error);

    // Then fetch periodically
    this.fetchInterval = setInterval(() => {
      this.fetchNewEmails().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic email fetching
   */
  stopPeriodicFetch() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
      console.log('🛑 Stopped periodic email fetch');
    }
  }

  /**
   * Fetch all folders/mailboxes
   */
  async getFolders() {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.getBoxes((err, boxes) => {
          if (err) {
            return reject(err);
          }
          resolve(boxes);
        });
      });
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }

  /**
   * Sync emails from specific folder
   */
  async syncFolder(folderName = 'INBOX', limit = 50) {
    try {
      await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.openBox(folderName, true, (err, box) => {
          if (err) {
            return reject(err);
          }

          const totalMessages = box.messages.total;
          const startSeq = Math.max(1, totalMessages - limit + 1);
          const endSeq = totalMessages;

          if (totalMessages === 0) {
            return resolve([]);
          }

          const fetch = this.imap.seq.fetch(`${startSeq}:${endSeq}`, {
            bodies: '',
            struct: true
          });

          const emails = [];

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                try {
                  const email = await this.processEmail(parsed);
                  if (email) {
                    emails.push(email);
                  }
                } catch (error) {
                  console.error('Error processing email:', error);
                }
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ Synced ${emails.length} emails from ${folderName}`);
            resolve(emails);
          });
        });
      });
    } catch (error) {
      console.error('Error syncing folder:', error);
      throw error;
    }
  }
}

const imapService = new ImapService();
export default imapService;
