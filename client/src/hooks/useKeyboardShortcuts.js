import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(event.target.tagName) ||
                      event.target.isContentEditable;

      // Ignore shortcuts when typing
      if (isTyping && !event.ctrlKey && !event.metaKey) {
        return;
      }

      // Ctrl/Cmd + K - Search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
          toast.success('Search focused (Ctrl+K)');
        }
      }

      // C - Compose new email
      if (event.key === 'c' && !isTyping) {
        event.preventDefault();
        navigate('/compose');
        toast.success('Compose (C)');
      }

      // G + I - Go to Inbox
      if (event.key === 'g' && !isTyping) {
        const nextKey = new Promise((resolve) => {
          const handler = (e) => {
            resolve(e.key);
            document.removeEventListener('keydown', handler);
          };
          document.addEventListener('keydown', handler);
          setTimeout(() => {
            document.removeEventListener('keydown', handler);
            resolve(null);
          }, 1000);
        });

        nextKey.then((key) => {
          if (key === 'i') {
            navigate('/inbox');
            toast.success('Go to Inbox (G+I)');
          } else if (key === 's') {
            navigate('/sent');
            toast.success('Go to Sent (G+S)');
          } else if (key === 'd') {
            navigate('/drafts');
            toast.success('Go to Drafts (G+D)');
          } else if (key === 'c') {
            navigate('/calendar');
            toast.success('Go to Calendar (G+C)');
          } else if (key === 'o') {
            navigate('/contacts');
            toast.success('Go to Contacts (G+O)');
          }
        });
      }

      // R - Reply (when viewing email)
      if (event.key === 'r' && !isTyping && window.location.pathname.includes('/email/')) {
        event.preventDefault();
        // This would trigger reply action
        toast.info('Reply (R)');
      }

      // A - Reply All (when viewing email)
      if (event.key === 'a' && !isTyping && window.location.pathname.includes('/email/')) {
        event.preventDefault();
        toast.info('Reply All (A)');
      }

      // F - Forward (when viewing email)
      if (event.key === 'f' && !isTyping && window.location.pathname.includes('/email/')) {
        event.preventDefault();
        toast.info('Forward (F)');
      }

      // ? - Show keyboard shortcuts
      if (event.key === '?' && !isTyping) {
        event.preventDefault();
        showShortcutsHelp();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);
};

const showShortcutsHelp = () => {
  const shortcuts = `
Keyboard Shortcuts:
─────────────────
Ctrl+K    Search emails
C         Compose new email
G+I       Go to Inbox
G+S       Go to Sent
G+D       Go to Drafts
G+C       Go to Calendar
G+O       Go to Contacts
R         Reply (in email view)
A         Reply All (in email view)
F         Forward (in email view)
?         Show this help
  `;
  
  toast(shortcuts, {
    duration: 8000,
    style: {
      whiteSpace: 'pre',
      fontFamily: 'monospace',
      fontSize: '0.875rem'
    }
  });
};
