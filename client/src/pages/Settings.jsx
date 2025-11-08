import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { Save, Info, DeleteSweep, Storage } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuthStore();
  const { cacheEnabled, setCacheEnabled, clearCache, getCacheStats } = useEmailStore();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailsPerPage: 25
  });
  const [signature, setSignature] = useState('');
  const [cacheStats, setCacheStats] = useState(null);
  
  // Auto-reply state
  const [autoReply, setAutoReply] = useState({
    isActive: false,
    subject: 'Out of Office',
    message: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    sendOnlyOnce: true
  });
  const [autoReplyLoading, setAutoReplyLoading] = useState(false);

  useEffect(() => {
    fetchAutoReply();
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  const fetchAutoReply = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auto-reply', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.autoReply) {
          setAutoReply({
            isActive: data.autoReply.isActive,
            subject: data.autoReply.subject || 'Out of Office',
            message: data.autoReply.message || '',
            startDate: data.autoReply.startDate?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            endDate: data.autoReply.endDate?.toDate?.()?.toISOString().split('T')[0] || '',
            sendOnlyOnce: data.autoReply.sendOnlyOnce !== false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching auto-reply:', error);
    }
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleAutoReplyChange = (field, value) => {
    setAutoReply(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAutoReply = async () => {
    setAutoReplyLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auto-reply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoReply)
      });

      if (response.ok) {
        toast.success('Auto-reply settings saved');
        fetchAutoReply();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save auto-reply settings');
    } finally {
      setAutoReplyLoading(false);
    }
  };

  const handleToggleAutoReply = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auto-reply/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAutoReply(prev => ({ ...prev, isActive: data.isActive }));
        toast.success(`Auto-reply ${data.isActive ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to toggle auto-reply');
    }
  };

  const handleSave = async () => {
    try {
      await userAPI.updateEmployee(user.uid, {
        preferences,
        signature
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached emails? This will not delete emails from the server.')) {
      clearCache(user?.uid);
      updateCacheStats();
      toast.success('Cache cleared successfully!');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TextField
          fullWidth
          label="Email"
          value={user?.email || ''}
          disabled
          margin="normal"
        />

        <TextField
          fullWidth
          label="Display Name"
          value={user?.displayName || ''}
          disabled
          margin="normal"
        />
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormControl fullWidth margin="normal">
          <InputLabel>Theme</InputLabel>
          <Select
            value={preferences.theme}
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
            label="Theme"
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="auto">Auto</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Emails per page</InputLabel>
          <Select
            value={preferences.emailsPerPage}
            onChange={(e) => handlePreferenceChange('emailsPerPage', e.target.value)}
            label="Emails per page"
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Auto-Reply / Vacation Responder */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Auto-Reply (Vacation Responder)
          </Typography>
          <Chip
            label={autoReply.isActive ? 'Active' : 'Inactive'}
            color={autoReply.isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
          Auto-reply will automatically respond to incoming emails during your absence. 
          You can set start and end dates, and choose to send only one reply per sender.
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={autoReply.isActive}
              onChange={handleToggleAutoReply}
            />
          }
          label="Enable auto-reply"
        />

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Subject"
            value={autoReply.subject}
            onChange={(e) => handleAutoReplyChange('subject', e.target.value)}
            margin="normal"
            helperText="Subject line for auto-reply emails"
          />

          <TextField
            fullWidth
            label="Message"
            value={autoReply.message}
            onChange={(e) => handleAutoReplyChange('message', e.target.value)}
            multiline
            rows={4}
            margin="normal"
            helperText="Use {sender} to include sender's name, {date} for current date"
          />

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="Start Date"
              value={autoReply.startDate}
              onChange={(e) => handleAutoReplyChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              type="date"
              label="End Date (Optional)"
              value={autoReply.endDate}
              onChange={(e) => handleAutoReplyChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Leave empty for no end date"
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={autoReply.sendOnlyOnce}
                onChange={(e) => handleAutoReplyChange('sendOnlyOnce', e.target.checked)}
              />
            }
            label="Send only one reply per sender"
            sx={{ mt: 2 }}
          />

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              onClick={handleSaveAutoReply}
              disabled={autoReplyLoading}
            >
              Save Auto-Reply Settings
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Email Signature
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <ReactQuill
          theme="snow"
          value={signature}
          onChange={setSignature}
          style={{ height: 150, marginBottom: 50 }}
        />
      </Paper>

      {/* Cache Management Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <Storage />
          <Typography variant="h6">
            Cache & Storage
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Caching stores emails locally on your browser for faster loading. 
            Emails are automatically synced in the background to stay up-to-date.
          </Typography>
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={cacheEnabled}
              onChange={(e) => setCacheEnabled(e.target.checked)}
            />
          }
          label="Enable email caching"
        />

        {cacheStats && (
          <Card variant="outlined" sx={{ mt: 3, bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Cache Statistics
              </Typography>
              <Stack spacing={1} mt={2}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Total Cached Emails:
                  </Typography>
                  <Chip label={cacheStats.totalEmails} size="small" color="primary" />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Storage Used:
                  </Typography>
                  <Chip label={`${cacheStats.totalSizeKB} KB`} size="small" color="info" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            startIcon={<DeleteSweep />}
            onClick={handleClearCache}
            color="error"
          >
            Clear Cache
          </Button>
        </Box>
      </Paper>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          size="large"
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
}
