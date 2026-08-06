import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #CBD5E0',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Stationery Management System &copy; {new Date().getFullYear()} Enterprise Multi-Branch Solution. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
