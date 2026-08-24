import React, { useState } from 'react';
import { TextField, Button, Box, Alert, CircularProgress, Typography, Tabs, Tab, Paper, Chip, IconButton, InputAdornment } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginLayout from '../layouts/LoginLayout';

const Login = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Staff Login, 1: Agency Login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setError('');
    setIdentifier('');
  };

  const handleIdentifierChange = (val) => {
    setIdentifier(val);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your Mobile Number or Username.');
      return;
    }

    try {
      const user = await login(cleanIdentifier, password);
      
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
    setIdentifier(mob);
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
          label="Mobile Number or Username"
          variant="outlined"
          fullWidth
          required
          value={identifier}
          onChange={(e) => handleIdentifierChange(e.target.value)}
          placeholder="e.g. 9876543210 or your name"
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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
