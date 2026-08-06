import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, FormControl, InputLabel, Select, MenuItem, TablePagination, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, Badge
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ChatIcon from '@mui/icons-material/Chat';
import { requestService } from '../services/requestService';
import StatusChip from '../components/common/StatusChip';
import TimelineView from '../components/common/TimelineView';
import BillViewerModal from '../components/common/BillViewerModal';
import RequestChatModal from '../components/common/RequestChatModal';
import { formatDate } from '../utils/formatters';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [page, rowsPerPage, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests(statusFilter, page + 1, rowsPerPage);
      if (res.success) {
        setRequests(res.data.requests || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleOpenChat = (req) => {
    setSelectedReq(req);
    setChatModalOpen(true);
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

      const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
      const effectiveApproved = isRemoved ? 0 : approvedQty;
      totalApprovedOrderValue += effectiveApproved * unitPrice;
      totalDeliveredOrderValue += itemDeliveredQty * unitPrice;
    });
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Stationery Requisitions
      </Typography>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="SUBMITTED">SUBMITTED</MenuItem>
              <MenuItem value="APPROVED">APPROVED</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
              <MenuItem value="DELIVERED">DELIVERED</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request No</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Branch & Location</TableCell>
                <TableCell>Applicant Name</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                  <TableCell><Chip label={row.department || 'GENERAL'} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.branch?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.location || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.applicantName || row.requester?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.applicantMobile || row.requester?.mobile}</Typography>
                  </TableCell>
                  <TableCell>{formatDate(row.submittedAt)}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetails(row.id)}
                      sx={{ mr: 1 }}
                    >
                      Details
                    </Button>
                    <Button
                      variant={row.chatCount > 0 ? "contained" : "outlined"}
                      size="small"
                      color={row.chatCount > 0 ? "primary" : "inherit"}
                      startIcon={
                        <Badge badgeContent={row.chatCount} color="error" max={99}>
                          <ChatIcon />
                        </Badge>
                      }
                      onClick={() => handleOpenChat(row)}
                    >
                      Chat {row.chatCount > 0 && `(${row.chatCount})`}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

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
              <TimelineView status={selectedReq.status} />

              <Box sx={{ display: 'flex', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2"><strong>Department:</strong> {selectedReq.department || 'GENERAL'}</Typography>
                <Typography variant="body2"><strong>Branch:</strong> {selectedReq.branch?.name}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {selectedReq.location || '-'}</Typography>
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
                    const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
                    const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
                    const isRejected = isRemoved || (item.approvalItem && approvedQty === 0);
                    
                    let deliveredQty = 0;
                    let agencyUnitPrice = 0;
                    if (!isRejected && selectedReq.deliveries && selectedReq.deliveries.length > 0) {
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

                    const effectiveApproved = isRejected ? 0 : approvedQty;
                    const lineApprovedTotal = effectiveApproved * unitPrice;

                    let remarkText = item.approvalItem?.remarks || '-';
                    if (isRejected && (!item.approvalItem?.remarks || item.approvalItem.remarks === '-')) {
                      remarkText = 'Rejected by Approver';
                    }

                    return (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.product?.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.requestedQty}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: isRejected ? '#C53030' : 'inherit' }}>
                          {isRejected ? '0 (Rejected)' : approvedQty}
                        </TableCell>
                        <TableCell sx={{ color: isRejected ? 'text.disabled' : '#2F855A', fontWeight: 600 }}>
                          {isRejected ? 0 : deliveredQty}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
                          ₹{lineApprovedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell sx={{ fontStyle: isRejected ? 'italic' : 'normal', color: isRejected ? '#C53030' : 'inherit' }}>
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
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#2B6CB0' }}>
                    ₹{totalApprovedOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
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
      />
    </Box>
  );
};

export default Requests;
