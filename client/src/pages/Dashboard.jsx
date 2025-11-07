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
  Divider
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
  Create as CreateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import toast from 'react-hot-toast';

const drawerWidth = 240;

const menuItems = [
  { text: 'Inbox', icon: <InboxIcon />, path: '/inbox', badge: 0 },
  { text: 'Sent', icon: <Send />, path: '/sent' },
  { text: 'Drafts', icon: <Drafts />, path: '/drafts' },
  { text: 'Starred', icon: <Star />, path: '/starred' },
  { text: 'Trash', icon: <Delete />, path: '/trash' },
];

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { unreadCount } = useEmailStore();

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

  const drawer = (
    <div>
      <Toolbar>
        <Mail sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap component="div">
          Circuvent Mail
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <IconButton
          fullWidth
          variant="contained"
          startIcon={<CreateIcon />}
          onClick={() => navigate('/compose')}
          sx={{
            width: '100%',
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <CreateIcon sx={{ mr: 1 }} />
          Compose
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>
                {item.badge ? (
                  <Badge badgeContent={unreadCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.email}
          </Typography>
          <IconButton color="inherit" onClick={handleMenuClick}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
              <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
              Admin Panel
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
