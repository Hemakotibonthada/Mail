import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  CircularProgress,
  Avatar,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Refresh,
  Cancel,
  Schedule,
  Send,
  AccessTime,
  MoreVert
} from '@mui/icons-material';
import { useEmailStore } from '../store/emailStore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import EmailSkeleton from '../components/EmailSkeleton';

export default function Outbox() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { emails, loading, fetchEmails, recallEmail, processOutbox } = useEmailStore();
  const [confirmRecall, setConfirmRecall] = useState(null);
  const [processingEmails, setProcessingEmails] = useState(new Set());

  useEffect(() => {
    loadOutbox();
    
    // Auto-refresh every 5 seconds to show updated countdown
    const interval = setInterval(loadOutbox, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOutbox = async () => {
    try {
      await fetchEmails('outbox', { userId: user?.uid });
    } catch (error) {
      console.error('Error loading outbox:', error);
    }
  };

  const handleRecall = async (emailId) => {
    setProcessingEmails(prev => new Set(prev).add(emailId));
    try {
      await recallEmail(emailId);
      toast.success('Email recalled successfully');
      setConfirmRecall(null);
      await loadOutbox();
    } catch (error) {
      toast.error('Failed to recall email: ' + error.message);
    } finally {
      setProcessingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const getTimeRemaining = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled - now;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec <= 0) return { seconds: 0, text: 'Sending...', color: 'success' };
    if (diffSec <= 30) return { seconds: diffSec, text: `${diffSec}s`, color: 'error' };
    if (diffSec <= 60) return { seconds: diffSec, text: `${diffSec}s`, color: 'warning' };
    
    const minutes = Math.floor(diffSec / 60);
    return { seconds: diffSec, text: `${minutes}m`, color: 'primary' };
  };

  const getProgress = (scheduledTime, delaySeconds = 30) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const created = new Date(scheduled.getTime() - (delaySeconds * 1000));
    
    const totalTime = scheduled - created;
    const elapsed = now - created;
    const progress = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
    
    return progress;
  };

  const outboxEmails = emails.filter(email => email.folder === 'outbox' || !email.folder);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2}
        pb={2}
        borderBottom="1px solid #edebe9"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Schedule sx={{ fontSize: 32, color: '#0078d4' }} />
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                color: '#323130'
              }}
            >
              Outbox
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Emails waiting to be sent
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={loadOutbox} disabled={loading}>
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Emails in the outbox will be sent after a 30-second delay. You can recall them before they are sent.
      </Alert>

      {/* Emails List */}
      {loading && outboxEmails.length === 0 ? (
        <EmailSkeleton count={5} />
      ) : outboxEmails.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 8, 
            textAlign: 'center',
            border: '1px solid #edebe9',
            borderRadius: '4px'
          }}
        >
          <Schedule sx={{ fontSize: 64, color: '#a19f9d', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Outbox is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Emails you send will appear here briefly before being sent
          </Typography>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => navigate('/compose')}
            sx={{
              bgcolor: '#0078d4',
              textTransform: 'none',
              '&:hover': { bgcolor: '#106ebe' }
            }}
          >
            Compose Email
          </Button>
        </Paper>
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            border: '1px solid #edebe9',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <List sx={{ p: 0 }}>
            {outboxEmails.map((email) => {
              const timeRemaining = getTimeRemaining(email.scheduledSendTime);
              const progress = getProgress(email.scheduledSendTime);
              const isProcessing = processingEmails.has(email.id);

              return (
                <ListItem
                  key={email.id}
                  disablePadding
                  sx={{
                    borderBottom: '1px solid #edebe9',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemButton
                    onClick={() => navigate(`/email/${email.id}`)}
                    sx={{
                      py: 2,
                      '&:hover': {
                        bgcolor: '#f3f2f1'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, width: '100%' }}>
                      {/* Avatar */}
                      <Avatar 
                        sx={{ 
                          bgcolor: '#0078d4',
                          width: 40,
                          height: 40
                        }}
                      >
                        <Schedule />
                      </Avatar>

                      {/* Email Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: '#323130',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            To: {email.to?.map(t => t.email || t).join(', ')}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" gap={1}>
                            {/* Countdown Chip */}
                            <Chip
                              icon={<AccessTime />}
                              label={timeRemaining.text}
                              size="small"
                              color={timeRemaining.color}
                              sx={{ fontWeight: 600 }}
                            />

                            {/* Recall Button */}
                            <Tooltip title="Recall email">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmRecall(email);
                                  }}
                                  disabled={timeRemaining.seconds === 0 || isProcessing}
                                  sx={{
                                    color: '#d13438',
                                    '&:hover': {
                                      bgcolor: '#fde7e9'
                                    }
                                  }}
                                >
                                  {isProcessing ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <Cancel />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            color: '#323130',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {email.subject || '(No subject)'}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 1
                          }}
                        >
                          {email.body?.replace(/<[^>]*>/g, '').substring(0, 100) || '(No content)'}
                        </Typography>

                        {/* Progress Bar */}
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          color={timeRemaining.color}
                          sx={{ 
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#edebe9'
                          }}
                        />

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Scheduled: {email.scheduledSendTime ? formatDistanceToNow(new Date(email.scheduledSendTime), { addSuffix: true }) : 'Now'}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Recall Confirmation Dialog */}
      <Dialog
        open={Boolean(confirmRecall)}
        onClose={() => setConfirmRecall(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Recall Email</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to recall this email? It will be moved to drafts and will not be sent.
          </Typography>
          {confirmRecall && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f3f2f1', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                To: {confirmRecall.to?.map(t => t.email || t).join(', ')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Subject: {confirmRecall.subject || '(No subject)'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRecall(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleRecall(confirmRecall.id)}
            variant="contained"
            color="error"
            startIcon={<Cancel />}
          >
            Recall Email
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
