import express from 'express';
import { AutoReplyService } from '../services/autoReplyService.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();
const autoReplyService = new AutoReplyService();

// Get auto-reply settings for current user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const autoReply = await autoReplyService.getAutoReply(req.user.uid);
    res.json({ success: true, autoReply });
  } catch (error) {
    console.error('Error fetching auto-reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or update auto-reply settings
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await autoReplyService.setAutoReply(req.body, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error setting auto-reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete auto-reply
router.delete('/', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await autoReplyService.deleteAutoReply(req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error deleting auto-reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle auto-reply active status
router.post('/toggle', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await autoReplyService.toggleAutoReply(req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error toggling auto-reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear responded-to list
router.post('/clear-responded', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await autoReplyService.clearRespondedList(req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error clearing responded list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
