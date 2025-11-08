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
  CircularProgress,
  Stack,
  alpha,
  Collapse,
  Tooltip,
  Popover,
  Dialog,
  DialogContent,
  DialogTitle,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  Save as SaveIcon,
  ExpandMore,
  ExpandLess,
  Image,
  InsertEmoticon,
  FormatBold,
  FormatItalic,
  CloudUpload,
  Delete,
  Visibility,
  InsertDriveFile,
  PictureAsPdf
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EmojiPicker from 'emoji-picker-react';
import { useEmailStore } from '../store/emailStore';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }, { 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

export default function Compose() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const { sendEmail, saveDraft, sendToOutbox } = useEmailStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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
    await processFiles(files);
    e.target.value = ''; // Reset input
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Emoji picker handlers
  const handleEmojiClick = (event) => {
    setEmojiAnchor(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchor(null);
  };

  const onEmojiSelect = (emojiObject) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const cursorPosition = editor.getSelection()?.index || editor.getLength();
      editor.insertText(cursorPosition, emojiObject.emoji);
      editor.setSelection(cursorPosition + emojiObject.emoji.length);
    }
    handleEmojiClose();
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const processFiles = async (files) => {
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 25MB limit`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await emailAPI.uploadAttachment(formData);
        
        setAttachments(prev => [...prev, {
          id: response.data.id,
          filename: file.name,
          size: file.size,
          type: file.type,
          url: response.data.url
        }]);
        
        toast.success(`${file.name} attached successfully`);
      } catch (error) {
        toast.error(`Failed to attach ${file.name}`);
      }
    }
  };

  // File preview handlers
  const handlePreview = (attachment) => {
    setPreviewFile(attachment);
    setPreviewDialog(true);
  };

  const handleClosePreview = () => {
    setPreviewDialog(false);
    setPreviewFile(null);
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <Image color="primary" />;
    if (type === 'application/pdf') return <PictureAsPdf color="error" />;
    return <InsertDriveFile color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

      // Send to outbox first (with 30-second delay before actual send)
      await sendToOutbox(emailData);
      toast.success('Email added to outbox. You have 30 seconds to recall it.', {
        duration: 5000,
        icon: '⏱️'
      });
      navigate('/outbox');
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
    <Box
      sx={{
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 1300 : 'auto',
        bgcolor: isMobile ? 'background.default' : 'transparent',
        overflow: isMobile ? 'auto' : 'visible'
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 3 },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: 'divider',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
          minHeight: isMobile ? '100vh' : 'auto'
        }}
      >
        {/* Header with gradient */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
            <Box
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha('#1976d2', 0.2)} 0%, ${alpha('#42a5f5', 0.1)} 100%)`,
              }}
            >
              <Send sx={{ color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                New Message
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Compose and send your email
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Close">
            <IconButton 
              onClick={() => navigate(-1)}
              size={isMobile ? "medium" : "small"}
              sx={{
                '&:hover': {
                  bgcolor: alpha('#f44336', 0.1),
                  color: 'error.main'
                }
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

        {/* Enhanced Form Fields */}
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          <Box>
            <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
              <TextField
                fullWidth
                label="To"
                value={formData.to}
                onChange={(e) => handleChange('to', e.target.value)}
                size={isMobile ? "small" : "medium"}
                placeholder="recipient@example.com"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: 2
                  }
                }}
              />
              <Button
                size="small"
                onClick={() => setShowCc(!showCc)}
                sx={{ minWidth: 60, textTransform: 'none' }}
              >
                Cc
              </Button>
              <Button
                size="small"
                onClick={() => setShowBcc(!showBcc)}
                sx={{ minWidth: 60, textTransform: 'none' }}
              >
                Bcc
              </Button>
            </Stack>
          </Box>

          <Collapse in={showCc}>
            <TextField
              fullWidth
              label="Cc"
              value={formData.cc}
              onChange={(e) => handleChange('cc', e.target.value)}
              placeholder="cc@example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }
              }}
            />
          </Collapse>

          <Collapse in={showBcc}>
            <TextField
              fullWidth
              label="Bcc"
              value={formData.bcc}
              onChange={(e) => handleChange('bcc', e.target.value)}
              placeholder="bcc@example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }
              }}
            />
          </Collapse>

          <TextField
            fullWidth
            label="Subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Enter subject..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                borderRadius: 2
              }
            }}
          />

          {/* Enhanced Rich Text Editor with Emoji Picker */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Message
              </Typography>
              <Tooltip title="Insert Emoji">
                <IconButton size="small" onClick={handleEmojiClick} sx={{ color: '#0078d4' }}>
                  <InsertEmoticon />
                </IconButton>
              </Tooltip>
            </Stack>
            
            <Box
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                position: 'relative',
                '& .quill': {
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isDragging ? '#0078d4' : 'divider',
                  transition: 'all 0.3s ease'
                },
                '& .ql-toolbar': {
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  bgcolor: alpha('#1976d2', 0.02),
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                },
                '& .ql-container': {
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }
              }}
            >
              {isDragging && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: alpha('#0078d4', 0.1),
                    border: '3px dashed #0078d4',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    pointerEvents: 'none'
                  }}
                >
                  <Stack alignItems="center" spacing={2}>
                    <CloudUpload sx={{ fontSize: 60, color: '#0078d4' }} />
                    <Typography variant="h6" color="#0078d4" fontWeight={600}>
                      Drop files here to attach
                    </Typography>
                  </Stack>
                </Box>
              )}
              
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.body}
                onChange={(value) => handleChange('body', value)}
                modules={quillModules}
                style={{ height: 350, marginBottom: 60 }}
                placeholder="Type your message here... or drag & drop files to attach"
              />
            </Box>

            {/* Emoji Picker Popover */}
            <Popover
              open={Boolean(emojiAnchor)}
              anchorEl={emojiAnchor}
              onClose={handleEmojiClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <EmojiPicker onEmojiClick={onEmojiSelect} width={350} height={400} />
            </Popover>
          </Box>

          {/* Enhanced Attachments Display with Preview */}
          {attachments.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha('#1976d2', 0.02)
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Attachments ({attachments.length}) - {formatFileSize(attachments.reduce((sum, a) => sum + a.size, 0))}
              </Typography>
              <Grid container spacing={2} mt={0.5}>
                {attachments.map((attachment) => (
                  <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      {attachment.type?.startsWith('image/') ? (
                        <CardMedia
                          component="img"
                          height="120"
                          image={attachment.url}
                          alt={attachment.filename}
                          sx={{ objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => handlePreview(attachment)}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha('#0078d4', 0.05)
                          }}
                        >
                          {getFileIcon(attachment.type)}
                        </Box>
                      )}
                      <CardContent sx={{ p: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" noWrap fontWeight={500}>
                          {attachment.filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.size)}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 1, pt: 0, justifyContent: 'space-between' }}>
                        <IconButton size="small" onClick={() => handlePreview(attachment)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Drag & Drop Upload Zone (when no attachments) */}
          {attachments.length === 0 && (
            <Paper
              variant="outlined"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: isDragging ? '#0078d4' : 'divider',
                bgcolor: isDragging ? alpha('#0078d4', 0.05) : 'transparent',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0078d4',
                  bgcolor: alpha('#0078d4', 0.02)
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload sx={{ fontSize: 48, color: isDragging ? '#0078d4' : 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Drag & drop files here, or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum file size: 25 MB
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* Enhanced Action Buttons */}
        <Box 
          display="flex" 
          gap={2} 
          justifyContent="space-between" 
          mt={4}
          pt={3}
          borderTop="1px solid"
          borderColor="divider"
        >
          <Stack direction="row" gap={1.5}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSend}
              disabled={loading}
              sx={{
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              sx={{
                px: 3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Save Draft
            </Button>
          </Stack>
          <Box>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple
              accept="*/*"
            />
            <Button
              variant="outlined"
              size="large"
              startIcon={<AttachFile />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                px: 3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Attach Files
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* File Preview Dialog */}
      <Dialog 
        open={previewDialog} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#0078d4',
          color: 'white'
        }}>
          <Typography variant="h6" fontWeight={600}>
            {previewFile?.filename}
          </Typography>
          <IconButton onClick={handleClosePreview} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#faf9f8' }}>
          {previewFile && (
            <Box>
              {previewFile.type?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={previewFile.url}
                  alt={previewFile.filename}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 2
                  }}
                />
              ) : (
                <Stack alignItems="center" spacing={3} py={4}>
                  {getFileIcon(previewFile.type)}
                  <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                      {previewFile.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {previewFile.type || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {formatFileSize(previewFile.size)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Visibility />}
                    href={previewFile.url}
                    target="_blank"
                    sx={{
                      bgcolor: '#0078d4',
                      '&:hover': { bgcolor: '#005a9e' },
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Open in New Tab
                  </Button>
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
