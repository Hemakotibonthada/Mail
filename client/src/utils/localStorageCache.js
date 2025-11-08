/**
 * Local Storage Cache Utility
 * Stores emails and metadata in browser's local storage for faster loading
 */

const CACHE_PREFIX = 'email_cache_';
const CACHE_METADATA_KEY = 'email_cache_metadata';
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

class LocalStorageCache {
  constructor() {
    this.initializeMetadata();
  }

  initializeMetadata() {
    const metadata = this.getMetadata();
    if (!metadata) {
      this.setMetadata({
        folders: {},
        lastSync: {},
        version: '1.0'
      });
    }
  }

  getMetadata() {
    try {
      const data = localStorage.getItem(CACHE_METADATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get cache metadata:', error);
      return null;
    }
  }

  setMetadata(metadata) {
    try {
      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to set cache metadata:', error);
    }
  }

  getCacheKey(userId, folder) {
    return `${CACHE_PREFIX}${userId}_${folder}`;
  }

  /**
   * Store emails for a specific folder
   */
  setEmails(userId, folder, emails) {
    try {
      const cacheKey = this.getCacheKey(userId, folder);
      const cacheData = {
        emails,
        timestamp: Date.now(),
        count: emails.length
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Update metadata
      const metadata = this.getMetadata();
      if (!metadata.folders[userId]) {
        metadata.folders[userId] = {};
      }
      metadata.folders[userId][folder] = {
        count: emails.length,
        lastUpdated: Date.now()
      };
      metadata.lastSync[`${userId}_${folder}`] = Date.now();
      this.setMetadata(metadata);

      return true;
    } catch (error) {
      console.error('Failed to cache emails:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.clearOldestCache();
        return false;
      }
      return false;
    }
  }

  /**
   * Get cached emails for a specific folder
   */
  getEmails(userId, folder) {
    try {
      const cacheKey = this.getCacheKey(userId, folder);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
        this.clearFolder(userId, folder);
        return null;
      }

      return cacheData.emails;
    } catch (error) {
      console.error('Failed to get cached emails:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isCacheValid(userId, folder) {
    try {
      const cacheKey = this.getCacheKey(userId, folder);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return false;
      }

      const cacheData = JSON.parse(cached);
      return Date.now() - cacheData.timestamp < CACHE_EXPIRY_MS;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update a single email in the cache
   */
  updateEmail(userId, folder, emailId, updates) {
    try {
      const emails = this.getEmails(userId, folder);
      if (!emails) {
        return false;
      }

      const updatedEmails = emails.map(email =>
        email.id === emailId ? { ...email, ...updates } : email
      );

      return this.setEmails(userId, folder, updatedEmails);
    } catch (error) {
      console.error('Failed to update cached email:', error);
      return false;
    }
  }

  /**
   * Add a new email to the cache
   */
  addEmail(userId, folder, email) {
    try {
      const emails = this.getEmails(userId, folder) || [];
      const updatedEmails = [email, ...emails];
      return this.setEmails(userId, folder, updatedEmails);
    } catch (error) {
      console.error('Failed to add email to cache:', error);
      return false;
    }
  }

  /**
   * Remove an email from the cache
   */
  removeEmail(userId, folder, emailId) {
    try {
      const emails = this.getEmails(userId, folder);
      if (!emails) {
        return false;
      }

      const updatedEmails = emails.filter(email => email.id !== emailId);
      return this.setEmails(userId, folder, updatedEmails);
    } catch (error) {
      console.error('Failed to remove email from cache:', error);
      return false;
    }
  }

  /**
   * Clear cache for a specific folder
   */
  clearFolder(userId, folder) {
    try {
      const cacheKey = this.getCacheKey(userId, folder);
      localStorage.removeItem(cacheKey);

      // Update metadata
      const metadata = this.getMetadata();
      if (metadata.folders[userId]) {
        delete metadata.folders[userId][folder];
      }
      delete metadata.lastSync[`${userId}_${folder}`];
      this.setMetadata(metadata);

      return true;
    } catch (error) {
      console.error('Failed to clear folder cache:', error);
      return false;
    }
  }

  /**
   * Clear all cached emails for a user
   */
  clearUser(userId) {
    try {
      const metadata = this.getMetadata();
      const userFolders = metadata.folders[userId] || {};

      Object.keys(userFolders).forEach(folder => {
        this.clearFolder(userId, folder);
      });

      return true;
    } catch (error) {
      console.error('Failed to clear user cache:', error);
      return false;
    }
  }

  /**
   * Clear all cached emails
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(CACHE_METADATA_KEY);
      this.initializeMetadata();
      return true;
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Clear oldest cache when quota is exceeded
   */
  clearOldestCache() {
    try {
      const metadata = this.getMetadata();
      const syncTimes = metadata.lastSync;

      if (Object.keys(syncTimes).length === 0) {
        return;
      }

      // Find oldest cache
      let oldest = null;
      let oldestTime = Infinity;

      Object.entries(syncTimes).forEach(([key, time]) => {
        if (time < oldestTime) {
          oldestTime = time;
          oldest = key;
        }
      });

      if (oldest) {
        const [userId, folder] = oldest.split('_');
        this.clearFolder(userId, folder);
        console.log(`Cleared oldest cache: ${userId}/${folder}`);
      }
    } catch (error) {
      console.error('Failed to clear oldest cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const metadata = this.getMetadata();
      let totalEmails = 0;
      let totalSize = 0;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          const item = localStorage.getItem(key);
          totalSize += item.length * 2; // Rough size in bytes (UTF-16)
          try {
            const data = JSON.parse(item);
            totalEmails += data.emails?.length || 0;
          } catch (e) {
            // Skip invalid entries
          }
        }
      });

      return {
        totalEmails,
        totalSizeKB: Math.round(totalSize / 1024),
        folders: Object.keys(metadata.folders).reduce((acc, userId) => {
          acc[userId] = Object.keys(metadata.folders[userId]).length;
          return acc;
        }, {}),
        lastSync: metadata.lastSync
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Get last sync time for a folder
   */
  getLastSyncTime(userId, folder) {
    try {
      const metadata = this.getMetadata();
      return metadata.lastSync[`${userId}_${folder}`] || null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const emailCache = new LocalStorageCache();
