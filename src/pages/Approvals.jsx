import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Checkbox, FormControlLabel, Chip, Badge
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatIcon from '@mui/icons-material/Chat';
import { requestService } from '../services/requestService';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import StatusChip from '../components/common/StatusChip';
import RequestChatModal from '../components/common/RequestChatModal';
import { formatDate } from '../utils/formatters';

const Approvals = () => {
  const { user } = useAuth();
  const approverDept = user?.department || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
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
                    <Typography variant="caption" color="text.secondary">{row.location || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.applicantName || row.requester?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.applicantMobile || row.requester?.mobile}</Typography>
                  </TableCell>
                  <TableCell>{row.items?.length || 0} Items</TableCell>
                  <TableCell>{formatDate(row.submittedAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleOpenApprovalModal(row)}
                      sx={{ backgroundColor: '#2B6CB0', mr: 1 }}
                    >
                      Approve
                    </Button>
                    {(() => {
                      const unreadCount = chatService.getUnreadCount(user?.id, row.id, row.chatCount);
                      return (
                        <Button
                          variant={unreadCount > 0 ? "contained" : "outlined"}
                          size="small"
                          color={unreadCount > 0 ? "primary" : "inherit"}
                          startIcon={
                            unreadCount > 0 ? (
                              <Badge badgeContent={unreadCount} color="error" max={99}>
                                <ChatIcon />
                              </Badge>
                            ) : (
                              <ChatIcon />
                            )
                          }
                          onClick={() => handleOpenChat(row)}
                        >
                          Chat {unreadCount > 0 && `(${unreadCount})`}
                        </Button>
                      );
                    })()}
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
                  <TableCell sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                  <TableCell>{item.requestedQty} {item.product?.unit}</TableCell>
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
