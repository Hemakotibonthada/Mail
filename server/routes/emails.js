import express from 'express';
import multer from 'multer';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { EmailService } from '../services/emailService.js';

const router = express.Router();
const emailService = new EmailService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 26214400 // 25MB
  }
});

// Send email
router.post('/send', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailService.sendEmail(req.body, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save draft
router.post('/drafts', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailService.saveDraft(req.body, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get emails by folder
router.get('/folder/:folder', verifyFirebaseToken, async (req, res) => {
  try {
    const { limit, offset, searchQuery } = req.query;
    const emails = await emailService.getEmails(req.userId, req.params.folder, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      searchQuery
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const email = await emailService.getEmailById(req.params.id, req.userId);
    res.json(email);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Update email (mark as read, star, move folder, etc.)
router.patch('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailService.updateEmail(req.params.id, req.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete email
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const permanent = req.query.permanent === 'true';
    const result = await emailService.deleteEmail(req.params.id, req.userId, permanent);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search emails
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { q, folder, limit } = req.query;
    const emails = await emailService.searchEmails(req.userId, q, {
      folder,
      limit: parseInt(limit) || 50
    });
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload attachment
router.post('/attachments', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { emailId } = req.body;
    const attachment = await emailService.uploadAttachment(req.file, req.userId, emailId);
    res.json(attachment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk operations
router.post('/bulk', verifyFirebaseToken, async (req, res) => {
  try {
    const { emailIds, action, data } = req.body;
    const results = [];

    for (const emailId of emailIds) {
      try {
        switch (action) {
          case 'delete':
            await emailService.deleteEmail(emailId, req.userId, data?.permanent);
            break;
          case 'update':
            await emailService.updateEmail(emailId, req.userId, data);
            break;
          default:
            throw new Error('Invalid action');
        }
        results.push({ emailId, success: true });
      } catch (error) {
        results.push({ emailId, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
