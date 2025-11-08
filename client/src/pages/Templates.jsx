import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  Menu,
  MenuItem,
  Divider,
  alpha,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  Search as SearchIcon,
  MoreVert,
  Edit,
  Delete,
  ContentCopy,
  Mail,
  Folder,
  Star,
  StarBorder,
  Close
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { emailAPI } from '../services/api';
import toast from 'react-hot-toast';

const categories = ['All', 'Business', 'Personal', 'Marketing', 'Support', 'Other'];

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ]
};

export default function Templates() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editDialog, setEditDialog] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Business',
    isFavorite: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await emailAPI.get('/templates');
      setTemplates(response.data || []);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.body?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        category: template.category || 'Business',
        isFavorite: template.isFavorite || false
      });
    } else {
      setCurrentTemplate(null);
      setFormData({
        name: '',
        subject: '',
        body: '',
        category: 'Business',
        isFavorite: false
      });
    }
    setEditDialog(true);
  };

  const handleCloseDialog = () => {
    setEditDialog(false);
    setCurrentTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.subject) {
      toast.error('Name and subject are required');
      return;
    }

    setLoading(true);
    try {
      if (currentTemplate) {
        await emailAPI.put(`/templates/${currentTemplate.id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await emailAPI.post('/templates', formData);
        toast.success('Template created successfully');
      }
      handleCloseDialog();
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to save template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await emailAPI.delete(`/templates/${templateId}`);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
      console.error(error);
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      await emailAPI.post('/templates', {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined
      });
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to duplicate template');
      console.error(error);
    }
  };

  const handleToggleFavorite = async (template) => {
    try {
      await emailAPI.put(`/templates/${template.id}`, {
        ...template,
        isFavorite: !template.isFavorite
      });
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update template');
      console.error(error);
    }
  };

  const handleMenuOpen = (event, template) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap">
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Email Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage reusable email templates
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 0,
              minWidth: { xs: 'auto', sm: 150 }
            }}
          >
            {isMobile ? 'New' : 'New Template'}
          </Button>
        </Stack>

        {/* Search and Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: selectedCategory === category ? 600 : 400 }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Mail sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Create your first template to get started'}
          </Typography>
          {!searchQuery && selectedCategory === 'All' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Create Template
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {template.name}
                      </Typography>
                      <Chip
                        label={template.category}
                        size="small"
                        sx={{ mt: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(template)}
                      >
                        {template.isFavorite ? (
                          <Star sx={{ fontSize: 20, color: '#ffc107' }} />
                        ) : (
                          <StarBorder sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    Subject:
                  </Typography>
                  <Typography variant="body2" color="text.primary" mb={2} sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {template.subject}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    Preview:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {template.body?.replace(/<[^>]*>/g, '') || 'No content'}
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(template)}
                    sx={{ textTransform: 'none' }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={() => handleDuplicateTemplate(template)}
                    sx={{ textTransform: 'none' }}
                  >
                    Duplicate
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleOpenDialog(selectedTemplate); handleMenuClose(); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { handleDuplicateTemplate(selectedTemplate); handleMenuClose(); }}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleDeleteTemplate(selectedTemplate?.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Template Editor Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#0078d4',
          color: 'white'
        }}>
          <Typography variant="h6" fontWeight={600}>
            {currentTemplate ? 'Edit Template' : 'Create New Template'}
          </Typography>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.filter(c => c !== 'All').map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Email Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email Body
              </Typography>
              <ReactQuill
                theme="snow"
                value={formData.body}
                onChange={(value) => setFormData({ ...formData, body: value })}
                modules={quillModules}
                style={{ height: '300px', marginBottom: '50px' }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
