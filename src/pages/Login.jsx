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
    setMobile('');
  };

  const handleMobileChange = (val) => {
    // Only allow digits up to 11 characters (10-digit number or 11-digit number starting with 0)
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Mobile Number.');
      return;
    }

    try {
      const user = await login(cleanMobile, password);
      
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
          onChange={(e) => handleMobileChange(e.target.value)}
          placeholder="e.g. 9876543210"
          inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
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
    </LoginLayout>
  );
};

export default Login;
