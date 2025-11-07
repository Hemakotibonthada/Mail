import { create } from 'zustand';
import { emailAPI } from '../services/api';

export const useEmailStore = create((set, get) => ({
  emails: [],
  currentEmail: null,
  currentFolder: 'inbox',
  loading: false,
  error: null,
  totalEmails: 0,
  unreadCount: 0,
  
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  
  fetchEmails: async (folder = 'inbox', options = {}) => {
    try {
      set({ loading: true, error: null });
      const response = await emailAPI.getByFolder(folder, options);
      set({ 
        emails: response.data, 
        currentFolder: folder,
        loading: false 
      });
      return response.data;
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
    try {
      await emailAPI.update(id, updates);
      
      // Update local state
      const emails = get().emails.map(email => 
        email.id === id ? { ...email, ...updates } : email
      );
      set({ emails });
      
      if (get().currentEmail?.id === id) {
        set({ currentEmail: { ...get().currentEmail, ...updates } });
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  deleteEmail: async (id, permanent = false) => {
    try {
      await emailAPI.delete(id, permanent);
      
      // Remove from local state
      const emails = get().emails.filter(email => email.id !== id);
      set({ emails });
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
  
  clearError: () => set({ error: null })
}));
