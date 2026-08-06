import React, { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import NavigationDrawer from '../components/common/NavigationDrawer';
import Footer from '../components/common/Footer';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { user } = useAuth();

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header onDrawerToggle={handleDrawerToggle} onChangePasswordClick={() => setPasswordModalOpen(true)} />
      <Box sx={{ display: 'flex', flexGrow: 1, width: '100%' }}>
        <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isMobile={isMobile} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: isMobile ? '100%' : (drawerOpen ? 'calc(100% - 260px)' : '100%'),
            p: 3,
            backgroundColor: '#F4F6F8',
            minHeight: 'calc(100vh - 120px)',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
      <Footer />

      {/* Change password dialog */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        isForce={false}
      />
    </Box>
  );
};

export default DashboardLayout;
