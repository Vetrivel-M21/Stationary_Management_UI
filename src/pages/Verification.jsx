import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { requestService } from '../services/requestService';
import StatusChip from '../components/common/StatusChip';
import { formatDate } from '../utils/formatters';

const Verification = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verificationData, setVerificationData] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveredRequests();
  }, []);

  const fetchDeliveredRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests('DELIVERED', 1, 50);
      if (res.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerifyModal = async (req) => {
    // Fetch fresh full data to ensure deliveries are loaded
    let fullReq = req;
    try {
      const res = await requestService.getRequestById(req.id);
      if (res.success) fullReq = res.data;
    } catch (_) {}

    setSelectedReq(fullReq);
    const initialVerif = {};

    // Build a map of productId -> DeliveryItem from actual delivery records
    // DeliveryItem.id is what delivery_item_id FK in verification_items expects
    const deliveryItemMap = {};
    (fullReq.deliveries || []).forEach((delivery) => {
      (delivery.items || []).forEach((di) => {
        const pid = di.productId || di.product?.id;
        if (pid && !deliveryItemMap[pid]) {
          deliveryItemMap[pid] = di; // use first delivery item per product
        }
      });
    });

    (fullReq.items || []).forEach((item) => {
      const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
      const productId = item.productId || item.product?.id;
      const deliveryItem = deliveryItemMap[productId];

      // Only include items that were approved, not removed, and have a real delivery item
      if (!isRemoved && approvedQty > 0 && deliveryItem) {
        initialVerif[deliveryItem.id] = {
          deliveryItemId: deliveryItem.id,   // ← real delivery_items.id
          acceptedQty: deliveryItem.deliveredQty || approvedQty,
          damagedQty: 0,
          notReceivedQty: deliveryItem.unavailableQty || 0,
          remarks: '',
          // keep for display only
          _productName: item.product?.name || deliveryItem.product?.name,
          _approvedQty: approvedQty,
          _deliveredQty: deliveryItem.deliveredQty,
        };
      }
    });

    setVerificationData(initialVerif);
    setNotes('');
    setError('');
    setVerifyModalOpen(true);
  };

  const handleFieldChange = (itemId, field, valStr) => {
    const val = parseInt(valStr, 10);
    setVerificationData({
      ...verificationData,
      [itemId]: {
        ...verificationData[itemId],
        [field]: isNaN(val) ? 0 : val,
      },
    });
  };

  const handleSubmitVerification = async () => {
    setError('');
    try {
      const itemsPayload = Object.values(verificationData);
      const payload = {
        verificationNotes: notes,
        items: itemsPayload,
      };

      const res = await requestService.processVerification(selectedReq.id, payload);
      if (res.success) {
        setVerifyModalOpen(false);
        fetchDeliveredRequests();
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Delivery Verification & Receipt
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : requests.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No delivered items awaiting recipient verification.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request No</TableCell>
                <TableCell>Destination Branch</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                  <TableCell>{row.branch?.name}</TableCell>
                  <TableCell>{row.requester?.name}</TableCell>
                  <TableCell>{formatDate(row.deliveredAt)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<VerifiedIcon />}
                      onClick={() => handleOpenVerifyModal(row)}
                      sx={{ backgroundColor: '#2B6CB0' }}
                    >
                      Verify Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Verification Dialog */}
      <Dialog open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          Verify Receipt: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Unit Price (₹)</TableCell>
                <TableCell width={110}>Accepted Qty</TableCell>
                <TableCell width={110}>Damaged Qty</TableCell>
                <TableCell width={110}>Not Received Qty</TableCell>
                <TableCell align="right">Accepted Total (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedReq?.items || [])
                .filter((item) => {
                  const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
                  const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
                  return !isRemoved && approvedQty > 0;
                })
                .map((item) => {
                  const productId = Number(item.productId || item.product?.id);

                  // Find the matching delivery item by productId to get its id (the real FK key)
                  let deliveryItemId = null;
                  let agencyUnitPrice = 0;
                  if (selectedReq?.deliveries) {
                    outer: for (const d of selectedReq.deliveries) {
                      for (const di of (d.items || [])) {
                        if (Number(di.productId || di.product?.id) === productId) {
                          deliveryItemId = di.id;
                          if (di.unitPrice && di.unitPrice > 0) agencyUnitPrice = di.unitPrice;
                          break outer;
                        }
                      }
                    }
                  }

                  // Look up verificationData using deliveryItemId (the key set in handleOpenVerifyModal)
                  const v = (deliveryItemId && verificationData[deliveryItemId]) || {};
                  const unitPrice = agencyUnitPrice || item.unitPrice || item.product?.unitPrice || 0;
                  const acceptedTotal = (v.acceptedQty || 0) * unitPrice;
                  const lookupKey = deliveryItemId || item.id; // fallback to item.id if no delivery yet

                  return (
                    <TableRow key={item.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={v.acceptedQty ?? 0}
                          onChange={(e) => handleFieldChange(lookupKey, 'acceptedQty', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={v.damagedQty ?? 0}
                          onChange={(e) => handleFieldChange(lookupKey, 'damagedQty', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={v.notReceivedQty ?? 0}
                          onChange={(e) => handleFieldChange(lookupKey, 'notReceivedQty', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
                        ₹{acceptedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          <TextField
            label="Verification Remarks / Condition Notes"
            multiline
            rows={2}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes regarding damaged packaging or unreceived items"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVerifyModalOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<VerifiedIcon />}
            onClick={handleSubmitVerification}
            sx={{ backgroundColor: '#2F855A' }}
          >
            Finalize Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Verification;
