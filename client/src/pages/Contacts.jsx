import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  alpha
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Person,
  Email,
  Phone,
  Business,
  Label,
  Download,
  Upload,
  Group,
  Star,
  StarBorder
} from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function Contacts() {
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 234 567 8900',
      company: 'Tech Corp',
      group: 'Work',
      starred: true,
      avatar: ''
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 234 567 8901',
      company: 'Design Studio',
      group: 'Personal',
      starred: false,
      avatar: ''
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    group: 'Personal'
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const groups = ['Personal', 'Work', 'Family', 'Friends', 'Other'];

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        group: contact.group
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        group: 'Personal'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContact(null);
  };

  const handleSaveContact = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (editingContact) {
      // Update existing contact
      setContacts(contacts.map(c => 
        c.id === editingContact.id 
          ? { ...c, ...formData }
          : c
      ));
      toast.success('Contact updated successfully');
    } else {
      // Create new contact
      const newContact = {
        id: Date.now(),
        ...formData,
        starred: false,
        avatar: ''
      };
      setContacts([...contacts, newContact]);
      toast.success('Contact added successfully');
    }
    handleCloseDialog();
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
    toast.success('Contact deleted');
    handleMenuClose();
  };

  const handleToggleStar = (id) => {
    setContacts(contacts.map(c =>
      c.id === id ? { ...c, starred: !c.starred } : c
    ));
  };

  const handleMenuOpen = (event, contact) => {
    setAnchorEl(event.currentTarget);
    setSelectedContact(contact);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedContact(null);
  };

  const handleExport = () => {
    toast.success('Contacts exported to CSV');
  };

  const handleImport = () => {
    toast.info('Import feature coming soon');
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        pb={2}
        borderBottom="1px solid #edebe9"
      >
        <Box>
          <Typography variant="h5" fontWeight={600} color="#323130">
            Contacts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your email contacts and groups
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Tooltip title="Import contacts">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={handleImport}
              sx={{
                textTransform: 'none',
                borderRadius: '2px',
                borderColor: '#0078d4',
                color: '#0078d4'
              }}
            >
              Import
            </Button>
          </Tooltip>
          <Tooltip title="Export contacts">
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              sx={{
                textTransform: 'none',
                borderRadius: '2px',
                borderColor: '#0078d4',
                color: '#0078d4'
              }}
            >
              Export
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: '#0078d4',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '2px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#106ebe',
                boxShadow: 'none'
              }
            }}
          >
            New Contact
          </Button>
        </Box>
      </Box>

      {/* Search and Filter Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search contacts by name, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: '2px',
              '&:hover fieldset': {
                borderColor: '#0078d4'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0078d4'
              }
            }
          }}
        />
      </Box>

      {/* Contacts Table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #edebe9',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#faf9f8' }}>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c', width: 50 }}></TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c' }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#605e5c', width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Person sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? 'No contacts found matching your search' : 'No contacts yet. Add your first contact!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha('#0078d4', 0.02)
                      }
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStar(contact.id)}
                      >
                        {contact.starred ? (
                          <Star sx={{ color: '#ffc107', fontSize: 20 }} />
                        ) : (
                          <StarBorder sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: '#0078d4',
                            width: 36,
                            height: 36,
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          {getInitials(contact.name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {contact.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contact.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contact.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {contact.company || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contact.group}
                        size="small"
                        sx={{
                          bgcolor: alpha('#0078d4', 0.1),
                          color: '#0078d4',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(contact)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, contact)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Contact Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '2px'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#faf9f8',
            borderBottom: '1px solid #edebe9'
          }}
        >
          <Typography variant="h6" fontWeight={600} color="#323130">
            {editingContact ? 'Edit Contact' : 'New Contact'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': { borderColor: '#0078d4' },
                '&.Mui-focused fieldset': { borderColor: '#0078d4' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': { borderColor: '#0078d4' },
                '&.Mui-focused fieldset': { borderColor: '#0078d4' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': { borderColor: '#0078d4' },
                '&.Mui-focused fieldset': { borderColor: '#0078d4' }
              }
            }}
          />
          <TextField
            fullWidth
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '2px',
                '&:hover fieldset': { borderColor: '#0078d4' },
                '&.Mui-focused fieldset': { borderColor: '#0078d4' }
              }
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Group</InputLabel>
            <Select
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              label="Group"
              startAdornment={
                <InputAdornment position="start">
                  <Label />
                </InputAdornment>
              }
              sx={{
                borderRadius: '2px',
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0078d4' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0078d4' }
              }}
            >
              {groups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, bgcolor: '#faf9f8' }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: 'none',
              color: '#323130',
              '&:hover': { bgcolor: '#f3f2f1' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveContact}
            variant="contained"
            sx={{
              bgcolor: '#0078d4',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderRadius: '2px',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#106ebe',
                boxShadow: 'none'
              }
            }}
          >
            {editingContact ? 'Save Changes' : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedContact);
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteContact(selectedContact?.id)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
