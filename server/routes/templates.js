import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { TemplateService } from '../services/templateService.js';

const router = express.Router();
const templateService = new TemplateService();

// Get all templates for current user
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const templates = await templateService.getUserTemplates(req.user.uid);
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get templates by category
router.get('/category/:category', verifyFirebaseToken, async (req, res) => {
  try {
    const templates = await templateService.getTemplatesByCategory(req.user.uid, req.params.category);
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates by category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single template
router.get('/:templateId', verifyFirebaseToken, async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.templateId, req.user.uid);
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new template
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.createTemplate(req.body, req.user.uid);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a template
router.put('/:templateId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.updateTemplate(
      req.params.templateId,
      req.body,
      req.user.uid
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a template
router.delete('/:templateId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.deleteTemplate(req.params.templateId, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment template usage
router.post('/:templateId/use', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.incrementUsageCount(req.params.templateId);
    res.json(result);
  } catch (error) {
    console.error('Error incrementing template usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== SIGNATURES =====

// Get all signatures for current user
router.get('/signatures/all', verifyFirebaseToken, async (req, res) => {
  try {
    const signatures = await templateService.getUserSignatures(req.user.uid);
    res.json({ success: true, signatures });
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get default signature
router.get('/signatures/default', verifyFirebaseToken, async (req, res) => {
  try {
    const signature = await templateService.getDefaultSignature(req.user.uid);
    res.json({ success: true, signature });
  } catch (error) {
    console.error('Error fetching default signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new signature
router.post('/signatures', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.createSignature(req.body, req.user.uid);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a signature
router.put('/signatures/:signatureId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.updateSignature(
      req.params.signatureId,
      req.body,
      req.user.uid
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a signature
router.delete('/signatures/:signatureId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await templateService.deleteSignature(req.params.signatureId, req.user.uid);
    res.json(result);
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
