import React, { useState } from 'react';
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
  InputLabel
} from '@mui/material';
import { Save } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { userAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailsPerPage: 25,
    autoReply: false,
    autoReplyMessage: ''
  });
  const [signature, setSignature] = useState('');

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
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

        <FormControlLabel
          control={
            <Switch
              checked={preferences.autoReply}
              onChange={(e) => handlePreferenceChange('autoReply', e.target.checked)}
            />
          }
          label="Enable auto-reply"
        />

        {preferences.autoReply && (
          <TextField
            fullWidth
            label="Auto-reply message"
            value={preferences.autoReplyMessage}
            onChange={(e) => handlePreferenceChange('autoReplyMessage', e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />
        )}
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
