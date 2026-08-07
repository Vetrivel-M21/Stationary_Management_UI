import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Grid, Chip, Divider, Tabs, Tab, Badge
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ChatIcon from '@mui/icons-material/Chat';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { requestService } from '../services/requestService';
import { slaService } from '../services/slaService';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import StatusChip from '../components/common/StatusChip';
import TimelineView from '../components/common/TimelineView';
import BillViewerModal from '../components/common/BillViewerModal';
import RequestChatModal from '../components/common/RequestChatModal';
import { formatDate, formatLocationDisplay } from '../utils/formatters';

// Helper: get first approver name from request items
const getApproverName = (req) => {
  if (!req?.items) return null;
  for (const item of req.items) {
    if (item.approvalItem?.approver?.name) return item.approvalItem.approver.name;
  }
  return null;
};

// Helper: get all unique delivery agent names
const getDeliveredByNames = (req) => {
  if (!req?.deliveries || req.deliveries.length === 0) return null;
  const names = [...new Set(req.deliveries.map(d => d.deliveryAgent?.name).filter(Boolean))];
  return names.length > 0 ? names.join(', ') : null;
};

const Monitor = () => {
  const { user } = useAuth();
  const monitorDept = user?.department || '';

  const [tabIndex, setTabIndex] = useState(0); // 0: All Department Requests, 1: Delayed Orders
  const [requests, setRequests] = useState([]);
  const [delayedOrders, setDelayedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);

  useEffect(() => {
    if (tabIndex === 0) {
      fetchRequests();
    } else {
      fetchDelayedOrders();
    }
  }, [tabIndex, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getRequests(statusFilter, 1, 100);
      if (res.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDelayedOrders = async () => {
    setLoading(true);
    try {
      const res = await slaService.getDelayedOrders(monitorDept);
      if (res.success) {
        setDelayedOrders(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load delayed orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTimeline = async (id) => {
    try {
      const res = await requestService.getRequestById(id);
      if (res.success) {
        setSelectedReq(res.data);
        setTimelineModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load request timeline:', err);
    }
  };

  const handleOpenChat = (req) => {
    setSelectedReq(req);
    setChatModalOpen(true);
  };

  const handleChatRead = (requestId, readCount) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, chatCount: readCount } : r))
    );
    setDelayedOrders((prev) =>
      prev.map((d) =>
        d.request?.id === requestId
          ? { ...d, request: { ...d.request, chatCount: readCount } }
          : d
      )
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Workflow Monitoring & Audit
        </Typography>
        {monitorDept && (
          <Chip
            label={`Monitoring Department: ${monitorDept}`}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.9rem', py: 2 }}
          />
        )}
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ListAltIcon />} label={`All ${monitorDept ? monitorDept + ' ' : ''}Orders`} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab
            icon={<WarningAmberIcon sx={{ color: '#E53E3E' }} />}
            label={`Delayed Orders (${delayedOrders.length})`}
            iconPosition="start"
            sx={{ fontWeight: 700, color: tabIndex === 1 ? '#E53E3E' : 'inherit' }}
          />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>Filter Status</InputLabel>
                <Select value={statusFilter} label="Filter Status" onChange={(e) => setStatusFilter(e.target.value)}>
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
          </Grid>
        </Paper>
      )}

      {/* Tab Content 0: All Orders */}
      {tabIndex === 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#EBF8FF' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applicant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submission Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#A0AEC0' }}>
                      No requests found for this department.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((row) => {
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.branch?.name || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.applicantName || row.requester?.name || '-'}</TableCell>
                        <TableCell>{formatDate(row.submittedAt)}</TableCell>
                        <TableCell><StatusChip status={row.status} /></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleOpenTimeline(row.id)}
                            >
                              Timeline
                            </Button>
                            {(() => {
                              const unreadCount = chatService.getUnreadCount(user?.id, row.id, row.chatCount);
                              return unreadCount > 0 ? (
                                <Badge badgeContent={unreadCount} color="error" max={99}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ChatIcon />}
                                    onClick={() => handleOpenChat(row)}
                                  >
                                    Chat ({unreadCount})
                                  </Button>
                                </Badge>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Tab Content 1: Delayed Orders */}
      {tabIndex === 1 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#FFF5F5' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Department & Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Applicant Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Delayed Stage</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>SLA Max Days</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Overdue Days</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#C53030' }}>Target Owner</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#C53030' }}>Verify & Chat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {delayedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#2F855A' }}>
                      🎉 Great! No delayed orders in {monitorDept || 'system'} currently.
                    </TableCell>
                  </TableRow>
                ) : (
                  delayedOrders.map((d) => {
                    const row = d.request;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.requestNo}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.department || 'GENERAL'}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.branch?.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.applicantName || row.requester?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.applicantMobile || row.requester?.mobile}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={d.delayedStage} color="warning" size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>{d.maxAllowedDays} days</TableCell>
                        <TableCell>
                          <Chip
                            label={`+${d.delayDays} Days Overdue`}
                            sx={{ backgroundColor: '#FED7D7', color: '#9B2C2C', fontWeight: 800 }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={d.targetRole} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleOpenTimeline(row.id)}
                            >
                              Timeline
                            </Button>
                            {(() => {
                              const unreadCount = chatService.getUnreadCount(user?.id, row.id, row.chatCount);
                              return unreadCount > 0 ? (
                                <Badge badgeContent={unreadCount} color="error" max={99}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    startIcon={<ChatIcon />}
                                    onClick={() => handleOpenChat(row)}
                                  >
                                    Verify & Chat ({unreadCount})
                                  </Button>
                                </Badge>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="inherit"
                                  startIcon={<ChatIcon />}
                                  onClick={() => handleOpenChat(row)}
                                >
                                  Verify & Chat
                                </Button>
                              );
                            })()}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Timeline Dialog */}
      <Dialog open={timelineModalOpen} onClose={() => setTimelineModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Workflow Timeline & Audit: {selectedReq?.requestNo}
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

              {/* Key Actors Summary Card */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: '#F7FAFC' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#2D3748' }}>Request Actors & Applicant</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PersonIcon sx={{ color: '#4A5568', mt: 0.3, fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applicant Details</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>{selectedReq.applicantName || selectedReq.requester?.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>{selectedReq.applicantMobile || selectedReq.requester?.mobile}</Typography>
                        <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>{selectedReq.applicantEmail || selectedReq.requester?.email}</Typography>
                        <Typography variant="caption" sx={{ color: '#A0AEC0' }}>Dept: {selectedReq.department} | Loc: {formatLocationDisplay(selectedReq.branch?.name, selectedReq.location)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <VerifiedUserIcon sx={{ color: '#2F855A', mt: 0.3, fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved By</Typography>
                        {(() => {
                          const approverName = getApproverName(selectedReq);
                          return approverName ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2F855A' }}>{approverName}</Typography>
                              {selectedReq.approvedAt && (
                                <Typography variant="caption" sx={{ color: '#718096' }}>On: {formatDate(selectedReq.approvedAt)}</Typography>
                              )}
                            </>
                          ) : (
                            <Chip label="Pending Approval" size="small" sx={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.7rem' }} />
                          );
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocalShippingIcon sx={{ color: '#744210', mt: 0.3, fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivered By</Typography>
                        {(() => {
                          const deliveredBy = getDeliveredByNames(selectedReq);
                          const lastDelivery = selectedReq.deliveries?.[selectedReq.deliveries.length - 1];
                          return deliveredBy ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#744210' }}>{deliveredBy}</Typography>
                              {lastDelivery?.deliveredDate && (
                                <Typography variant="caption" sx={{ color: '#718096' }}>On: {formatDate(lastDelivery.deliveredDate)}</Typography>
                              )}
                            </>
                          ) : (
                            <Chip label="Not Yet Delivered" size="small" sx={{ backgroundColor: '#EBF8FF', color: '#2B6CB0', fontWeight: 600, fontSize: '0.7rem' }} />
                          );
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2"><strong>Branch:</strong> {selectedReq.branch?.name}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> <StatusChip status={selectedReq.status} /></Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTimelineModalOpen(false)} variant="contained" color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      <BillViewerModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        billUrl={selectedReq?.deliveries?.find(d => d.billUrl)?.billUrl}
        billNotes={selectedReq?.deliveries?.find(d => d.billUrl)?.billNotes}
        requestNo={selectedReq?.requestNo}
        deliveryDate={selectedReq?.deliveries?.find(d => d.billUrl)?.deliveredDate}
        agentName={selectedReq?.deliveries?.find(d => d.billUrl)?.deliveryAgent?.name}
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

export default Monitor;
