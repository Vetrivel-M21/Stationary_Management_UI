import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Checkbox, FormControlLabel, Chip, Badge, Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatIcon from '@mui/icons-material/Chat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { requestService } from '../services/requestService';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import StatusChip from '../components/common/StatusChip';
import TimelineView from '../components/common/TimelineView';
import BillViewerModal from '../components/common/BillViewerModal';
import RequestChatModal from '../components/common/RequestChatModal';
import { formatDate, formatLocationDisplay } from '../utils/formatters';

const Approvals = () => {
  const { user } = useAuth();
  const approverDept = user?.department || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [itemEdits, setItemEdits] = useState({});
  const [generalRemarks, setGeneralRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests('SUBMITTED', 1, 50);
      if (res.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprovalModal = (req) => {
    setSelectedReq(req);
    const initialEdits = {};
    req.items.forEach((item) => {
      initialEdits[item.id] = {
        approvedQty: item.requestedQty,
        remove: false,
        remarks: '',
      };
    });
    setItemEdits(initialEdits);
    setGeneralRemarks('');
    setError('');
    setApprovalModalOpen(true);
  };

  const handleOpenChat = (req) => {
    setSelectedReq(req);
    setChatModalOpen(true);
  };

  const handleOpenDetails = async (id) => {
    try {
      const res = await requestService.getRequestById(id);
      if (res.success) {
        setSelectedReq(res.data);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChatRead = (requestId, readCount) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, chatCount: readCount } : r))
    );
  };

  const handleQtyChange = (itemId, val) => {
    const qty = parseInt(val, 10);
    setItemEdits({
      ...itemEdits,
      [itemId]: { ...itemEdits[itemId], approvedQty: isNaN(qty) ? 0 : qty },
    });
  };

  const handleRemoveToggle = (itemId, checked) => {
    setItemEdits({
      ...itemEdits,
      [itemId]: { ...itemEdits[itemId], remove: checked },
    });
  };

  const handleProcess = async (action) => {
    setError('');
    try {
      const itemsPayload = Object.keys(itemEdits).map((itemId) => ({
        requestItemId: Number(itemId),
        approvedQty: itemEdits[itemId].approvedQty,
        remove: itemEdits[itemId].remove,
        remarks: itemEdits[itemId].remarks,
      }));

      const payload = {
        action: action, // APPROVE or REJECT
        remarks: generalRemarks,
        items: itemsPayload,
      };

      const res = await requestService.processApproval(selectedReq.id, payload);
      if (res.success) {
        setApprovalModalOpen(false);
        fetchPendingApprovals();
      }
    } catch (err) {
      setError(err.message || 'Approval process failed');
    }
  };

  const latestDelivery = selectedReq?.deliveries && selectedReq.deliveries.length > 0
    ? selectedReq.deliveries[selectedReq.deliveries.length - 1]
    : null;

  let totalRequestedOrderValue = 0;
  let totalApprovedOrderValue = 0;
  let totalDeliveredOrderValue = 0;

  if (selectedReq?.items) {
    selectedReq.items.forEach((item) => {
      let agencyUnitPrice = 0;
      let itemDeliveredQty = 0;
      if (selectedReq.deliveries && selectedReq.deliveries.length > 0) {
        selectedReq.deliveries.forEach((d) => {
          (d.items || []).forEach((di) => {
            if (Number(di.productId || di.product?.id) === Number(item.productId || item.product?.id)) {
              itemDeliveredQty += Number(di.deliveredQty || 0);
              if (di.unitPrice && di.unitPrice > 0) {
                agencyUnitPrice = di.unitPrice;
              }
            }
          });
        });
      }

      const unitPrice = agencyUnitPrice || item.unitPrice || item.product?.unitPrice || 0;
      totalRequestedOrderValue += (item.requestedQty || 0) * unitPrice;

      const isSubmitted = selectedReq.status === 'SUBMITTED';
      const approvedQty = isSubmitted ? 0 : (item.approvalItem ? item.approvalItem.approvedQty : (item.approvedQty !== undefined ? item.approvedQty : 0));
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
      const effectiveApproved = (isSubmitted || isRemoved) ? 0 : approvedQty;
      totalApprovedOrderValue += effectiveApproved * unitPrice;
      totalDeliveredOrderValue += itemDeliveredQty * unitPrice;
    });
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Pending Request Approvals
        </Typography>
        {approverDept && (
          <Chip
            label={`Approver Department: ${approverDept}`}
            color="success"
            sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}
          />
        )}
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : requests.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No pending requests currently awaiting approval in {approverDept || 'your department'}.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F0FFF4' }}>
                <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Branch & Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Applicant Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Items Count</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Submitted Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                  <TableCell><Chip label={row.department || 'GENERAL'} size="small" color="success" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.branch?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatLocationDisplay(row.branch?.name, row.location)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.applicantName || row.requester?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.applicantMobile || row.requester?.mobile}</Typography>
                  </TableCell>
                  <TableCell>{row.items?.length || 0} Items</TableCell>
                  <TableCell>{formatDate(row.submittedAt)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenDetails(row.id)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleOpenApprovalModal(row)}
                        sx={{ backgroundColor: '#2B6CB0' }}
                      >
                        Approve
                      </Button>
                      {(() => {
                        const unreadCount = chatService.getUnreadCount(user?.id, row.id, row.chatCount);
                        return unreadCount > 0 ? (
                          <Badge badgeContent={unreadCount} color="error" max={99}>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<ChatIcon />}
                              onClick={() => handleOpenChat(row)}
                            >
                              Chat ({unreadCount})
                            </Button>
                          </Badge>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            color="inherit"
                            startIcon={<ChatIcon />}
                            onClick={() => handleOpenChat(row)}
                          >
                            Chat
                          </Button>
                        );
                      })()}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Approval Processing Dialog */}
      <Dialog open={approvalModalOpen} onClose={() => setApprovalModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          Review Stationery Request: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Requested Items (Adjust Quantities or Exclude Items):
          </Typography>

          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Requested Qty</TableCell>
                <TableCell width={120}>Approved Qty</TableCell>
                <TableCell width={120}>Remove Item</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedReq?.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {item.itemKind === 'SHOP' ? item.itemName : item.product?.name}
                    {item.itemKind === 'SHOP' && (
                      <Chip label="Shop Item" size="small" sx={{ ml: 1, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell>{item.requestedQty} {item.itemKind === 'SHOP' ? '' : item.product?.unit}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      disabled={itemEdits[item.id]?.remove}
                      value={itemEdits[item.id]?.approvedQty || 0}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(itemEdits[item.id]?.remove)}
                          onChange={(e) => handleRemoveToggle(item.id, e.target.checked)}
                          color="error"
                        />
                      }
                      label="Remove"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TextField
            label="General Approver Comments / Remarks"
            multiline
            rows={2}
            fullWidth
            value={generalRemarks}
            onChange={(e) => setGeneralRemarks(e.target.value)}
            placeholder="Optional comments for requester"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleProcess('REJECT')}
          >
            Reject Request
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => setApprovalModalOpen(false)} color="inherit">Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleProcess('APPROVE')}
              sx={{ backgroundColor: '#2F855A' }}
            >
              Approve Request
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Request Details: {selectedReq?.requestNo}
          </Typography>
          {latestDelivery?.billUrl && (
            <Button
              variant="contained"
              size="small"
              startIcon={<ReceiptLongIcon />}
              onClick={() => setBillModalOpen(true)}
              sx={{ backgroundColor: '#2F855A', '&:hover': { backgroundColor: '#276749' } }}
            >
              View Delivery Bill / Slip
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedReq && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TimelineView status={selectedReq.status} request={selectedReq} />

              <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2"><strong>Department:</strong> {selectedReq.department || 'GENERAL'}</Typography>
                <Typography variant="body2"><strong>Branch:</strong> {selectedReq.branch?.name}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {formatLocationDisplay(selectedReq.branch?.name, selectedReq.location)}</Typography>
                <Typography variant="body2"><strong>Applicant:</strong> {selectedReq.applicantName || selectedReq.requester?.name} ({selectedReq.applicantMobile || selectedReq.requester?.mobile})</Typography>
                <Typography variant="body2"><strong>Status:</strong> <StatusChip status={selectedReq.status} /></Typography>
              </Box>

              <Divider />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>Requested & Delivery Item Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Unit Price (₹)</TableCell>
                    <TableCell>Requested Qty</TableCell>
                    <TableCell>Approved Qty</TableCell>
                    <TableCell>Delivered Qty</TableCell>
                    <TableCell align="right">Approved Total (₹)</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedReq.items?.map((item) => {
                    const isSubmitted = selectedReq.status === 'SUBMITTED';
                    const rawApproved = item.approvalItem ? item.approvalItem.approvedQty : (item.approvedQty !== undefined ? item.approvedQty : 0);
                    const approvedQty = isSubmitted ? 0 : rawApproved;
                    const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
                    const isRejected = !isSubmitted && (isRemoved || (item.approvalItem && rawApproved === 0));

                    const agencyRejectedItem = !isSubmitted && !isRejected && (selectedReq.deliveries || [])
                      .flatMap((d) => d.items || [])
                      .find((di) => Number(di.productId || di.product?.id) === Number(item.productId || item.product?.id) && di.rejected);
                    const isAgencyRejected = Boolean(agencyRejectedItem);

                    let deliveredQty = 0;
                    let agencyUnitPrice = 0;
                    if (!isSubmitted && !isRejected && selectedReq.deliveries && selectedReq.deliveries.length > 0) {
                      selectedReq.deliveries.forEach((d) => {
                        (d.items || []).forEach((di) => {
                          const diProdId = Number(di.productId || di.product?.id);
                          const itemProdId = Number(item.productId || item.product?.id);
                          if (diProdId === itemProdId) {
                            deliveredQty += Number(di.deliveredQty || 0);
                            if (di.unitPrice && di.unitPrice > 0) {
                              agencyUnitPrice = di.unitPrice;
                            }
                          }
                        });
                      });
                    }

                    const unitPrice = agencyUnitPrice || item.unitPrice || item.product?.unitPrice || 0;

                    const effectiveApproved = (isSubmitted || isRejected) ? 0 : approvedQty;
                    const lineApprovedTotal = effectiveApproved * unitPrice;

                    let remarkText = item.approvalItem?.remarks || '-';
                    if (isSubmitted) {
                      remarkText = 'Awaiting Approver Review';
                    } else if (isRejected && (!item.approvalItem?.remarks || item.approvalItem.remarks === '-')) {
                      remarkText = 'Rejected by Approver';
                    } else if (isAgencyRejected) {
                      remarkText = (agencyRejectedItem.remarks && agencyRejectedItem.remarks !== '-') ? agencyRejectedItem.remarks : 'Rejected by Agency';
                    }

                    return (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {item.itemKind === 'SHOP' ? item.itemName : item.product?.name}
                          {item.itemKind === 'SHOP' && (
                            <Chip label="Shop Item" size="small" sx={{ ml: 1, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.65rem' }} />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.requestedQty}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: isSubmitted ? '#D69E2E' : isRejected ? '#C53030' : 'inherit', fontStyle: isSubmitted ? 'italic' : 'normal' }}>
                          {isSubmitted ? 'Pending Approval' : isRejected ? '0 (Rejected)' : approvedQty}
                        </TableCell>
                        <TableCell sx={{ color: isSubmitted || isRejected || isAgencyRejected ? 'text.disabled' : '#2F855A', fontWeight: 600 }}>
                          {isSubmitted || isRejected || isAgencyRejected ? 0 : deliveredQty}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isSubmitted ? 'text.secondary' : '#2B6CB0' }}>
                          {isSubmitted ? '-' : `₹${lineApprovedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell sx={{ fontStyle: isSubmitted || isRejected || isAgencyRejected ? 'italic' : 'normal', color: isSubmitted ? '#D69E2E' : (isRejected || isAgencyRejected) ? '#C53030' : 'inherit' }}>
                          {remarkText}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Box sx={{ p: 2, backgroundColor: '#EDF2F7', borderRadius: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Requested Value: <strong>₹{totalRequestedOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Delivered Value: <strong>₹{totalDeliveredOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL APPROVED ORDER AMOUNT</Typography>
                  {selectedReq.status === 'SUBMITTED' ? (
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#D69E2E', fontStyle: 'italic' }}>
                      Pending Approval
                    </Typography>
                  ) : (
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#2B6CB0' }}>
                      ₹{totalApprovedOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsModalOpen(false)} variant="contained" color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <BillViewerModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        billUrl={latestDelivery?.billUrl}
        billNotes={latestDelivery?.billNotes}
        requestNo={selectedReq?.requestNo}
        deliveryDate={latestDelivery?.deliveredDate}
        agentName={latestDelivery?.deliveryAgent?.name}
      />

      <RequestChatModal
        open={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        request={selectedReq}
        onRead={handleChatRead}
      />
    </Box>
  );
};

export default Approvals;
