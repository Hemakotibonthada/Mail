import { create } from 'zustand';
import { emailAPI } from '../services/api';
import { emailCache } from '../utils/localStorageCache';

export const useEmailStore = create((set, get) => ({
  emails: [],
  currentEmail: null,
  currentFolder: 'inbox',
  loading: false,
  error: null,
  totalEmails: 0,
  unreadCount: 0,
  realtimeEnabled: true,
  cacheEnabled: true,
  isLoadingFromCache: false,
  
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setEmails: (emails) => set({ emails }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setRealtimeEnabled: (enabled) => set({ realtimeEnabled: enabled }),
  setCacheEnabled: (enabled) => set({ cacheEnabled: enabled }),
  
  fetchEmails: async (folder = 'inbox', options = {}) => {
    const state = get();
    const userId = options.userId; // Pass userId from auth
    
    try {
      // Try to load from cache first if enabled
      if (state.cacheEnabled && userId) {
        const cachedEmails = emailCache.getEmails(userId, folder);
        
        if (cachedEmails && cachedEmails.length > 0) {
          // Load from cache immediately
          set({ 
            emails: cachedEmails, 
            currentFolder: folder,
            isLoadingFromCache: true
          });
          
          // Then fetch fresh data in background
          emailAPI.getByFolder(folder, options)
            .then(response => {
              // Update cache and state with fresh data
              // Server returns { success, data: emails[] }
              const freshEmails = Array.isArray(response.data?.data) ? response.data.data : [];
              if (freshEmails.length > 0) {
                emailCache.setEmails(userId, folder, freshEmails);
                set({ 
                  emails: freshEmails, 
                  loading: false,
                  isLoadingFromCache: false
                });
              }
            })
            .catch(error => {
              console.error('Background fetch failed:', error);
              set({ isLoadingFromCache: false });
            });
          
          return cachedEmails;
        }
      }
      
      // No cache or cache disabled - fetch from server
      set({ loading: true, error: null });
      const response = await emailAPI.getByFolder(folder, options);
      
      // Server returns { success, data: emails[] }
      const emailsData = Array.isArray(response.data?.data) ? response.data.data : [];
      
      // Cache the results
      if (state.cacheEnabled && userId && emailsData.length > 0) {
        emailCache.setEmails(userId, folder, emailsData);
      }
      
      set({ 
        emails: emailsData, 
        currentFolder: folder,
        loading: false 
      });
      return emailsData;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  fetchEmailById: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await emailAPI.getById(id);
      set({ currentEmail: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  sendEmail: async (emailData) => {
    try {
      set({ loading: true, error: null });
      const response = await emailAPI.send(emailData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  saveDraft: async (draftData) => {
    try {
      const response = await emailAPI.saveDraft(draftData);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateEmail: async (id, updates) => {
    const state = get();
    
    try {
      await emailAPI.update(id, updates);
      
      // Update local state
      const emails = state.emails.map(email => 
        email.id === id ? { ...email, ...updates } : email
      );
      set({ emails });
      
      // Update cache
      if (state.cacheEnabled && state.currentFolder) {
        const userId = updates.userId || state.emails.find(e => e.id === id)?.userId;
        if (userId) {
          emailCache.updateEmail(userId, state.currentFolder, id, updates);
        }
      }
      
      if (state.currentEmail?.id === id) {
        set({ currentEmail: { ...state.currentEmail, ...updates } });
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteEmail: async (id, permanent = false) => {
    const state = get();
    
    try {
      await emailAPI.delete(id, permanent);
      
      // Remove from local state
      const emails = state.emails.filter(email => email.id !== id);
      set({ emails });
      
      // Remove from cache
      if (state.cacheEnabled && state.currentFolder) {
        const email = state.emails.find(e => e.id === id);
        if (email?.userId) {
          emailCache.removeEmail(email.userId, state.currentFolder, id);
        }
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  searchEmails: async (query, options = {}) => {
    try {
      set({ loading: true, error: null });
      const response = await emailAPI.search(query, options);
      set({ emails: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  markAsRead: async (id) => {
    await get().updateEmail(id, { isRead: true });
  },
  
  markAsUnread: async (id) => {
    await get().updateEmail(id, { isRead: false });
  },
  
  toggleStar: async (id) => {
    const email = get().emails.find(e => e.id === id);
    await get().updateEmail(id, { isStarred: !email?.isStarred });
  },
  
  moveToFolder: async (id, folder) => {
    await get().updateEmail(id, { folder });
  },
  
  bulkOperation: async (emailIds, action, data) => {
    try {
      set({ loading: true });
      await emailAPI.bulkOperation(emailIds, action, data);
      await get().fetchEmails(get().currentFolder);
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  clearCache: (userId) => {
    if (userId) {
      emailCache.clearUser(userId);
    } else {
      emailCache.clearAll();
    }
  },
  
  getCacheStats: () => {
    return emailCache.getStats();
  },
  
  clearError: () => set({ error: null })
}));
