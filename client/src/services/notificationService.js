/**
 * Browser Notification Service
 * Handles desktop notifications for the email application
 */

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.checkPermission();
  }

  /**
   * Check current notification permission status
   */
  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      console.log(`🔔 Notification permission: ${this.permission}`);
    } else {
      console.warn('⚠️ Notifications not supported in this browser');
    }
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log(`🔔 Notification permission ${permission}`);
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a new email notification
   * @param {Object} email Email data
   * @param {Function} onClick Callback when notification is clicked
   */
  showNewEmailNotification(email, onClick) {
    if (this.permission !== 'granted') {
      console.log('⚠️ Cannot show notification - permission not granted');
      return null;
    }

    const from = email.from?.name || email.from?.email || 'Unknown Sender';
    const subject = email.subject || '(No Subject)';
    const preview = this.getEmailPreview(email.body || email.plainText);

    const options = {
      body: `From: ${from}\n${subject}\n\n${preview}`,
      icon: '/mail-icon.png',
      badge: '/mail-badge.png',
      tag: email.id,
      requireInteraction: false,
      silent: false,
      data: { emailId: email.id, folder: email.folder }
    };

    try {
      const notification = new Notification('New Email', options);

      notification.onclick = () => {
        window.focus();
        if (onClick) {
          onClick(email);
        }
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      console.log(`✅ Notification shown for email: ${email.id}`);
      return notification;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show multiple new emails notification
   * @param {number} count Number of new emails
   * @param {Function} onClick Callback when notification is clicked
   */
  showMultipleEmailsNotification(count, onClick) {
    if (this.permission !== 'granted') {
      return null;
    }

    const options = {
      body: `You have ${count} new email${count > 1 ? 's' : ''}`,
      icon: '/mail-icon.png',
      badge: '/mail-badge.png',
      tag: 'multiple-emails',
      requireInteraction: false
    };

    try {
      const notification = new Notification('New Emails', options);

      notification.onclick = () => {
        window.focus();
        if (onClick) {
          onClick();
        }
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);

      console.log(`✅ Multiple emails notification shown: ${count} emails`);
      return notification;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }

  /**
   * Get email body preview (first 100 characters)
   * @param {string} body Email body (HTML or plain text)
   * @returns {string} Preview text
   */
  getEmailPreview(body) {
    if (!body) return '';
    
    // Strip HTML tags
    const text = body.replace(/<[^>]*>/g, '');
    
    // Get first 100 characters
    const preview = text.substring(0, 100).trim();
    
    return preview.length < text.length ? `${preview}...` : preview;
  }

  /**
   * Show a generic notification
   * @param {string} title Notification title
   * @param {Object} options Notification options
   * @param {Function} onClick Click handler
   */
  showNotification(title, options = {}, onClick) {
    if (this.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/mail-icon.png',
        ...options
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      return notification;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return null;
    }
  }

  /**
   * Check if notifications are supported
   * @returns {boolean}
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   * @returns {boolean}
   */
  isGranted() {
    return this.permission === 'granted';
  }

  /**
   * Check if permission was denied
   * @returns {boolean}
   */
  isDenied() {
    return this.permission === 'denied';
  }

  /**
   * Check if permission is still default (not asked yet)
   * @returns {boolean}
   */
  isDefault() {
    return this.permission === 'default';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for testing
export default NotificationService;
