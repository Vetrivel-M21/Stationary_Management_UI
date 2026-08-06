import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ChangePasswordModal = ({ open, onClose, isForce }) => {
  const { changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={isForce ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
        {isForce ? 'Change Default Password Required' : 'Change Password'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {isForce && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You are logging in for the first time. You must change your default password to proceed.
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {!isForce && (
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
          )}
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordModal;
