import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  Save as SaveIcon
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEmailStore } from '../store/emailStore';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image'],
    ['clean']
  ]
};

export default function Compose() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { sendEmail, saveDraft } = useEmailStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });
  const [attachments, setAttachments] = useState([]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 25MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('emailId', 'draft_' + Date.now());

        const response = await emailAPI.uploadAttachment(formData);
        setAttachments(prev => [...prev, response.data]);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const parseEmails = (emailString) => {
    return emailString
      .split(',')
      .map(email => email.trim())
      .filter(email => email)
      .map(email => ({ email, name: '' }));
  };

  const handleSend = async () => {
    if (!formData.to.trim()) {
      toast.error('Please enter at least one recipient');
      return;
    }

    setLoading(true);
    try {
      const emailData = {
        to: parseEmails(formData.to),
        cc: formData.cc ? parseEmails(formData.cc) : [],
        bcc: formData.bcc ? parseEmails(formData.bcc) : [],
        subject: formData.subject || '(No Subject)',
        body: formData.body,
        plainText: formData.body.replace(/<[^>]*>/g, ''),
        attachments: attachments.map(a => a.id)
      };

      await sendEmail(emailData);
      toast.success('Email sent successfully!');
      navigate('/sent');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        to: parseEmails(formData.to),
        cc: formData.cc ? parseEmails(formData.cc) : [],
        bcc: formData.bcc ? parseEmails(formData.bcc) : [],
        subject: formData.subject || '(No Subject)',
        body: formData.body,
        plainText: formData.body.replace(/<[^>]*>/g, ''),
        attachments: attachments.map(a => a.id),
        from: { email: '', name: '' }
      };

      await saveDraft(draftData);
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">New Message</Typography>
          <IconButton onClick={() => navigate(-1)}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <TextField
          fullWidth
          label="To"
          value={formData.to}
          onChange={(e) => handleChange('to', e.target.value)}
          placeholder="recipient@example.com, another@example.com"
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Cc"
          value={formData.cc}
          onChange={(e) => handleChange('cc', e.target.value)}
          placeholder="cc@example.com"
          margin="normal"
        />

        <TextField
          fullWidth
          label="Bcc"
          value={formData.bcc}
          onChange={(e) => handleChange('bcc', e.target.value)}
          placeholder="bcc@example.com"
          margin="normal"
        />

        <TextField
          fullWidth
          label="Subject"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          margin="normal"
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Message
          </Typography>
          <ReactQuill
            theme="snow"
            value={formData.body}
            onChange={(value) => handleChange('body', value)}
            modules={quillModules}
            style={{ height: 300, marginBottom: 50 }}
          />
        </Box>

        {attachments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Attachments:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {attachments.map((attachment) => (
                <Chip
                  key={attachment.id}
                  label={`${attachment.filename} (${(attachment.size / 1024).toFixed(1)} KB)`}
                  onDelete={() => handleRemoveAttachment(attachment.id)}
                  icon={<AttachFile />}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box display="flex" gap={2} justifyContent="space-between" mt={3}>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>
          </Box>
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple
            />
            <Button
              variant="outlined"
              startIcon={<AttachFile />}
              onClick={() => fileInputRef.current?.click()}
            >
              Attach Files
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
