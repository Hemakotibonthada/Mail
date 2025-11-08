import { useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';

/**
 * Custom hook for real-time email synchronization using Firestore listeners
 * Subscribes to email changes and updates the store automatically
 */
export const useRealtimeEmails = (folder = 'inbox', enabled = true) => {
  const { user } = useAuthStore();
  const { emails, setEmails, setUnreadCount, currentFolder } = useEmailStore();
  const unsubscribeRef = useRef(null);
  const lastEmailCountRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || !user?.uid || !folder) {
      return;
    }

    console.log(`📡 Setting up real-time listener for folder: ${folder}`);

    try {
      // Query for emails in the current folder for this user
      const emailsRef = collection(db, 'emails');
      const q = query(
        emailsRef,
        where('userId', '==', user.uid),
        where('folder', '==', folder),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const updatedEmails = [];
          let unreadCount = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const emailData = {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            };
            updatedEmails.push(emailData);

            // Count unread emails
            if (!data.isRead && folder === 'inbox') {
              unreadCount++;
            }
          });

          // Detect new emails
          const currentCount = updatedEmails.length;
          const previousCount = lastEmailCountRef.current;

          if (previousCount > 0 && currentCount > previousCount) {
            const newEmailsCount = currentCount - previousCount;
            const latestEmail = updatedEmails[0];
            
            // Show notification for new email
            if (folder === 'inbox' && latestEmail) {
              // Toast notification
              toast.success(
                `New email from ${latestEmail.from?.name || latestEmail.from?.email || 'Unknown'}`,
                {
                  duration: 4000,
                  icon: '📧',
                  onClick: () => navigate(`/email/${latestEmail.id}`)
                }
              );

              // Desktop notification
              notificationService.showNewEmailNotification(latestEmail, (email) => {
                navigate(`/email/${email.id}`);
              });
            }
          }

          lastEmailCountRef.current = currentCount;

          // Update store
          useEmailStore.setState({ 
            emails: updatedEmails,
            loading: false 
          });

          if (folder === 'inbox') {
            setUnreadCount(unreadCount);
          }

          console.log(`✅ Real-time update: ${currentCount} emails in ${folder}, ${unreadCount} unread`);
        },
        (error) => {
          console.error('❌ Real-time listener error:', error);
          
          // Handle missing index error gracefully
          if (error.code === 'failed-precondition') {
            console.warn('⚠️ Firestore index not ready yet. Real-time sync will activate once index is created.');
            toast.error('Database index is building. Real-time sync will be available shortly.', {
              duration: 5000
            });
          } else {
            toast.error('Failed to sync emails in real-time');
          }
        }
      );

      unsubscribeRef.current = unsubscribe;

      // Cleanup function
      return () => {
        console.log(`🔌 Unsubscribing from real-time listener for folder: ${folder}`);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ Error setting up real-time listener:', error);
    }
  }, [user?.uid, folder, enabled, navigate]);

  return {
    emails,
    isListening: !!unsubscribeRef.current
  };
};

/**
 * Hook for listening to unread count across all folders
 */
export const useRealtimeUnreadCount = () => {
  const { user } = useAuthStore();
  const { setUnreadCount } = useEmailStore();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    console.log(`📊 Setting up real-time unread count listener`);

    try {
      const emailsRef = collection(db, 'emails');
      const q = query(
        emailsRef,
        where('userId', '==', user.uid),
        where('folder', '==', 'inbox'),
        where('isRead', '==', false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const unreadCount = snapshot.size;
          setUnreadCount(unreadCount);
          console.log(`📊 Unread count updated: ${unreadCount}`);
        },
        (error) => {
          console.error('❌ Unread count listener error:', error);
        }
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ Error setting up unread count listener:', error);
    }
  }, [user?.uid, setUnreadCount]);
};

/**
 * Hook for requesting notification permission
 */
export const useNotificationPermission = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Request permission after a short delay (better UX)
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log(`🔔 Notification permission: ${permission}`);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);
};
