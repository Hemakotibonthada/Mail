import React, { useEffect } from 'react';
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
  CircularProgress
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
  Download
} from '@mui/icons-material';
import { useEmailStore } from '../store/emailStore';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

export default function EmailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentEmail, loading, fetchEmailById, toggleStar, deleteEmail } = useEmailStore();

  useEffect(() => {
    loadEmail();
  }, [id]);

  const loadEmail = async () => {
    try {
      await fetchEmailById(id);
    } catch (error) {
      toast.error('Failed to load email');
    }
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
    <Box>
      <Paper elevation={2} sx={{ mb: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={1}>
            <IconButton onClick={handleBack}>
              <ArrowBack />
            </IconButton>
            <IconButton onClick={handleStarToggle}>
              {currentEmail.isStarred ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
            <IconButton onClick={handleDelete}>
              <Delete />
            </IconButton>
          </Box>
          <Box display="flex" gap={1}>
            <Button startIcon={<Reply />} onClick={handleReply}>
              Reply
            </Button>
            <Button startIcon={<ReplyAll />} onClick={handleReplyAll}>
              Reply All
            </Button>
            <Button startIcon={<Forward />} onClick={handleForward}>
              Forward
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {currentEmail.subject}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {currentEmail.from?.name?.charAt(0) || currentEmail.from?.email?.charAt(0)}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="body1" fontWeight="bold">
              {currentEmail.from?.name || currentEmail.from?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentEmail.from?.email}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatDate(currentEmail.createdAt)}
          </Typography>
        </Box>

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

        <Box
          sx={{ mt: 3 }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(currentEmail.body || currentEmail.plainText)
          }}
        />
      </Paper>
    </Box>
  );
}
