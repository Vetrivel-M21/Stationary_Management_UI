import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Chip
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { requestService } from '../services/requestService';
import StatusChip from '../components/common/StatusChip';
import { formatDate } from '../utils/formatters';

const Deliveries = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [itemDeliveries, setItemDeliveries] = useState({});
  const [billUrl, setBillUrl] = useState('');
  const [billNotes, setBillNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    setLoading(true);
    try {
      const resApproved = await requestService.getRequests('APPROVED', 1, 100);
      const resPartial = await requestService.getRequests('PARTIALLY_DELIVERED', 1, 100);
      let list = [];
      if (resApproved.success) list = [...list, ...(resApproved.data.requests || [])];
      if (resPartial.success) list = [...list, ...(resPartial.data.requests || [])];
      // Deduplicate requests by ID
      const uniqueMap = new Map();
      list.forEach((item) => uniqueMap.set(item.id, item));
      setRequests(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeliveryModal = (req) => {
    setSelectedReq(req);
    const initialDeliveries = {};

    (req.items || []).forEach((item) => {
      const pId = Number(item.productId || item.product?.id || item.id);
      const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;

      if (!isRemoved && approvedQty > 0) {
        let prevDelivered = 0;
        let prevUnavailable = 0;

        (req.deliveries || []).forEach((d) => {
          (d.items || []).forEach((di) => {
            if (Number(di.productId || di.product?.id) === pId) {
              prevDelivered += Number(di.deliveredQty || 0);
              prevUnavailable += Number(di.unavailableQty || 0);
            }
          });
        });

        const remainingQty = Math.max(0, approvedQty - (prevDelivered + prevUnavailable));
        const defaultPrice = item.unitPrice || item.product?.unitPrice || 0;

        if (remainingQty > 0) {
          initialDeliveries[pId] = {
            productId: pId,
            approvedQty: approvedQty,
            prevDeliveredQty: prevDelivered,
            prevUnavailableQty: prevUnavailable,
            remainingQty: remainingQty,
            deliveredQty: remainingQty,
            unavailableQty: 0,
            unitPrice: defaultPrice,
            remarks: '',
          };
        }
      }
    });

    setItemDeliveries(initialDeliveries);
    setDeliveryNotes('');
    setBillUrl('');
    setBillNotes('');
    setError('');
    setDeliveryModalOpen(true);
  };

  const handleFieldChange = (productId, field, valStr) => {
    const key = Number(productId);
    const item = itemDeliveries[key];
    if (!item) return;

    const maxAllowed = item.remainingQty;
    const cleanStr = String(valStr || '').replace(/^0+(?=\d)/, '');

    if (field === 'unitPrice') {
      const rawPrice = parseFloat(cleanStr);
      const priceVal = isNaN(rawPrice) ? 0 : Math.max(0, rawPrice);
      setItemDeliveries((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          unitPrice: cleanStr === '' ? '' : priceVal,
        },
      }));
      return;
    }

    const rawVal = cleanStr === '' ? 0 : parseInt(cleanStr, 10);
    const numVal = isNaN(rawVal) ? 0 : Math.max(0, rawVal);

    if (field === 'unavailableQty') {
      const newUnavailable = Math.min(maxAllowed, numVal);
      const newDelivered = Math.max(0, maxAllowed - newUnavailable);
      setItemDeliveries((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          unavailableQty: cleanStr === '' ? 0 : newUnavailable,
          deliveredQty: newDelivered,
        },
      }));
    } else if (field === 'deliveredQty') {
      const newDelivered = Math.min(maxAllowed, numVal);
      const newUnavailable = Math.max(0, maxAllowed - newDelivered);
      setItemDeliveries((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          deliveredQty: cleanStr === '' ? 0 : newDelivered,
          unavailableQty: newUnavailable,
        },
      }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Bill file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBillUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const totalDeliveredQty = Object.values(itemDeliveries).reduce(
    (acc, curr) => acc + Number(curr.deliveredQty || 0), 0
  );

  const missingUnitPrice = Object.values(itemDeliveries).some(
    (item) => Number(item.deliveredQty || 0) > 0 && (item.unitPrice === '' || item.unitPrice === null || item.unitPrice === undefined || Number(item.unitPrice) <= 0)
  );

  const handleSubmitDelivery = async () => {
    setError('');

    if (totalDeliveredQty <= 0) {
      setError('Please enter a delivered quantity greater than 0 to process delivery dispatch.');
      return;
    }

    if (missingUnitPrice) {
      setError('Unit price (₹) is required for all delivered items before dispatching.');
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = Object.values(itemDeliveries).map((item) => ({
        ...item,
        deliveredQty: Number(item.deliveredQty || 0),
        unavailableQty: Number(item.unavailableQty || 0),
        unitPrice: Number(item.unitPrice || 0),
      }));
      const payload = {
        deliveryNotes,
        billUrl,
        billNotes,
        items: itemsPayload,
      };

      const res = await requestService.processDelivery(selectedReq.id, payload);
      if (res.success) {
        setDeliveryModalOpen(false);
        fetchApprovedRequests();
      }
    } catch (err) {
      setError(err.message || 'Delivery processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = Object.values(itemDeliveries).reduce((acc, curr) => {
    const qty = Number(curr.deliveredQty || 0);
    const price = Number(curr.unitPrice || 0);
    return acc + (qty * price);
  }, 0);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Agency Delivery Management
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Approval Date</TableCell>
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
                  <TableCell>{formatDate(row.approvedAt)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleOpenDeliveryModal(row)}
                        sx={{ backgroundColor: '#2B6CB0' }}
                      >
                        Process Delivery
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delivery Dialog */}
      <Dialog open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, px: 3, py: 2 }}>
          Record Delivery: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {totalDeliveredQty === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Delivered quantity is currently 0. Please specify delivered quantities to enable dispatch.
            </Alert>
          )}
          {missingUnitPrice && totalDeliveredQty > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Unit price (₹) is required for all delivered items. Please specify valid unit prices to enable dispatch.
            </Alert>
          )}

          <Table size="small" sx={{ mt: 2, mb: 3 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Approved Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prev. Delivered</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remaining Qty</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700 }}>Delivered Qty *</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700 }}>Unavailable Qty</TableCell>
                <TableCell width={130} sx={{ fontWeight: 700 }}>Unit Price (₹) *</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Line Total (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(itemDeliveries).map((delData) => {
                const pId = delData.productId;
                const reqItem = (selectedReq?.items || []).find(
                  (i) => Number(i.productId || i.product?.id || i.id) === pId
                );
                const productName = reqItem?.product?.name || delData.productName || `Product #${pId}`;
                const lineTotal = Number(delData.deliveredQty || 0) * Number(delData.unitPrice || 0);
                const isPriceMissing = Number(delData.deliveredQty || 0) > 0 && (delData.unitPrice === '' || delData.unitPrice === null || delData.unitPrice === undefined || Number(delData.unitPrice) <= 0);

                return (
                  <TableRow key={pId}>
                    <TableCell sx={{ fontWeight: 600 }}>{productName}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{delData.approvedQty}</TableCell>
                    <TableCell sx={{ color: '#4A5568' }}>{delData.prevDeliveredQty || 0}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{delData.remainingQty}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        required
                        inputProps={{ min: 0, max: delData.remainingQty }}
                        value={delData.deliveredQty ?? ''}
                        onChange={(e) => handleFieldChange(pId, 'deliveredQty', e.target.value)}
                        error={totalDeliveredQty === 0}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0, max: delData.remainingQty }}
                        value={delData.unavailableQty ?? ''}
                        onChange={(e) => handleFieldChange(pId, 'unavailableQty', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        required={Number(delData.deliveredQty || 0) > 0}
                        inputProps={{ min: 0, step: 0.5 }}
                        value={delData.unitPrice ?? ''}
                        onChange={(e) => handleFieldChange(pId, 'unitPrice', e.target.value)}
                        error={isPriceMissing}
                        helperText={isPriceMissing ? 'Required' : ''}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
                      ₹{lineTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Grand Total Banner */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#EBF8FF', border: '1px solid #90CDF4', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
              Total Order Dispatch Amount:
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2B6CB0' }}>
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>

          {/* Bill Attachment & Notes Upload */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#F8FAFC' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2D3748' }}>
              📄 Delivery Bill / Slip Attachment Upload:
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" size="small">
                Upload Bill / Slip (Image/PDF)
                <input type="file" hidden accept="image/*,application/pdf" onChange={handleFileUpload} />
              </Button>
              {billUrl && (
                <Button variant="text" color="error" size="small" onClick={() => setBillUrl('')}>
                  Remove Attachment
                </Button>
              )}
            </Box>

            {billUrl && (
              <Box sx={{ mb: 2, p: 1.5, border: '1px dashed #3182CE', borderRadius: 1, backgroundColor: '#FFFFFF' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                  Bill Attachment Preview:
                </Typography>
                {billUrl.startsWith('data:application/pdf') ? (
                  <Typography variant="body2" sx={{ color: '#2F855A', fontWeight: 600 }}>
                    PDF Document Loaded Ready for Attachment
                  </Typography>
                ) : (
                  <Box
                    component="img"
                    src={billUrl}
                    alt="Bill Preview"
                    sx={{ maxHeight: 120, borderRadius: 1, border: '1px solid #CBD5E0' }}
                  />
                )}
              </Box>
            )}

            <TextField
              label="Delivery Bill / Waybill Remarks & Invoice Notes"
              multiline
              rows={2}
              fullWidth
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              placeholder="Enter waybill tracking number, supplier invoice number, courier reference..."
            />
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeliveryModalOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={submitting || totalDeliveredQty <= 0 || missingUnitPrice}
            startIcon={<LocalShippingIcon />}
            onClick={handleSubmitDelivery}
            sx={{ backgroundColor: '#2B6CB0' }}
          >
            Complete Delivery Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deliveries;
