import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';

const LoginLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A202C 0%, #2D3748 50%, #1A4971 100%)',
        padding: 3,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={4}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 72, width: 72, mb: 1 }}
          />
          <Typography variant="h4" sx={{ color: '#1A202C', fontWeight: 700, mb: 1 }}>
            Veyon Agency
          </Typography>
          <Typography variant="body2" sx={{ color: '#4A5568', mb: 3 }}>
            Enterprise Multi-Branch Stationery Management System
          </Typography>
          {children}
        </Paper>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 3, textAlign: 'center' }}>
          Website designed and developed by{' '}
          <Box component="span" sx={{ color: '#60A5FA', fontWeight: 700 }}>
            ARMSS INFO TECH
          </Box>
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginLayout;
