import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

export class TemplateService {
  
  // Create a new email template
  async createTemplate(templateData, userId) {
    try {
      const templateId = uuidv4();
      
      const template = {
        id: templateId,
        userId: userId,
        name: templateData.name || 'Untitled Template',
        subject: templateData.subject || '',
        body: templateData.body || '',
        category: templateData.category || 'general', // general, reply, greeting, meeting, etc.
        isShared: templateData.isShared || false,
        usageCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(COLLECTIONS.TEMPLATES).doc(templateId).set(template);

      console.log(`✅ Template created: ${template.name}`);
      return { success: true, templateId, template };
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  // Get all templates for a user
  async getUserTemplates(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.TEMPLATES)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const templates = [];
      snapshot.forEach(doc => {
        templates.push({ id: doc.id, ...doc.data() });
      });

      return templates;
    } catch (error) {
      console.error('Error getting user templates:', error);
      throw error;
    }
  }

  // Get a single template
  async getTemplate(templateId, userId) {
    try {
      const doc = await db.collection(COLLECTIONS.TEMPLATES).doc(templateId).get();
      
      if (!doc.exists) {
        throw new Error('Template not found');
      }

      const template = doc.data();
      
      // Verify ownership or shared
      if (template.userId !== userId && !template.isShared) {
        throw new Error('Unauthorized access to template');
      }

      return { id: doc.id, ...template };
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }

  // Update a template
  async updateTemplate(templateId, templateData, userId) {
    try {
      const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId);
      const doc = await templateRef.get();

      if (!doc.exists) {
        throw new Error('Template not found');
      }

      const existingTemplate = doc.data();
      
      // Verify ownership
      if (existingTemplate.userId !== userId) {
        throw new Error('Unauthorized access to template');
      }

      const updates = {
        ...templateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await templateRef.update(updates);

      console.log(`✅ Template updated: ${templateId}`);
      return { success: true, templateId };
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // Delete a template
  async deleteTemplate(templateId, userId) {
    try {
      const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId);
      const doc = await templateRef.get();

      if (!doc.exists) {
        throw new Error('Template not found');
      }

      const template = doc.data();
      
      // Verify ownership
      if (template.userId !== userId) {
        throw new Error('Unauthorized access to template');
      }

      await templateRef.delete();

      console.log(`✅ Template deleted: ${templateId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // Increment usage count when template is used
  async incrementUsageCount(templateId) {
    try {
      const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId);
      
      await templateRef.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Template usage incremented: ${templateId}`);
      return { success: true };
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }

  // Get templates by category
  async getTemplatesByCategory(userId, category) {
    try {
      const snapshot = await db.collection(COLLECTIONS.TEMPLATES)
        .where('userId', '==', userId)
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .get();

      const templates = [];
      snapshot.forEach(doc => {
        templates.push({ id: doc.id, ...doc.data() });
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates by category:', error);
      throw error;
    }
  }

  // Create a signature
  async createSignature(signatureData, userId) {
    try {
      const signatureId = uuidv4();
      
      const signature = {
        id: signatureId,
        userId: userId,
        name: signatureData.name || 'Untitled Signature',
        content: signatureData.content || '',
        isDefault: signatureData.isDefault || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // If this is set as default, unset other defaults
      if (signature.isDefault) {
        await this.unsetDefaultSignatures(userId);
      }

      await db.collection(COLLECTIONS.SIGNATURES).doc(signatureId).set(signature);

      console.log(`✅ Signature created: ${signature.name}`);
      return { success: true, signatureId, signature };
    } catch (error) {
      console.error('Error creating signature:', error);
      throw error;
    }
  }

  // Get all signatures for a user
  async getUserSignatures(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.SIGNATURES)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const signatures = [];
      snapshot.forEach(doc => {
        signatures.push({ id: doc.id, ...doc.data() });
      });

      return signatures;
    } catch (error) {
      console.error('Error getting user signatures:', error);
      throw error;
    }
  }

  // Update a signature
  async updateSignature(signatureId, signatureData, userId) {
    try {
      const signatureRef = db.collection(COLLECTIONS.SIGNATURES).doc(signatureId);
      const doc = await signatureRef.get();

      if (!doc.exists) {
        throw new Error('Signature not found');
      }

      const existingSignature = doc.data();
      
      // Verify ownership
      if (existingSignature.userId !== userId) {
        throw new Error('Unauthorized access to signature');
      }

      // If this is being set as default, unset other defaults
      if (signatureData.isDefault && !existingSignature.isDefault) {
        await this.unsetDefaultSignatures(userId);
      }

      const updates = {
        ...signatureData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await signatureRef.update(updates);

      console.log(`✅ Signature updated: ${signatureId}`);
      return { success: true, signatureId };
    } catch (error) {
      console.error('Error updating signature:', error);
      throw error;
    }
  }

  // Delete a signature
  async deleteSignature(signatureId, userId) {
    try {
      const signatureRef = db.collection(COLLECTIONS.SIGNATURES).doc(signatureId);
      const doc = await signatureRef.get();

      if (!doc.exists) {
        throw new Error('Signature not found');
      }

      const signature = doc.data();
      
      // Verify ownership
      if (signature.userId !== userId) {
        throw new Error('Unauthorized access to signature');
      }

      await signatureRef.delete();

      console.log(`✅ Signature deleted: ${signatureId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting signature:', error);
      throw error;
    }
  }

  // Unset all default signatures for a user
  async unsetDefaultSignatures(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.SIGNATURES)
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
      });

      await batch.commit();
      console.log(`✅ Unset default signatures for user: ${userId}`);
    } catch (error) {
      console.error('Error unsetting default signatures:', error);
      throw error;
    }
  }

  // Get default signature for a user
  async getDefaultSignature(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.SIGNATURES)
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting default signature:', error);
      throw error;
    }
  }
}

export default new TemplateService();
