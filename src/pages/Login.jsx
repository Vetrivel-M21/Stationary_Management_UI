import React, { useState } from 'react';
import { TextField, Button, Box, Alert, CircularProgress, Typography, Tabs, Tab, Paper, Chip } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginLayout from '../layouts/LoginLayout';

const Login = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Staff Login, 1: Agency Login
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setError('');
    if (newValue === 1) {
      setMobile('09666666666'); // Pre-fill default Agency mobile
    } else {
      setMobile('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(mobile.trim(), password);
      
      // Role & Department based redirection
      if (user?.role?.name === 'AGENCY') {
        navigate('/deliveries');
      } else if (user?.role?.name === 'APPROVER') {
        navigate('/approvals');
      } else if (user?.role?.name === 'MONITOR') {
        navigate('/monitor');
      } else if (user?.role?.name === 'BRANCH_REQUESTER') {
        navigate('/requests');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const quickFill = (mob) => {
    setMobile(mob);
    setPassword('Admin@123');
  };

  return (
    <LoginLayout>
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<BadgeIcon />} label="Staff Login" iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab icon={<LocalShippingIcon />} label="Agency Login" iconPosition="start" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>
          {tabIndex === 0
            ? 'Sign in as Admin, Shared Requester, Department Approver, or Monitor'
            : 'Sign in with your Delivery Agency credentials'}
        </Typography>

        <TextField
          label="Mobile Number"
          variant="outlined"
          fullWidth
          required
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="e.g. 09999999999"
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ py: 1.5, fontSize: '1.05rem', backgroundColor: tabIndex === 0 ? '#2B6CB0' : '#D69E2E', '&:hover': { backgroundColor: tabIndex === 0 ? '#2C5282' : '#B7791F' } }}
        >
          {loading ? <CircularProgress size={26} color="inherit" /> : (tabIndex === 0 ? 'Staff Sign In' : 'Agency Sign In')}
        </Button>
      </Box>

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #CBD5E0', textAlign: 'left' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2D3748', mb: 1 }}>
          Click to Quick-Fill Test Account (Password: Admin@123):
        </Typography>
        
        {tabIndex === 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            <Chip label="Admin" onClick={() => quickFill('09999999999')} size="small" color="primary" clickable />
            <Chip label="Requester (Shared)" onClick={() => quickFill('09888888888')} size="small" color="secondary" clickable />
            <Chip label="Approver (Gold Loan)" onClick={() => quickFill('09777777777')} size="small" color="success" clickable />
            <Chip label="Approver (Chit Fund)" onClick={() => quickFill('09777777778')} size="small" color="success" clickable />
            <Chip label="Approver (Others)" onClick={() => quickFill('09777777779')} size="small" color="success" clickable />
            <Chip label="Monitor (Gold Loan)" onClick={() => quickFill('09555555555')} size="small" color="info" clickable />
            <Chip label="Monitor (Chit Fund)" onClick={() => quickFill('09555555556')} size="small" color="info" clickable />
            <Chip label="Monitor (Others)" onClick={() => quickFill('09555555557')} size="small" color="info" clickable />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            <Chip label="Delivery Agency (09666666666)" onClick={() => quickFill('09666666666')} size="small" color="warning" clickable />
          </Box>
        )}
      </Box>
    </LoginLayout>
  );
};

export default Login;
