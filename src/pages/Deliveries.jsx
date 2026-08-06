import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress
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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests('APPROVED', 1, 50);
      if (res.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error(err);
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
        const defaultPrice = item.unitPrice || item.product?.unitPrice || 0;
        initialDeliveries[pId] = {
          productId: pId,
          approvedQty: approvedQty,
          deliveredQty: approvedQty,
          unavailableQty: 0,
          unitPrice: defaultPrice,
          remarks: '',
        };
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
    if (field === 'unitPrice') {
      const rawPrice = parseFloat(valStr);
      const priceVal = isNaN(rawPrice) ? 0 : Math.max(0, rawPrice);
      setItemDeliveries((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          unitPrice: priceVal,
        },
      }));
      return;
    }

    const rawVal = valStr === '' ? 0 : parseInt(valStr, 10);
    const numVal = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
    setItemDeliveries((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: numVal,
      },
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Bill file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBillUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitDelivery = async () => {
    setError('');
    try {
      const itemsPayload = Object.values(itemDeliveries);
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
    }
  };

  // Calculate Grand Total for Delivery
  const grandTotal = Object.values(itemDeliveries).reduce((acc, curr) => {
    const qty = curr.deliveredQty || 0;
    const price = curr.unitPrice || 0;
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
        ) : requests.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No approved requests currently pending agency delivery.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request No</TableCell>
                <TableCell>Destination Branch</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Approval Date</TableCell>
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
                  <TableCell>{formatDate(row.approvedAt)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<LocalShippingIcon />}
                      onClick={() => handleOpenDeliveryModal(row)}
                      sx={{ backgroundColor: '#2B6CB0' }}
                    >
                      Process Delivery
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delivery Dialog */}
      <Dialog open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          Record Delivery: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Approved Qty</TableCell>
                <TableCell width={90}>Delivered</TableCell>
                <TableCell width={90}>Unavailable</TableCell>
                <TableCell width={110}>Unit Price (₹)</TableCell>
                <TableCell align="right">Line Total (₹)</TableCell>
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
                  const pId = Number(item.productId || item.product?.id || item.id);
                  const delData = itemDeliveries[pId] || {};
                  const approvedQty = delData.approvedQty || 0;
                  const deliveredQty = delData.deliveredQty !== undefined ? delData.deliveredQty : 0;
                  const unavailableQty = delData.unavailableQty || 0;
                  const unitPrice = delData.unitPrice !== undefined ? delData.unitPrice : (item.unitPrice || item.product?.unitPrice || 0);
                  const lineTotal = deliveredQty * unitPrice;

                  return (
                    <TableRow key={item.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{approvedQty}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: approvedQty }}
                          value={delData.deliveredQty !== undefined ? delData.deliveredQty : approvedQty}
                          onChange={(e) => handleFieldChange(pId, 'deliveredQty', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: approvedQty }}
                          value={delData.unavailableQty !== undefined ? delData.unavailableQty : 0}
                          onChange={(e) => handleFieldChange(pId, 'unavailableQty', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 0.5 }}
                          value={delData.unitPrice !== undefined ? delData.unitPrice : 0}
                          onChange={(e) => handleFieldChange(pId, 'unitPrice', e.target.value)}
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
