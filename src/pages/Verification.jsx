import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Chip
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
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
  const [billPreviewUrl, setBillPreviewUrl] = useState(null);

  useEffect(() => {
    fetchDeliveredRequests();
  }, []);

  const fetchDeliveredRequests = async () => {
    setLoading(true);
    try {
      const resDelivered = await requestService.getRequests('DELIVERED', 1, 100);
      const resPartial = await requestService.getRequests('PARTIALLY_DELIVERED', 1, 100);
      let list = [];
      if (resDelivered.success) list = [...list, ...(resDelivered.data.requests || [])];
      if (resPartial.success) list = [...list, ...(resPartial.data.requests || [])];
      const uniqueMap = new Map();
      list.forEach((item) => uniqueMap.set(item.id, item));
      setRequests(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to load delivered requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBill = (url, reqNo) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const ext = url.startsWith('data:application/pdf') ? 'pdf' : 'png';
    link.download = `Delivery_Receipt_${reqNo || 'doc'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenVerifyModal = async (req) => {
    let fullReq = req;
    try {
      const res = await requestService.getRequestById(req.id);
      if (res.success) fullReq = res.data;
    } catch (_) {}

    setSelectedReq(fullReq);
    const initialVerif = {};

    const deliveryItemMap = {};
    (fullReq.deliveries || []).forEach((delivery) => {
      (delivery.items || []).forEach((di) => {
        const pid = di.productId || di.product?.id;
        if (pid && !deliveryItemMap[pid]) {
          deliveryItemMap[pid] = di;
        }
      });
    });

    (fullReq.items || []).forEach((item) => {
      const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
      const productId = item.productId || item.product?.id;
      const deliveryItem = deliveryItemMap[productId];

      if (!isRemoved && approvedQty > 0 && deliveryItem) {
        const dispatched = deliveryItem.deliveredQty || 0;
        const unavailable = deliveryItem.unavailableQty || 0;
        const unitPrice = deliveryItem.unitPrice || item.unitPrice || item.product?.unitPrice || 0;

        initialVerif[deliveryItem.id] = {
          deliveryItemId: deliveryItem.id,
          acceptedQty: dispatched,
          damagedQty: 0,
          notReceivedQty: 0,
          remarks: '',
          _productName: item.product?.name || deliveryItem.product?.name,
          _approvedQty: approvedQty,
          _dispatchedQty: dispatched,
          _unavailableQty: unavailable,
          _unitPrice: unitPrice,
        };
      }
    });

    setVerificationData(initialVerif);
    setNotes('');
    setError('');
    setVerifyModalOpen(true);
  };

  const handleFieldChange = (itemId, field, valStr) => {
    const cleanStr = String(valStr || '').replace(/^0+(?=\d)/, '');
    const val = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    const numVal = isNaN(val) ? 0 : Math.max(0, val);
    const current = verificationData[itemId];
    if (!current) return;

    const maxAllowed = current._dispatchedQty;

    if (field === 'damagedQty') {
      const newDamaged = Math.min(maxAllowed, numVal);
      const newAccepted = Math.max(0, maxAllowed - newDamaged);
      const newNotReceived = Math.max(0, maxAllowed - (newAccepted + newDamaged));

      setVerificationData((prev) => ({
        ...prev,
        [itemId]: {
          ...current,
          damagedQty: cleanStr === '' ? 0 : newDamaged,
          acceptedQty: newAccepted,
          notReceivedQty: newNotReceived,
        },
      }));
    } else if (field === 'acceptedQty') {
      const newAccepted = Math.min(maxAllowed, numVal);
      const newDamaged = Math.min(Math.max(0, maxAllowed - newAccepted), Number(current.damagedQty || 0));
      const newNotReceived = Math.max(0, maxAllowed - (newAccepted + newDamaged));

      setVerificationData((prev) => ({
        ...prev,
        [itemId]: {
          ...current,
          acceptedQty: cleanStr === '' ? 0 : newAccepted,
          damagedQty: newDamaged,
          notReceivedQty: newNotReceived,
        },
      }));
    } else if (field === 'notReceivedQty') {
      const newNotReceived = Math.min(maxAllowed, numVal);
      const newDamaged = Math.min(Math.max(0, maxAllowed - newNotReceived), Number(current.damagedQty || 0));
      const newAccepted = Math.max(0, maxAllowed - (newDamaged + newNotReceived));

      setVerificationData((prev) => ({
        ...prev,
        [itemId]: {
          ...current,
          notReceivedQty: cleanStr === '' ? 0 : newNotReceived,
          acceptedQty: newAccepted,
          damagedQty: newDamaged,
        },
      }));
    }
  };

  const handleSubmitVerification = async () => {
    setError('');
    try {
      const itemsPayload = Object.values(verificationData).map((item) => ({
        ...item,
        acceptedQty: Number(item.acceptedQty || 0),
        damagedQty: Number(item.damagedQty || 0),
        notReceivedQty: Number(item.notReceivedQty || 0),
      }));
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

  // Grand Accepted Financial Total
  const grandAcceptedTotal = Object.values(verificationData).reduce((acc, curr) => {
    const accepted = Number(curr.acceptedQty || 0);
    const price = Number(curr._unitPrice || 0);
    return acc + (accepted * price);
  }, 0);

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
              <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Delivered Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                  <TableCell><Chip label={row.department || 'GENERAL'} size="small" color="primary" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>{row.branch?.name}</TableCell>
                  <TableCell>{row.requester?.name}</TableCell>
                  <TableCell>{formatDate(row.deliveredAt)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VerifiedIcon />}
                        onClick={() => handleOpenVerifyModal(row)}
                        sx={{ backgroundColor: '#2B6CB0' }}
                      >
                        Verify Receipt
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Verification Dialog */}
      <Dialog open={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, px: 3, py: 2 }}>
          Verify Receipt: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          {/* Delivery Agency Summary Banner with Receipt Preview & Download */}
          {selectedReq?.deliveries && selectedReq.deliveries.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocalShippingIcon sx={{ color: '#0284C7' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0369A1' }}>
                  Delivery Agency Dispatch Summary:
                </Typography>
              </Box>
              {selectedReq.deliveries.map((d, index) => (
                <Box key={d.id || index} sx={{ mt: 1, p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1.5, backgroundColor: '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>
                        Dispatch Date: {formatDate(d.deliveredDate || d.createdAt)} | Delivery Agent ID: #{d.agencyUser}
                      </Typography>
                      {d.billNotes && (
                        <Typography variant="body2" sx={{ color: '#0369A1', mt: 0.5, fontStyle: 'italic' }}>
                          Agency Invoice / Waybill Notes: "{d.billNotes}"
                        </Typography>
                      )}
                    </Box>

                    {d.billUrl && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setBillPreviewUrl(d.billUrl)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Preview Receipt
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadBill(d.billUrl, selectedReq?.requestNo)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Download Receipt
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          <Table size="small" sx={{ mt: 2, mb: 3 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Approved Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Agency Dispatched</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Agency Unavailable</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price (₹)</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700 }}>Accepted Qty</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700 }}>Damaged Qty</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700 }}>Not Received</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Accepted Total (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(verificationData).map((vData) => {
                const itemId = vData.deliveryItemId;
                const unitPrice = Number(vData._unitPrice || 0);
                const acceptedQty = Number(vData.acceptedQty || 0);
                const acceptedTotal = acceptedQty * unitPrice;

                return (
                  <TableRow key={itemId}>
                    <TableCell sx={{ fontWeight: 600 }}>{vData._productName}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{vData._approvedQty}</TableCell>
                    <TableCell>
                      <Chip label={`${vData._dispatchedQty} Units`} size="small" color="success" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      {vData._unavailableQty > 0 ? (
                        <Chip label={`${vData._unavailableQty} Out of Stock`} size="small" color="warning" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">0</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{unitPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: vData._dispatchedQty }}
                        value={vData.acceptedQty ?? ''}
                        onChange={(e) => handleFieldChange(itemId, 'acceptedQty', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: vData._dispatchedQty }}
                        value={vData.damagedQty ?? ''}
                        onChange={(e) => handleFieldChange(itemId, 'damagedQty', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: vData._dispatchedQty }}
                        value={vData.notReceivedQty ?? ''}
                        onChange={(e) => handleFieldChange(itemId, 'notReceivedQty', e.target.value)}
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

          {/* Grand Total Financial Acceptance Banner */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#065F46' }}>
              Final Verified Accepted Financial Total:
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#047857' }}>
              ₹{grandAcceptedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>

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

      {/* Bill Receipt Preview Dialog */}
      <Dialog open={Boolean(billPreviewUrl)} onClose={() => setBillPreviewUrl(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon sx={{ color: '#38A169' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Delivery Agency Bill / Receipt Attachment Preview
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, backgroundColor: '#F8FAFC' }}>
          {billPreviewUrl && billPreviewUrl.startsWith('data:application/pdf') ? (
            <embed src={billPreviewUrl} type="application/pdf" width="100%" height="500px" style={{ borderRadius: 8 }} />
          ) : billPreviewUrl ? (
            <Box
              component="img"
              src={billPreviewUrl}
              alt="Receipt Attachment"
              sx={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#F1F5F9' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadBill(billPreviewUrl, selectedReq?.requestNo)}
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Download Receipt File
          </Button>
          <Button onClick={() => setBillPreviewUrl(null)} color="inherit" sx={{ fontWeight: 600 }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Verification;
