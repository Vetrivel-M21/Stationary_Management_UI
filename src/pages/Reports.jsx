import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Table, TableHead, TableRow,
  TableCell, TableBody, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, ToggleButton, ToggleButtonGroup, Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PercentIcon from '@mui/icons-material/Percent';
import { requestService } from '../services/requestService';
import { formatDate } from '../utils/formatters';
import { branchService } from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import StatusChip from '../components/common/StatusChip';
import TimelineView from '../components/common/TimelineView';

import BillViewerModal from '../components/common/BillViewerModal';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const Reports = () => {
  const { user } = useAuth();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdminOrMonitor = role === 'ADMIN' || role === 'MONITOR';

  const [requests, setRequests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewPerspective, setViewPerspective] = useState('QUANTITY'); // 'QUANTITY' | 'PRODUCTS'

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Request Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredRequests();
  }, [statusFilter, branchFilter]);

  const fetchInitialData = async () => {
    if (isAdminOrMonitor) {
      try {
        const res = await branchService.getBranches('', 1, 100);
        if (res.success) {
          setBranches(res.data.branches || []);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    }
    fetchFilteredRequests();
  };

  const fetchFilteredRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests(statusFilter, 1, 200);
      if (res.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests for report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    if (branchFilter && req.branchId !== Number(branchFilter) && req.branch?.id !== Number(branchFilter)) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNo = req.requestNo?.toLowerCase().includes(term);
      const matchRequester = req.requester?.name?.toLowerCase().includes(term);
      const matchBranch = req.branch?.name?.toLowerCase().includes(term);
      const matchItem = req.items?.some(i => i.product?.name?.toLowerCase().includes(term));
      if (!matchNo && !matchRequester && !matchBranch && !matchItem) return false;
    }
    if (startDate) {
      const reqDate = new Date(req.submittedAt);
      if (reqDate < new Date(startDate)) return false;
    }
    if (endDate) {
      const reqDate = new Date(req.submittedAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (reqDate > end) return false;
    }
    return true;
  });

  // Helper to extract unit price (prioritizing Agency entered price during delivery)
  const getItemUnitPrice = (item, deliveries) => {
    let agencyPrice = 0;
    if (deliveries && deliveries.length > 0) {
      deliveries.forEach((d) => {
        (d.items || []).forEach((di) => {
          const diPId = Number(di.productId || di.product?.id);
          const itemPId = Number(item.productId || item.product?.id || item.id);
          if (diPId === itemPId && di.unitPrice && Number(di.unitPrice) > 0) {
            agencyPrice = Number(di.unitPrice);
          }
        });
      });
    }
    return agencyPrice || Number(item.unitPrice || 0) || Number(item.product?.unitPrice || 0);
  };

  // 1. Physical Quantity Metrics & Order Amounts
  let totalRequestedQty = 0;
  let totalApprovedQty = 0;
  let totalDeliveredQty = 0;
  let totalApprovedValue = 0;
  let totalDeliveredValue = 0;

  // 2. Product Items Metrics (Line Items / Distinct Product Types)
  let totalRequestedItems = 0;
  let totalApprovedItems = 0;
  let totalDeliveredItems = 0;

  filteredRequests.forEach((req) => {
    (req.items || []).forEach((item) => {
      const unitPrice = getItemUnitPrice(item, req.deliveries);
      totalRequestedQty += item.requestedQty || 0;

      const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
      const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
      const isRejected = isRemoved || (item.approvalItem && approvedQty === 0);
      const effectiveApproved = isRejected ? 0 : approvedQty;
      totalApprovedQty += effectiveApproved;
      totalApprovedValue += effectiveApproved * unitPrice;

      let itemDeliveredQty = 0;
      if (!isRejected && req.deliveries && req.deliveries.length > 0) {
        req.deliveries.forEach((d) => {
          (d.items || []).forEach((di) => {
            if (Number(di.productId || di.product?.id) === Number(item.productId || item.product?.id)) {
              itemDeliveredQty += Number(di.deliveredQty || 0);
            }
          });
        });
      }
      totalDeliveredQty += itemDeliveredQty;
      totalDeliveredValue += itemDeliveredQty * unitPrice;

      // Product Line Item Counts
      totalRequestedItems += 1;
      if (!isRejected) {
        totalApprovedItems += 1;
      }
      if (!isRejected && itemDeliveredQty > 0) {
        totalDeliveredItems += 1;
      }
    });
  });

  const qtyFulfillmentRate = totalApprovedQty > 0
    ? Math.round((totalDeliveredQty / totalApprovedQty) * 100)
    : 0;

  const itemFulfillmentRate = totalApprovedItems > 0
    ? Math.round((totalDeliveredItems / totalApprovedItems) * 100)
    : 0;

  const activeFulfillmentRate = viewPerspective === 'QUANTITY' ? qtyFulfillmentRate : itemFulfillmentRate;

  // Export to CSV with Financial Amounts & Bill Link
  const handleExportCSV = () => {
    const csvRows = [
      ['Request No', 'Submitted Date', 'Branch', 'Requester', 'Status', 'Product Name', 'Unit Price (INR)', 'Requested Qty', 'Approved Qty', 'Delivered Qty', 'Approved Amount (INR)', 'Delivered Amount (INR)', 'Remarks', 'Bill Attached']
    ];

    filteredRequests.forEach((req) => {
      const hasBill = req.deliveries?.some(d => d.billUrl);

      (req.items || []).forEach((item) => {
        const unitPrice = getItemUnitPrice(item, req.deliveries);
        const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
        const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
        const isRejected = isRemoved || (item.approvalItem && approvedQty === 0);

        let deliveredQty = 0;
        let rawUnavailableQty = 0;
        if (!isRejected && req.deliveries && req.deliveries.length > 0) {
          req.deliveries.forEach((d) => {
            (d.items || []).forEach((di) => {
              if (Number(di.productId || di.product?.id) === Number(item.productId || item.product?.id)) {
                deliveredQty += Number(di.deliveredQty || 0);
                rawUnavailableQty += Number(di.unavailableQty || 0);
              }
            });
          });
        }

        const effectiveApproved = isRejected ? 0 : approvedQty;
        const lineApprovedAmount = effectiveApproved * unitPrice;
        const lineDeliveredAmount = (isRejected ? 0 : deliveredQty) * unitPrice;

        let remarks = item.approvalItem?.remarks || '-';
        if (isRejected && (!item.approvalItem?.remarks || item.approvalItem.remarks === '-')) {
          remarks = 'Rejected by Approver';
        }

        csvRows.push([
          `"${req.requestNo}"`,
          `"${formatDate(req.submittedAt)}"`,
          `"${req.branch?.name || ''}"`,
          `"${req.requester?.name || ''}"`,
          `"${req.status}"`,
          `"${item.product?.name || ''}"`,
          unitPrice.toFixed(2),
          item.requestedQty,
          isRejected ? 0 : approvedQty,
          isRejected ? 0 : deliveredQty,
          lineApprovedAmount.toFixed(2),
          lineDeliveredAmount.toFixed(2),
          `"${remarks}"`,
          hasBill ? 'YES' : 'NO'
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Order_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenDetails = async (id) => {
    try {
      const res = await requestService.getRequestById(id);
      if (res.success) {
        setSelectedReq(res.data);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon sx={{ fontSize: 36, color: '#2B6CB0' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Order Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive stationery requisition audit, fulfillment breakdown, and export options.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ backgroundColor: '#2F855A', '&:hover': { backgroundColor: '#276749' } }}
          >
            Export to CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ borderColor: '#4A5568', color: '#2D3748' }}
          >
            Print Summary
          </Button>
        </Box>
      </Box>

      {/* Perspective Toggle Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
          Metric Perspective: {viewPerspective === 'QUANTITY' ? 'Physical Unit Quantities (Units)' : 'Product Line Items (Products)'}
        </Typography>
        <ToggleButtonGroup
          value={viewPerspective}
          exclusive
          size="small"
          onChange={(e, val) => { if (val) setViewPerspective(val); }}
          color="primary"
        >
          <ToggleButton value="QUANTITY" sx={{ fontWeight: 600, px: 2 }}>
            📊 Physical Quantities (Units)
          </ToggleButton>
          <ToggleButton value="PRODUCTS" sx={{ fontWeight: 600, px: 2 }}>
            📦 Product Items (Line Items)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* KPI Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #3182CE', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Total Orders</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>{filteredRequests.length}</Typography>
              <Typography variant="caption" color="text.secondary">Requisitions placed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #D69E2E', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                {viewPerspective === 'QUANTITY' ? 'Quantity Requested' : 'Products Requested'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                {viewPerspective === 'QUANTITY' ? totalRequestedQty : totalRequestedItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewPerspective === 'QUANTITY' ? 'Total physical units requested' : 'Total distinct product line items'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #319795', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                {viewPerspective === 'QUANTITY' ? 'Quantity Approved' : 'Products Approved'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#2C7A7B' }}>
                {viewPerspective === 'QUANTITY' ? totalApprovedQty : totalApprovedItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewPerspective === 'QUANTITY'
                  ? `${totalRequestedQty - totalApprovedQty} units rejected`
                  : `${totalRequestedItems - totalApprovedItems} product line items rejected`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #38A169', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
                {viewPerspective === 'QUANTITY' ? 'Quantity Delivered' : 'Products Delivered'}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#2F855A' }}>
                {viewPerspective === 'QUANTITY' ? totalDeliveredQty : totalDeliveredItems}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewPerspective === 'QUANTITY' ? 'Units dispatched' : 'Product types dispatched'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #2B6CB0', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Total Approved Value</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#2B6CB0' }}>
                ₹{totalApprovedValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Delivered: ₹{totalDeliveredValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ borderLeft: '5px solid #805AD5', boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>Fulfillment Rate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: activeFulfillmentRate >= 80 ? '#2F855A' : '#DD6B20' }}>
                {activeFulfillmentRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewPerspective === 'QUANTITY'
                  ? `${totalDeliveredQty}/${totalApprovedQty} approved units`
                  : `${totalDeliveredItems}/${totalApprovedItems} approved product types`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Report Filter Criteria</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Search Order / Product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="REQ No, Product, Requester..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Order Status</InputLabel>
              <Select value={statusFilter} label="Order Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SUBMITTED">SUBMITTED</MenuItem>
                <MenuItem value="APPROVED">APPROVED</MenuItem>
                <MenuItem value="PARTIALLY_DELIVERED">PARTIALLY DELIVERED</MenuItem>
                <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                <MenuItem value="REJECTED">REJECTED</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {isAdminOrMonitor && (
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select value={branchFilter} label="Branch" onChange={(e) => setBranchFilter(e.target.value)}>
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={2.25}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.25}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Data Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : filteredRequests.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No stationery orders match the selected report filter criteria.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Submission Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Items</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{req.requestNo}</TableCell>
                  <TableCell><Chip label={req.department || 'GENERAL'} size="small" color="primary" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell>{req.branch?.name}</TableCell>
                  <TableCell>{req.requester?.name}</TableCell>
                  <TableCell>{formatDate(req.submittedAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{req.items?.length || 0} line items</TableCell>
                  <TableCell><StatusChip status={req.status} /></TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetails(req.id)}
                    >
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Order Details Modal */}
      <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Order Audit Report: {selectedReq?.requestNo} ({selectedReq?.branch?.name})
          </Typography>
          {selectedReq?.deliveries?.some(d => d.billUrl) && (
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

              <Box sx={{ display: 'flex', gap: 4, my: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1"><strong>Branch:</strong> {selectedReq.branch?.name}</Typography>
                <Typography variant="body1"><strong>Requester:</strong> {selectedReq.requester?.name}</Typography>
                <Typography variant="body1"><strong>Status:</strong> <StatusChip status={selectedReq.status} /></Typography>
              </Box>

              <Divider />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>Product Financial & Requisition Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Unit Price (₹)</TableCell>
                    <TableCell>Requested Qty</TableCell>
                    <TableCell>Approved Qty</TableCell>
                    <TableCell>Delivered Qty</TableCell>
                    <TableCell sx={{ color: '#C53030' }}>Damaged Qty</TableCell>
                    <TableCell align="right">Approved Total (₹)</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedReq.items || []).map((item) => {
                    const approvedQty = item.approvalItem ? item.approvalItem.approvedQty : item.requestedQty;
                    const isRemoved = item.approvalItem ? item.approvalItem.remove : false;
                    const isRejected = isRemoved || (item.approvalItem && approvedQty === 0);
                    const unitPrice = getItemUnitPrice(item, selectedReq.deliveries);

                    let deliveredQty = 0;
                    let damagedQty = 0;
                    if (!isRejected && selectedReq.deliveries && selectedReq.deliveries.length > 0) {
                      selectedReq.deliveries.forEach((d) => {
                        (d.items || []).forEach((di) => {
                          if (Number(di.productId || di.product?.id) === Number(item.productId || item.product?.id)) {
                            deliveredQty += Number(di.deliveredQty || 0);
                            damagedQty += Number(di.verificationItem?.damagedQty || 0);
                          }
                        });
                      });
                    }

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
                        <TableCell sx={{ fontWeight: 600, color: damagedQty > 0 ? '#C53030' : 'text.secondary' }}>
                          {isRejected ? '-' : (damagedQty > 0 ? damagedQty : '-')}
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
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsModalOpen(false)} variant="contained" color="primary">Close Report</Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Bill / Slip Viewer */}
      <BillViewerModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        billUrl={selectedReq?.deliveries?.find(d => d.billUrl)?.billUrl}
        billNotes={selectedReq?.deliveries?.find(d => d.billUrl)?.billNotes}
        requestNo={selectedReq?.requestNo}
        deliveryDate={selectedReq?.deliveries?.find(d => d.billUrl)?.deliveredDate}
        agentName={selectedReq?.deliveries?.find(d => d.billUrl)?.deliveryAgent?.name}
      />
    </Box>
  );
};

export default Reports;
