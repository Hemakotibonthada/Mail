import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  Toolbar,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Star,
  StarBorder,
  Delete,
  Refresh,
  Search as SearchIcon,
  MoreVert,
  Archive
} from '@mui/icons-material';
import { useEmailStore } from '../store/emailStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Inbox({ folder = 'inbox' }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { emails, loading, fetchEmails, toggleStar, deleteEmail, markAsRead } = useEmailStore();

  useEffect(() => {
    loadEmails();
  }, [folder]);

  const loadEmails = async () => {
    try {
      await fetchEmails(folder);
    } catch (error) {
      toast.error('Failed to load emails');
    }
  };

  const handleEmailClick = async (emailId) => {
    try {
      await markAsRead(emailId);
      navigate(`/email/${emailId}`);
    } catch (error) {
      toast.error('Failed to open email');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(emails.map(email => email.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (emailId) => {
    setSelected(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleStarToggle = async (e, emailId) => {
    e.stopPropagation();
    try {
      await toggleStar(emailId);
    } catch (error) {
      toast.error('Failed to update email');
    }
  };

  const handleDelete = async (emailId) => {
    try {
      await deleteEmail(emailId);
      toast.success('Email moved to trash');
    } catch (error) {
      toast.error('Failed to delete email');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selected) {
        await deleteEmail(id);
      }
      setSelected([]);
      toast.success(`${selected.length} emails moved to trash`);
    } catch (error) {
      toast.error('Failed to delete emails');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    // Implement search
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Toolbar>
          <Checkbox
            checked={selected.length === emails.length && emails.length > 0}
            indeterminate={selected.length > 0 && selected.length < emails.length}
            onChange={handleSelectAll}
          />
          {selected.length > 0 && (
            <>
              <Typography sx={{ ml: 2 }}>{selected.length} selected</Typography>
              <IconButton onClick={handleBulkDelete}>
                <Delete />
              </IconButton>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <TextField
            size="small"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mr: 2, width: 300 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={loadEmails}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>

      <Paper elevation={2}>
        {emails.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="h6" color="text.secondary">
              No emails in {folder}
            </Typography>
          </Box>
        ) : (
          <List>
            {emails.map((email) => (
              <ListItem
                key={email.id}
                disablePadding
                secondaryAction={
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                      {formatDate(email.createdAt)}
                    </Typography>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(email.id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: email.isRead ? 'transparent' : 'action.hover'
                }}
              >
                <Checkbox
                  checked={selected.includes(email.id)}
                  onChange={() => handleSelect(email.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <IconButton onClick={(e) => handleStarToggle(e, email.id)}>
                  {email.isStarred ? <Star color="warning" /> : <StarBorder />}
                </IconButton>
                <ListItemButton onClick={() => handleEmailClick(email.id)}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant="body1"
                          fontWeight={email.isRead ? 400 : 700}
                          sx={{ minWidth: 200 }}
                        >
                          {folder === 'sent' ? email.to[0]?.name || email.to[0]?.email : email.from?.name || email.from?.email}
                        </Typography>
                        {email.attachments?.length > 0 && (
                          <Chip label={`📎 ${email.attachments.length}`} size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ maxWidth: '70%' }}
                      >
                        {email.subject} - {email.plainText?.substring(0, 100)}...
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
