import express from 'express';
import emailRulesService from '../services/emailRulesService.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Get all rules for current user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const rules = await emailRulesService.getUserRules(req.user.uid);
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single rule
router.get('/:ruleId', verifyFirebaseToken, async (req, res) => {
  try {
    const rule = await emailRulesService.getRule(req.params.ruleId, req.user.uid);
    res.json({ success: true, rule });
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Create a new rule
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailRulesService.createRule(req.body, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a rule
router.put('/:ruleId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailRulesService.updateRule(
      req.params.ruleId,
      req.body,
      req.user.uid
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a rule
router.delete('/:ruleId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailRulesService.deleteRule(req.params.ruleId, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle rule active status
router.post('/:ruleId/toggle', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await emailRulesService.toggleRule(req.params.ruleId, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error toggling rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test rule against an email
router.post('/:ruleId/test', verifyFirebaseToken, async (req, res) => {
  try {
    const rule = await emailRulesService.getRule(req.params.ruleId, req.user.uid);
    const email = req.body.email; // Test email data
    
    const matches = emailRulesService.evaluateConditions(email, rule.conditions);
    
    res.json({ success: true, matches, rule: rule.name });
  } catch (error) {
    console.error('Error testing rule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
