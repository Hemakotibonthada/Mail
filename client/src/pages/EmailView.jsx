import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Collapse,
  Stack,
  alpha
} from '@mui/material';
import {
  ArrowBack,
  Reply,
  ReplyAll,
  Forward,
  Delete,
  Star,
  StarBorder,
  MoreVert,
  Download,
  ExpandMore,
  ExpandLess,
  Forum,
  AttachFile
} from '@mui/icons-material';
import { useEmailStore } from '../store/emailStore';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

export default function EmailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentEmail, loading, fetchEmailById, toggleStar, deleteEmail } = useEmailStore();
  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadEmails, setThreadEmails] = useState([]);

  useEffect(() => {
    loadEmail();
  }, [id]);

  const loadEmail = async () => {
    try {
      await fetchEmailById(id);
      // In a real implementation, fetch thread emails here
      // For now, we'll simulate thread detection
      if (currentEmail) {
        detectAndLoadThread();
      }
    } catch (error) {
      toast.error('Failed to load email');
    }
  };

  const detectAndLoadThread = () => {
    // Simulate thread detection by subject
    // In production, this would query emails with matching threadId or subject
    const mockThread = [];
    if (currentEmail?.subject?.includes('Re:') || currentEmail?.subject?.includes('Fwd:')) {
      // This email is part of a thread
      setThreadEmails(mockThread);
    }
  };

  const toggleThread = (emailId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const getThreadCount = () => {
    return threadEmails.length + 1; // +1 for current email
  };

  const cleanSubject = (subject) => {
    return subject?.replace(/^(Re:|Fwd:)\s*/gi, '').trim() || 'No Subject';
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReply = () => {
    navigate('/compose', {
      state: {
        replyTo: currentEmail,
        mode: 'reply'
      }
    });
  };

  const handleReplyAll = () => {
    navigate('/compose', {
      state: {
        replyTo: currentEmail,
        mode: 'replyAll'
      }
    });
  };

  const handleForward = () => {
    navigate('/compose', {
      state: {
        forward: currentEmail
      }
    });
  };

  const handleDelete = async () => {
    try {
      await deleteEmail(id);
      toast.success('Email moved to trash');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to delete email');
    }
  };

  const handleStarToggle = async () => {
    try {
      await toggleStar(id);
    } catch (error) {
      toast.error('Failed to update email');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'PPpp');
  };

  if (loading || !currentEmail) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Thread Header Bar */}
      {threadEmails.length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 2, 
            p: 2,
            bgcolor: alpha('#0078d4', 0.05),
            border: '1px solid',
            borderColor: alpha('#0078d4', 0.2),
            borderRadius: 2
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Forum sx={{ color: '#0078d4' }} />
            <Typography variant="body2" fontWeight={600} color="#0078d4">
              This conversation has {getThreadCount()} messages
            </Typography>
            <Chip 
              label={`${getThreadCount()} in thread`} 
              size="small" 
              sx={{ 
                bgcolor: '#0078d4', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Stack>
        </Paper>
      )}

      {/* Action Toolbar */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2, 
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: '#fafafa'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={1}>
            <IconButton onClick={handleBack} sx={{ borderRadius: 1 }}>
              <ArrowBack />
            </IconButton>
            <IconButton onClick={handleStarToggle} sx={{ borderRadius: 1 }}>
              {currentEmail.isStarred ? <Star sx={{ color: '#ffc107' }} /> : <StarBorder />}
            </IconButton>
            <IconButton onClick={handleDelete} sx={{ borderRadius: 1 }}>
              <Delete />
            </IconButton>
          </Box>
          <Box display="flex" gap={1}>
            <Button 
              startIcon={<Reply />} 
              onClick={handleReply}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 600
              }}
            >
              Reply
            </Button>
            <Button 
              startIcon={<ReplyAll />} 
              onClick={handleReplyAll}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 600
              }}
            >
              Reply All
            </Button>
            <Button 
              startIcon={<Forward />} 
              onClick={handleForward}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 600
              }}
            >
              Forward
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Email Content */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        {/* Subject with Thread Indicator */}
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="h5" fontWeight={600} sx={{ flexGrow: 1 }}>
            {cleanSubject(currentEmail.subject)}
          </Typography>
          {threadEmails.length > 0 && (
            <Chip 
              icon={<Forum />}
              label={`${getThreadCount()} messages`}
              size="small"
              sx={{ bgcolor: alpha('#0078d4', 0.1), color: '#0078d4' }}
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Sender Info */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar 
            sx={{ 
              bgcolor: '#0078d4',
              width: 48,
              height: 48,
              fontSize: '1.2rem',
              fontWeight: 600
            }}
          >
            {currentEmail.from?.name?.charAt(0) || currentEmail.from?.email?.charAt(0)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="body1" fontWeight={600}>
              {currentEmail.from?.name || currentEmail.from?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              to {currentEmail.to?.map(t => t.email).join(', ')}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(currentEmail.createdAt)}
          </Typography>
        </Box>

        {/* Attachments Preview */}
        {currentEmail.attachments && currentEmail.attachments.length > 0 && (
          <Box mb={3}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Attachments ({currentEmail.attachments.length})
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {currentEmail.attachments.map((att, idx) => (
                <Chip
                  key={idx}
                  icon={<AttachFile />}
                  label={att.filename}
                  size="small"
                  sx={{ 
                    bgcolor: alpha('#0078d4', 0.05),
                    '&:hover': { bgcolor: alpha('#0078d4', 0.1) }
                  }}
                />
              ))}
            </Stack>
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}

        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            To: {currentEmail.to?.map(t => t.email).join(', ')}
          </Typography>
          {currentEmail.cc && currentEmail.cc.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Cc: {currentEmail.cc.map(c => c.email).join(', ')}
            </Typography>
          )}
        </Box>

        {currentEmail.attachments && currentEmail.attachments.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" gutterBottom>
              Attachments ({currentEmail.attachments.length}):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {currentEmail.attachments.map((attachment, index) => (
                <Chip
                  key={index}
                  label={attachment.filename || `Attachment ${index + 1}`}
                  icon={<Download />}
                  onClick={() => window.open(attachment.storageUrl, '_blank')}
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Email Body */}
        <Box
          sx={{ 
            mt: 3,
            '& img': { maxWidth: '100%' },
            '& a': { color: '#0078d4' }
          }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(currentEmail.body || currentEmail.plainText)
          }}
        />
      </Paper>

      {/* Thread History (if exists) */}
      {threadEmails.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ px: 2 }}>
            Previous Messages in Thread
          </Typography>
          {threadEmails.map((email, index) => (
            <Paper
              key={email.id}
              elevation={0}
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {/* Thread Email Header */}
              <Box
                onClick={() => toggleThread(email.id)}
                sx={{
                  p: 2,
                  bgcolor: alpha('#0078d4', 0.02),
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha('#0078d4', 0.05)
                  },
                  borderBottom: expandedThreads[email.id] ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: '#0078d4', width: 32, height: 32 }}>
                    {email.from?.name?.charAt(0) || email.from?.email?.charAt(0)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {email.from?.name || email.from?.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(email.createdAt)}
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {expandedThreads[email.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>

              {/* Thread Email Body (Collapsible) */}
              <Collapse in={expandedThreads[email.id]}>
                <Box sx={{ p: 3 }}>
                  {email.attachments && email.attachments.length > 0 && (
                    <Box mb={2}>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {email.attachments.map((att, idx) => (
                          <Chip
                            key={idx}
                            icon={<AttachFile />}
                            label={att.filename}
                            size="small"
                            sx={{ bgcolor: alpha('#0078d4', 0.05) }}
                          />
                        ))}
                      </Stack>
                      <Divider sx={{ mt: 2, mb: 2 }} />
                    </Box>
                  )}
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(email.body || email.plainText)
                    }}
                  />
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
