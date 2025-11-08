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
  InputAdornment,
  Avatar,
  Stack,
  Fade,
  Button,
  Divider,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Star,
  StarBorder,
  Delete,
  Refresh,
  Search as SearchIcon,
  MoreVert,
  Archive,
  AttachFile,
  Label,
  MarkEmailRead,
  MarkEmailUnread,
  Mail,
  FilterList,
  Close,
  CalendarToday,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import { useEmailStore } from '../store/emailStore';
import { useAuthStore } from '../store/authStore';
import { format, formatDistanceToNow, isToday, isYesterday, subDays, subWeeks, subMonths } from 'date-fns';
import toast from 'react-hot-toast';
import EmailSkeleton from '../components/EmailSkeleton';
import SwipeableEmailItem from '../components/SwipeableEmailItem';
// import { useRealtimeEmails, useNotificationPermission } from '../hooks/useRealtimeEmails';

export default function Inbox({ folder = 'inbox' }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    sender: '',
    dateRange: 'all',
    hasAttachments: false,
    isStarred: false,
    isUnread: false
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const { emails, loading, isLoadingFromCache, fetchEmails, toggleStar, deleteEmail, markAsRead, realtimeEnabled, setRealtimeEnabled } = useEmailStore();

  // Disable real-time email sync by default (requires Firestore security rules)
  // const { isListening } = useRealtimeEmails(folder, realtimeEnabled);
  const isListening = false;
  
  // Request notification permission
  // useNotificationPermission();

  useEffect(() => {
    // Load emails from API
    loadEmails();
  }, [folder]);

  const loadEmails = async () => {
    try {
      await fetchEmails(folder, { userId: user?.uid });
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

  const handleArchive = async (emailId) => {
    try {
      // Archive functionality - you can implement this in your store
      toast.success('Email archived');
    } catch (error) {
      toast.error('Failed to archive email');
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

  // Search and filter functions
  const handleSearch = async (e) => {
    e.preventDefault();
    // Search is handled by filterEmails function
  };

  const handleFilterOpen = () => {
    setFilterDialog(true);
  };

  const handleFilterClose = () => {
    setFilterDialog(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setFilterDialog(false);
    toast.success('Filters applied');
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      sender: '',
      dateRange: 'all',
      hasAttachments: false,
      isStarred: false,
      isUnread: false
    };
    setFilters(emptyFilters);
    setAppliedFilters({});
    toast.success('Filters cleared');
  };

  const filterEmails = () => {
    // Ensure emails is an array
    if (!Array.isArray(emails)) {
      return [];
    }
    
    let filtered = [...emails];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject?.toLowerCase().includes(query) ||
        email.from?.email?.toLowerCase().includes(query) ||
        email.from?.name?.toLowerCase().includes(query) ||
        email.body?.toLowerCase().includes(query)
      );
    }

    // Sender filter
    if (appliedFilters.sender) {
      const sender = appliedFilters.sender.toLowerCase();
      filtered = filtered.filter(email =>
        email.from?.email?.toLowerCase().includes(sender) ||
        email.from?.name?.toLowerCase().includes(sender)
      );
    }

    // Date range filter
    if (appliedFilters.dateRange && appliedFilters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (appliedFilters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoffDate = subWeeks(now, 1);
          break;
        case 'month':
          cutoffDate = subMonths(now, 1);
          break;
        default:
          cutoffDate = null;
      }

      if (cutoffDate) {
        filtered = filtered.filter(email => {
          const emailDate = email.createdAt?.toDate ? email.createdAt.toDate() : new Date(email.createdAt);
          return emailDate >= cutoffDate;
        });
      }
    }

    // Attachments filter
    if (appliedFilters.hasAttachments) {
      filtered = filtered.filter(email => 
        email.attachments && email.attachments.length > 0
      );
    }

    // Starred filter
    if (appliedFilters.isStarred) {
      filtered = filtered.filter(email => email.starred);
    }

    // Unread filter
    if (appliedFilters.isUnread) {
      filtered = filtered.filter(email => !email.read);
    }

    return filtered;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.sender) count++;
    if (appliedFilters.dateRange && appliedFilters.dateRange !== 'all') count++;
    if (appliedFilters.hasAttachments) count++;
    if (appliedFilters.isStarred) count++;
    if (appliedFilters.isUnread) count++;
    return count;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEE'); // Mon, Tue, etc.
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getInitials = (email) => {
    if (!email) return '?';
    const name = email.name || email.email || '';
    return name.charAt(0).toUpperCase();
  };

  const handleMarkAsRead = async (e, emailId, isRead) => {
    e.stopPropagation();
    try {
      await markAsRead(emailId, !isRead);
      toast.success(isRead ? 'Marked as unread' : 'Marked as read');
    } catch (error) {
      toast.error('Failed to update email');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Outlook-style Toolbar */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa'
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 56, sm: 48 }, px: { xs: 1, sm: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Tooltip title="New email">
            <Button
              variant="contained"
              size={isMobile ? "small" : "medium"}
              startIcon={<Mail />}
              onClick={() => navigate('/compose')}
              sx={{ 
                mr: { xs: 0.5, sm: 2 },
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 0,
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1.5, sm: 2 }
              }}
            >
              {isMobile ? '' : 'New'}
            </Button>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'block' } }} />

          <Tooltip title="Delete">
            <span>
              <IconButton 
                size="small" 
                onClick={handleBulkDelete}
                disabled={selected.length === 0}
                sx={{ borderRadius: 1, p: { xs: 0.75, sm: 1 } }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Archive">
            <IconButton size="small" sx={{ borderRadius: 1, p: { xs: 0.75, sm: 1 }, display: { xs: 'none', sm: 'inline-flex' } }}>
              <Archive fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Mark as read">
            <IconButton size="small" sx={{ borderRadius: 1, p: { xs: 0.75, sm: 1 }, display: { xs: 'none', sm: 'inline-flex' } }}>
              <MarkEmailRead fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.5, sm: 1 }, display: { xs: 'none', sm: 'block' } }} />

          <Tooltip title="Refresh">
            <IconButton 
              size="small" 
              onClick={loadEmails}
              sx={{ borderRadius: 1, p: { xs: 0.75, sm: 1 } }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isListening ? 'Real-time sync active' : 'Real-time sync disabled'}>
            <IconButton 
              size="small" 
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              sx={{ 
                borderRadius: 1,
                color: isListening ? 'success.main' : 'text.secondary',
                p: { xs: 0.75, sm: 1 },
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            >
              {isListening ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Cache indicator */}
          {isLoadingFromCache && (
            <Chip
              label="Cached"
              size="small"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: 'info.main',
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' }
              }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Search Bar - Outlook Style */}
          <TextField
            size="small"
            placeholder={isMobile ? "Search..." : "Search emails..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: { xs: 120, sm: 200, md: 300 },
              mr: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                height: 32,
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                '& fieldset': {
                  borderColor: 'divider'
                },
                '&:hover fieldset': {
                  borderColor: '#0078d4'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0078d4'
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Filter Button */}
          <Tooltip title="Advanced filters">
            <IconButton
              size="small"
              onClick={handleFilterOpen}
              sx={{
                borderRadius: 1,
                bgcolor: getActiveFiltersCount() > 0 ? alpha('#0078d4', 0.1) : 'transparent',
                border: '1px solid',
                borderColor: getActiveFiltersCount() > 0 ? '#0078d4' : 'divider'
              }}
            >
              <FilterList fontSize="small" color={getActiveFiltersCount() > 0 ? 'primary' : 'inherit'} />
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={getActiveFiltersCount()}
                  size="small"
                  sx={{
                    height: 16,
                    minWidth: 16,
                    fontSize: '0.7rem',
                    ml: 0.5,
                    bgcolor: '#0078d4',
                    color: 'white',
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>

      {/* Message List Header - Outlook Style */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Checkbox
          size="small"
          checked={selected.length === emails.length && emails.length > 0}
          indeterminate={selected.length > 0 && selected.length < emails.length}
          onChange={handleSelectAll}
          sx={{ p: 0.5 }}
        />
        <Typography variant="body2" fontWeight={600} sx={{ ml: 2, color: 'text.primary' }}>
          {selected.length > 0 ? `${selected.length} selected` : folder.charAt(0).toUpperCase() + folder.slice(1)}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {emails.length} items
        </Typography>
      </Box>

      {/* Outlook-style Email List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'white' }}>
        {loading ? (
          <EmailSkeleton count={8} />
        ) : filterEmails().length === 0 ? (
          <Box p={8} textAlign="center">
            <SearchIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={500}>
              {searchQuery || getActiveFiltersCount() > 0 ? 'No results found' : 'Nothing here'}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {searchQuery || getActiveFiltersCount() > 0 
                ? 'No emails match your search criteria.' 
                : folder === 'inbox' ? 'Your inbox is empty.' : 'No emails found.'}
            </Typography>
            {(searchQuery || getActiveFiltersCount() > 0) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  handleClearFilters();
                }}
                startIcon={<Close />}
                sx={{ mt: 2, textTransform: 'none' }}
              >
                Clear Search & Filters
              </Button>
            )}
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filterEmails().map((email, index) => {
              const isSelected = selected.includes(email.id);
              
              // Use SwipeableEmailItem for mobile, regular list item for desktop
              if (isMobile) {
                return (
                  <SwipeableEmailItem
                    key={email.id}
                    email={email}
                    selected={isSelected}
                    onSelect={handleSelect}
                    onClick={handleEmailClick}
                    onStar={toggleStar}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    animationDelay={index * 50}
                  />
                );
              }
              
              return (
                <Fade in={true} timeout={300 + index * 50} key={email.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isSelected ? alpha('#0078d4', 0.08) : email.isRead ? 'white' : '#f5f9ff',
                      '&:hover': {
                        bgcolor: isSelected ? alpha('#0078d4', 0.12) : alpha('#0078d4', 0.04),
                        cursor: 'pointer',
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                  {/* Checkbox */}
                  <Box sx={{ px: 1.5, py: 1.5 }}>
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleSelect(email.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0 }}
                    />
                  </Box>

                  {/* Star */}
                  <Box sx={{ px: 0.5 }}>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleStarToggle(e, email.id)}
                      sx={{ p: 0.5 }}
                    >
                      {email.isStarred ? (
                        <Star sx={{ fontSize: 18, color: '#ffb900' }} />
                      ) : (
                        <StarBorder sx={{ fontSize: 18, color: 'text.secondary' }} />
                      )}
                    </IconButton>
                  </Box>

                  {/* Email Content */}
                  <ListItemButton
                    onClick={() => handleEmailClick(email.id)}
                    sx={{ 
                      py: 1.5,
                      px: 2,
                      flex: 1,
                      '&:hover': {
                        bgcolor: 'transparent'
                      }
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      {/* First Row: Sender and Date */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography
                          variant="body2"
                          sx={{ 
                            fontWeight: email.isRead ? 400 : 700,
                            color: 'text.primary',
                            fontSize: '0.875rem'
                          }}
                        >
                          {folder === 'sent' 
                            ? email.to[0]?.name || email.to[0]?.email 
                            : email.from?.name || email.from?.email}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            ml: 2,
                            flexShrink: 0
                          }}
                        >
                          {formatDate(email.createdAt)}
                        </Typography>
                      </Box>

                      {/* Second Row: Subject */}
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: email.isRead ? 400 : 600,
                            color: email.isRead ? 'text.secondary' : 'text.primary',
                            fontSize: '0.8125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {email.subject || '(No Subject)'}
                        </Typography>
                        {email.attachments?.length > 0 && (
                          <AttachFile sx={{ fontSize: 14, color: 'text.secondary' }} />
                        )}
                      </Box>

                      {/* Third Row: Preview */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '85%'
                        }}
                      >
                        {email.plainText?.substring(0, 100) || ''}
                      </Typography>
                    </Box>
                  </ListItemButton>

                  {/* Actions on hover */}
                  <Box sx={{ px: 1, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(email.id);
                        }}
                        sx={{ 
                          p: 0.5,
                          opacity: 0.7,
                          '&:hover': { opacity: 1 }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              </Fade>
              );
            })}
          </List>
        )}
      </Box>

      {/* Advanced Filter Dialog */}
      <Dialog open={filterDialog} onClose={handleFilterClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#0078d4',
          color: 'white'
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterList />
            <Typography variant="h6" fontWeight={600}>
              Advanced Filters
            </Typography>
          </Box>
          <IconButton onClick={handleFilterClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sender"
                placeholder="Search by sender email or name"
                value={filters.sender}
                onChange={(e) => handleFilterChange('sender', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Past Week</MenuItem>
                  <MenuItem value="month">Past Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.hasAttachments}
                      onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachFile fontSize="small" />
                      <Typography>Has Attachments</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isStarred}
                      onChange={(e) => handleFilterChange('isStarred', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Star fontSize="small" />
                      <Typography>Starred Only</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isUnread}
                      onChange={(e) => handleFilterChange('isUnread', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <MarkEmailUnread fontSize="small" />
                      <Typography>Unread Only</Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            startIcon={<Close />}
            sx={{ textTransform: 'none' }}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            startIcon={<FilterList />}
            sx={{
              bgcolor: '#0078d4',
              '&:hover': { bgcolor: '#005a9e' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
