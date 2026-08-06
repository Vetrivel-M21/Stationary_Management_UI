import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onDrawerToggle, onChangePasswordClick }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1A202C' }}>
      <Toolbar>
        <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={onDrawerToggle} sx={{ mr: 1.5 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="span" sx={{ color: '#63B3ED', fontWeight: 900 }}>ARMSS</Box> <span style={{ color: '#FFFFFF' }}>STATIONERY MANAGEMENT</span>
        </Typography>

        {user && (() => {
          const roleName = typeof user.role === 'object' ? user.role?.name : (user.role || '');
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${roleName} ${user.branch ? `- ${user.branch.name}` : ''}`}
                sx={{ backgroundColor: '#2B6CB0', color: '#FFFFFF', fontWeight: 600 }}
                size="medium"
              />
              <Typography variant="body1" sx={{ color: '#E2E8F0', fontWeight: 500 }}>
                {user.name}
              </Typography>
              <IconButton size="large" onClick={handleMenu} color="inherit">
                <Avatar sx={{ bgcolor: '#4A5568', width: 36, height: 36 }}>{user.name ? user.name[0] : 'U'}</Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => { handleClose(); onChangePasswordClick(); }}>
                  <LockResetIcon sx={{ mr: 1, color: '#4A5568' }} /> Change Password
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); logout(); }}>
                  <LogoutIcon sx={{ mr: 1, color: '#E53E3E' }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          );
        })()}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
