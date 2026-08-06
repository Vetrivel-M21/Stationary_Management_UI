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
          <Typography variant="h4" sx={{ color: '#1A202C', fontWeight: 700, mb: 1 }}>
            Stationery Portal
          </Typography>
          <Typography variant="body2" sx={{ color: '#4A5568', mb: 3 }}>
            Enterprise Multi-Branch Stationery Management System
          </Typography>
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginLayout;
