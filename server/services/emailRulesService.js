import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../models/collections.js';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

export class EmailRulesService {
  
  // Create a new email rule
  async createRule(ruleData, userId) {
    try {
      const ruleId = uuidv4();
      
      const rule = {
        id: ruleId,
        userId: userId,
        name: ruleData.name || 'Untitled Rule',
        isActive: ruleData.isActive !== false,
        priority: ruleData.priority || 0,
        conditions: {
          type: ruleData.conditions?.type || 'all', // 'all' or 'any'
          rules: ruleData.conditions?.rules || []
        },
        actions: ruleData.actions || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(COLLECTIONS.EMAIL_RULES).doc(ruleId).set(rule);

      console.log(`✅ Email rule created: ${rule.name}`);
      return { success: true, ruleId, rule };
    } catch (error) {
      console.error('Error creating email rule:', error);
      throw error;
    }
  }

  // Get all rules for a user
  async getUserRules(userId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.EMAIL_RULES)
        .where('userId', '==', userId)
        .orderBy('priority', 'asc')
        .get();

      const rules = [];
      snapshot.forEach(doc => {
        rules.push({ id: doc.id, ...doc.data() });
      });

      return rules;
    } catch (error) {
      console.error('Error getting user rules:', error);
      throw error;
    }
  }

  // Get a single rule
  async getRule(ruleId, userId) {
    try {
      const doc = await db.collection(COLLECTIONS.EMAIL_RULES).doc(ruleId).get();
      
      if (!doc.exists) {
        throw new Error('Rule not found');
      }

      const rule = doc.data();
      
      // Verify ownership
      if (rule.userId !== userId) {
        throw new Error('Unauthorized access to rule');
      }

      return { id: doc.id, ...rule };
    } catch (error) {
      console.error('Error getting rule:', error);
      throw error;
    }
  }

  // Update a rule
  async updateRule(ruleId, ruleData, userId) {
    try {
      const ruleRef = db.collection(COLLECTIONS.EMAIL_RULES).doc(ruleId);
      const doc = await ruleRef.get();

      if (!doc.exists) {
        throw new Error('Rule not found');
      }

      const existingRule = doc.data();
      
      // Verify ownership
      if (existingRule.userId !== userId) {
        throw new Error('Unauthorized access to rule');
      }

      const updates = {
        ...ruleData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await ruleRef.update(updates);

      console.log(`✅ Email rule updated: ${ruleId}`);
      return { success: true, ruleId };
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    }
  }

  // Delete a rule
  async deleteRule(ruleId, userId) {
    try {
      const ruleRef = db.collection(COLLECTIONS.EMAIL_RULES).doc(ruleId);
      const doc = await ruleRef.get();

      if (!doc.exists) {
        throw new Error('Rule not found');
      }

      const rule = doc.data();
      
      // Verify ownership
      if (rule.userId !== userId) {
        throw new Error('Unauthorized access to rule');
      }

      await ruleRef.delete();

      console.log(`✅ Email rule deleted: ${ruleId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }

  // Toggle rule active status
  async toggleRule(ruleId, userId) {
    try {
      const ruleRef = db.collection(COLLECTIONS.EMAIL_RULES).doc(ruleId);
      const doc = await ruleRef.get();

      if (!doc.exists) {
        throw new Error('Rule not found');
      }

      const rule = doc.data();
      
      // Verify ownership
      if (rule.userId !== userId) {
        throw new Error('Unauthorized access to rule');
      }

      await ruleRef.update({
        isActive: !rule.isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Email rule toggled: ${ruleId} - Active: ${!rule.isActive}`);
      return { success: true, isActive: !rule.isActive };
    } catch (error) {
      console.error('Error toggling rule:', error);
      throw error;
    }
  }

  // Apply rules to an email
  async applyRulesToEmail(email, userId) {
    try {
      const rules = await this.getUserRules(userId);
      const activeRules = rules.filter(rule => rule.isActive);

      const appliedActions = [];

      for (const rule of activeRules) {
        if (this.evaluateConditions(email, rule.conditions)) {
          console.log(`📋 Applying rule: ${rule.name} to email: ${email.subject}`);
          
          for (const action of rule.actions) {
            await this.executeAction(email, action, userId);
            appliedActions.push({
              ruleId: rule.id,
              ruleName: rule.name,
              action: action.type
            });
          }
        }
      }

      return appliedActions;
    } catch (error) {
      console.error('Error applying rules to email:', error);
      throw error;
    }
  }

  // Evaluate rule conditions
  evaluateConditions(email, conditions) {
    if (!conditions || !conditions.rules || conditions.rules.length === 0) {
      return false;
    }

    const results = conditions.rules.map(rule => this.evaluateCondition(email, rule));

    if (conditions.type === 'all') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  // Evaluate a single condition
  evaluateCondition(email, condition) {
    const { field, operator, value } = condition;
    let fieldValue = '';

    // Get field value from email
    switch (field) {
      case 'from':
        fieldValue = email.from?.email?.toLowerCase() || '';
        break;
      case 'to':
        fieldValue = email.to?.map(t => t.email).join(',').toLowerCase() || '';
        break;
      case 'subject':
        fieldValue = email.subject?.toLowerCase() || '';
        break;
      case 'body':
        fieldValue = (email.body || email.plainText || '').toLowerCase();
        break;
      case 'hasAttachment':
        return email.attachments && email.attachments.length > 0;
      default:
        return false;
    }

    const compareValue = value?.toLowerCase() || '';

    // Apply operator
    switch (operator) {
      case 'contains':
        return fieldValue.includes(compareValue);
      case 'equals':
        return fieldValue === compareValue;
      case 'startsWith':
        return fieldValue.startsWith(compareValue);
      case 'endsWith':
        return fieldValue.endsWith(compareValue);
      case 'notContains':
        return !fieldValue.includes(compareValue);
      case 'exists':
        return fieldValue.length > 0;
      default:
        return false;
    }
  }

  // Execute an action on an email
  async executeAction(email, action, userId) {
    try {
      const emailRef = db.collection(COLLECTIONS.EMAILS).doc(email.id);

      switch (action.type) {
        case 'moveToFolder':
          await emailRef.update({
            folder: action.value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`📁 Moved email to folder: ${action.value}`);
          break;

        case 'addLabel':
          await emailRef.update({
            labels: admin.firestore.FieldValue.arrayUnion(action.value),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`🏷️  Added label: ${action.value}`);
          break;

        case 'markAsRead':
          await emailRef.update({
            isRead: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Marked as read`);
          break;

        case 'markAsUnread':
          await emailRef.update({
            isRead: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`📧 Marked as unread`);
          break;

        case 'star':
          await emailRef.update({
            isStarred: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`⭐ Starred email`);
          break;

        case 'delete':
          await emailRef.update({
            folder: 'trash',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`🗑️  Moved to trash`);
          break;

        case 'forward':
          // TODO: Implement email forwarding
          console.log(`↗️  Forward to: ${action.value}`);
          break;

        default:
          console.log(`⚠️  Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      throw error;
    }
  }
}

export default new EmailRulesService();
