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
        Website designed and developed by{' '}
        <Box component="span" sx={{ color: '#1976D2', fontWeight: 700 }}>
          ARMSS INFO TECH
        </Box>
      </Typography>
    </Box>
  );
};

export default Footer;
