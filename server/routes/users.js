import express from 'express';
import { verifyFirebaseToken, verifyAdmin } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';

const router = express.Router();
const userService = new UserService();

// Create new employee (admin only)
router.post('/employees', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const result = await userService.createEmployee(req.body, req.userId);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all employees (admin only)
router.get('/employees', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const { limit, offset, isActive } = req.query;
    const employees = await userService.getAllEmployees({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single employee
router.get('/employees/:id', verifyFirebaseToken, async (req, res) => {
  try {
    // Users can view their own profile, admins can view any
    if (req.userId !== req.params.id) {
      // Check if requester is admin
      const user = await auth.getUser(req.userId);
      if (user.customClaims?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const employee = await userService.getEmployeeById(req.params.id);
    res.json(employee);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Update employee (admin only, or self for limited fields)
router.put('/employees/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const isSelf = req.userId === req.params.id;
    
    if (!isSelf) {
      // Must be admin to update others
      const user = await auth.getUser(req.userId);
      if (user.customClaims?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // If updating self, only allow certain fields
    if (isSelf) {
      const allowedFields = ['displayName', 'signature', 'preferences'];
      const updates = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      req.body = updates;
    }

    const result = await userService.updateEmployee(req.params.id, req.body, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deactivate employee (admin only)
router.post('/employees/:id/deactivate', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const result = await userService.deactivateEmployee(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reactivate employee (admin only)
router.post('/employees/:id/reactivate', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const result = await userService.reactivateEmployee(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee (admin only)
router.delete('/employees/:id', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const result = await userService.deleteEmployee(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get audit logs (admin only)
router.get('/audit-logs', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const { limit, targetUser } = req.query;
    const logs = await userService.getAuditLogs({
      limit: parseInt(limit) || 100,
      targetUser
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
