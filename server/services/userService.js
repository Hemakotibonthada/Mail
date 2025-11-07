import { db, auth } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';

export class UserService {
  async createEmployee(employeeData, creatorId) {
    try {
      const { displayName, email, password, domain, role = 'employee' } = employeeData;

      // Validate domain
      const allowedDomains = process.env.ALLOWED_DOMAINS.split(',');
      const emailDomain = email.split('@')[1];

      if (!allowedDomains.includes(emailDomain)) {
        throw new Error(`Domain ${emailDomain} is not allowed. Use ${allowedDomains.join(' or ')}`);
      }

      // Check if email already exists
      const existingUser = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        throw new Error('Email already exists');
      }

      // Create Firebase Auth user
      const firebaseUser = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(firebaseUser.uid, { role });

      // Create user document in Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: email,
        displayName: displayName,
        domain: emailDomain,
        role: role,
        isActive: true,
        quotaUsed: 0,
        quotaLimit: 5368709120, // 5GB default
        signature: `<p>Best regards,<br>${displayName}</p>`,
        preferences: {
          theme: 'light',
          emailsPerPage: 25,
          autoReply: false,
          autoReplyMessage: ''
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null
      };

      await db.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set(userData);

      // Create default folders
      await this.createDefaultFolders(firebaseUser.uid);

      // Log audit
      await this.logAudit({
        action: 'USER_CREATED',
        performedBy: creatorId,
        targetUser: firebaseUser.uid,
        details: { email, role }
      });

      return {
        success: true,
        userId: firebaseUser.uid,
        email: email
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  async createDefaultFolders(userId) {
    const defaultFolders = [
      { name: 'Inbox', systemFolder: 'inbox' },
      { name: 'Sent', systemFolder: 'sent' },
      { name: 'Drafts', systemFolder: 'drafts' },
      { name: 'Trash', systemFolder: 'trash' },
      { name: 'Spam', systemFolder: 'spam' }
    ];

    for (const folder of defaultFolders) {
      await db.collection(COLLECTIONS.FOLDERS).add({
        userId: userId,
        name: folder.name,
        systemFolder: folder.systemFolder,
        parentId: null,
        color: '#666666',
        order: defaultFolders.indexOf(folder),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async getAllEmployees(options = {}) {
    try {
      const { limit = 100, offset = 0, isActive } = options;

      let query = db.collection(COLLECTIONS.USERS);

      if (isActive !== undefined) {
        query = query.where('isActive', '==', isActive);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const employees = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Remove sensitive data
        delete data.passwordHash;
        employees.push({ id: doc.id, ...data });
      });

      return employees;
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  async getEmployeeById(userId) {
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const data = userDoc.data();
      delete data.passwordHash;

      return { id: userDoc.id, ...data };
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  async updateEmployee(userId, updates, updaterId) {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      // Update Firestore
      await userRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update Firebase Auth if needed
      if (updates.email || updates.displayName) {
        const authUpdates = {};
        if (updates.email) authUpdates.email = updates.email;
        if (updates.displayName) authUpdates.displayName = updates.displayName;
        
        await auth.updateUser(userId, authUpdates);
      }

      // Update custom claims if role changed
      if (updates.role) {
        await auth.setCustomUserClaims(userId, { role: updates.role });
      }

      // Log audit
      await this.logAudit({
        action: 'USER_UPDATED',
        performedBy: updaterId,
        targetUser: userId,
        details: updates
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  async deactivateEmployee(userId, deactivatorId) {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

      await userRef.update({
        isActive: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Disable Firebase Auth
      await auth.updateUser(userId, { disabled: true });

      // Log audit
      await this.logAudit({
        action: 'USER_DEACTIVATED',
        performedBy: deactivatorId,
        targetUser: userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  }

  async reactivateEmployee(userId, activatorId) {
    try {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

      await userRef.update({
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Enable Firebase Auth
      await auth.updateUser(userId, { disabled: false });

      // Log audit
      await this.logAudit({
        action: 'USER_REACTIVATED',
        performedBy: activatorId,
        targetUser: userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error reactivating employee:', error);
      throw error;
    }
  }

  async deleteEmployee(userId, deleterId) {
    try {
      // This is a hard delete - use with caution
      // In production, consider soft delete instead

      // Delete all user's emails
      const emailsSnapshot = await db.collection(COLLECTIONS.EMAILS)
        .where('userId', '==', userId)
        .get();

      const batch = db.batch();
      emailsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Delete user document
      await db.collection(COLLECTIONS.USERS).doc(userId).delete();

      // Delete Firebase Auth user
      await auth.deleteUser(userId);

      // Log audit
      await this.logAudit({
        action: 'USER_DELETED',
        performedBy: deleterId,
        targetUser: userId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      await db.collection(COLLECTIONS.USERS).doc(userId).update({
        preferences: preferences,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  async logAudit(auditData) {
    try {
      await db.collection(COLLECTIONS.AUDIT_LOGS).add({
        ...auditData,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  async getAuditLogs(options = {}) {
    try {
      const { limit = 100, targetUser } = options;

      let query = db.collection(COLLECTIONS.AUDIT_LOGS);

      if (targetUser) {
        query = query.where('targetUser', '==', targetUser);
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const logs = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return logs;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }
}
