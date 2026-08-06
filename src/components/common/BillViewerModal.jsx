import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { formatDateTime } from '../../utils/formatters';

const BillViewerModal = ({ open, onClose, billUrl, billNotes, requestNo, deliveryDate, agentName }) => {
  if (!open) return null;

  const handleDownload = () => {
    if (!billUrl) return;
    const link = document.createElement('a');
    link.href = billUrl;
    link.download = `Delivery_Bill_${requestNo || 'Receipt'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = billUrl?.startsWith('data:application/pdf') || billUrl?.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2D3748', color: '#FFFFFF', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLongIcon />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Delivery Bill & Receipt Slip ({requestNo || 'Order'})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#FFFFFF' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, backgroundColor: '#F8FAFC' }}>
        {agentName && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, backgroundColor: '#EDF2F7', p: 1.5, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Dispatched By: <span style={{ color: '#2B6CB0' }}>{agentName}</span>
            </Typography>
            {deliveryDate && (
              <Typography variant="body2" color="text.secondary">
                Date: {formatDateTime(deliveryDate)}
              </Typography>
            )}
          </Box>
        )}

        {billNotes && (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#FEFCBF', borderLeft: '4px solid #D69E2E', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
              DELIVERY BILL REMARKS / TRACKING NOTES:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#744210' }}>
              {billNotes}
            </Typography>
          </Box>
        )}

        {billUrl ? (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            {isPdf ? (
              <iframe
                src={billUrl}
                title="Delivery Bill PDF"
                width="100%"
                height="500px"
                style={{ border: '1px solid #CBD5E0', borderRadius: '4px' }}
              />
            ) : (
              <Box
                component="img"
                src={billUrl}
                alt="Delivery Bill Receipt"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '550px',
                  objectFit: 'contain',
                  borderRadius: 2,
                  border: '1px solid #CBD5E0',
                  boxShadow: 3,
                  backgroundColor: '#FFFFFF',
                  p: 1
                }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No bill attachment image uploaded for this delivery.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined">
          Close Preview
        </Button>
        {billUrl && (
          <Button
            onClick={handleDownload}
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            sx={{ backgroundColor: '#2F855A', '&:hover': { backgroundColor: '#276749' } }}
          >
            Download Bill / Slip
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BillViewerModal;
