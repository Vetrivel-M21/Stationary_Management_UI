import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, Alert, CircularProgress, Grid
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import { slaService } from '../../services/slaService';

const SlaSettingsModal = ({ open, onClose }) => {
  const [maxApproveDays, setMaxApproveDays] = useState(2);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState(3);
  const [maxVerifyDays, setMaxVerifyDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      fetchSlaSettings();
    }
  }, [open]);

  const fetchSlaSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await slaService.getSlaSettings();
      if (res.success && res.data) {
        setMaxApproveDays(res.data.maxApproveDays || 2);
        setMaxDeliveryDays(res.data.maxDeliveryDays || 3);
        setMaxVerifyDays(res.data.maxVerifyDays || 2);
      }
    } catch (err) {
      setError(err.message || 'Failed to load SLA settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        maxApproveDays: Number(maxApproveDays),
        maxDeliveryDays: Number(maxDeliveryDays),
        maxVerifyDays: Number(maxVerifyDays),
      };
      const res = await slaService.updateSlaSettings(payload);
      if (res.success) {
        setSuccess('SLA Thresholds updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Failed to update SLA settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: '#ECC94B' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            SLA Threshold Configuration
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSave}>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                  Configure maximum SLA allowed days for each process stage. Orders exceeding these thresholds will be flagged in the Monitor <strong>Delayed Orders</strong> tab.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Max Approval Days"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={maxApproveDays}
                  onChange={(e) => setMaxApproveDays(e.target.value)}
                  helperText="Max days from Submission to Approval"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Max Delivery Days"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={maxDeliveryDays}
                  onChange={(e) => setMaxDeliveryDays(e.target.value)}
                  helperText="Max days from Approval to Delivery"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Max Verification Days"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={maxVerifyDays}
                  onChange={(e) => setMaxVerifyDays(e.target.value)}
                  helperText="Max days from Delivery to Verification/Completion"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          >
            Save SLA Settings
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SlaSettingsModal;
