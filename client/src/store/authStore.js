import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  
  setUser: (user) => set({ user, loading: false }),
  
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
      return userCredential.user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
  
  clearError: () => set({ error: null })
}));
