import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  Stack,
  Tooltip,
  alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Mail,
  Inbox as InboxIcon,
  Send,
  Drafts,
  Delete,
  Star,
  Settings as SettingsIcon,
  Logout,
  AdminPanelSettings,
  Create as CreateIcon,
  Label,
  Archive,
  CalendarMonth,
  Contacts as ContactsIcon,
  FilterList,
  Description
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import toast from 'react-hot-toast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
// import { useRealtimeUnreadCount } from '../hooks/useRealtimeEmails';

const drawerWidth = 220;

const menuItems = [
  { text: 'Inbox', icon: <InboxIcon />, path: '/inbox', badge: 0 },
  { text: 'Sent', icon: <Send />, path: '/sent' },
  { text: 'Drafts', icon: <Drafts />, path: '/drafts' },
  { text: 'Starred', icon: <Star />, path: '/starred' },
  { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { text: 'Contacts', icon: <ContactsIcon />, path: '/contacts' },
  { text: 'Trash', icon: <Delete />, path: '/trash' },
];

const toolsItems = [
  { text: 'Email Rules', icon: <FilterList />, path: '/rules' },
  { text: 'Templates', icon: <Description />, path: '/templates' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const { unreadCount } = useEmailStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  // Disable real-time unread count updates (requires Firestore security rules)
  // useRealtimeUnreadCount();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false); // Close drawer on mobile after navigation
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f3f2f1' }}>
      {/* Outlook-style Logo Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0078d4'
          }}
        >
          <Mail sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={600} color="text.primary">
          Circuvent
        </Typography>
      </Box>

      {/* Compose Button - Outlook Style */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="medium"
          startIcon={<CreateIcon />}
          onClick={() => navigate('/compose')}
          sx={{
            py: 1,
            bgcolor: '#0078d4',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#106ebe',
              boxShadow: 'none'
            }
          }}
        >
          New message
        </Button>
      </Box>

      {/* Navigation Menu - Outlook Style */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 2, 
            py: 1, 
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}
        >
          Folders
        </Typography>
        <List dense sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    borderRadius: 0.5,
                    bgcolor: isActive ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid #0078d4' : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(0, 120, 212, 0.15)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#0078d4' : 'text.secondary' }}>
                    {item.badge && unreadCount > 0 ? (
                      <Badge 
                        badgeContent={unreadCount} 
                        color="error"
                        max={99}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.625rem',
                            height: 16,
                            minWidth: 16
                          }
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#0078d4' : 'text.primary'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Tools Section */}
        <Typography 
          variant="caption" 
          sx={{ 
            px: 2, 
            py: 1, 
            display: 'block',
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            mt: 1
          }}
        >
          Tools
        </Typography>
        <List dense sx={{ px: 1 }}>
          {toolsItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    borderRadius: 0.5,
                    bgcolor: isActive ? 'rgba(0, 120, 212, 0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid #0078d4' : '3px solid transparent',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(0, 120, 212, 0.15)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#0078d4' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#0078d4' : 'text.primary'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Info at Bottom - Outlook Style */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: '#faf9f8'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar
            sx={{
              bgcolor: '#0078d4',
              width: 28,
              height: 28,
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
              {user?.email?.split('@')[0]}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
              {user?.email?.split('@')[1]}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          borderBottom: '1px solid #edebe9',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 48 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
            Mail
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Settings">
            <IconButton 
              size="small" 
              onClick={() => handleNavigate('/settings')}
              sx={{ mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton 
            size="small"
            onClick={handleMenuClick}
          >
            <Avatar 
              sx={{ 
                width: { xs: 32, sm: 28 }, 
                height: { xs: 32, sm: 28 },
                bgcolor: '#0078d4',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user?.email?.split('@')[0]}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem 
              onClick={() => { navigate('/settings'); handleMenuClose(); }}
              sx={{ py: 1, fontSize: '0.875rem' }}
            >
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem 
              onClick={() => { navigate('/admin'); handleMenuClose(); }}
              sx={{ py: 1, fontSize: '0.875rem' }}
            >
              <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
              Admin
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={handleLogout}
              sx={{ py: 1, fontSize: '0.875rem', color: 'error.main' }}
            >
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 6,
          bgcolor: '#faf9f8',
          minHeight: '100vh'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
