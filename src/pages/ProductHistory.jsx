import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, CircularProgress, Tabs, Tab, TextField, Button
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { requestService } from '../services/requestService';
import { formatDateTime } from '../utils/formatters';

const TABS = [
  { label: 'Edit History', action: 'UPDATE_PRODUCT' },
  { label: 'Delete History', action: 'SOFT_DELETE_PRODUCT' },
];

const stripQuotes = (v) => (v || '').trim().replace(/^"|"$/g, '');

// "Name: "old" -> "new"; UnitPrice: 200.00 -> 1000.00" -> [{ field, oldVal, newVal }]
const parseEditDetails = (details) => {
  if (!details) return [];
  return details.split('; ').map((part) => {
    const sepIndex = part.indexOf(': ');
    if (sepIndex === -1) return { field: part, oldVal: '', newVal: '' };
    const field = part.slice(0, sepIndex);
    const [oldVal, newVal] = part.slice(sepIndex + 2).split(' -> ');
    return { field, oldVal: stripQuotes(oldVal), newVal: stripQuotes(newVal) };
  });
};

// "Category: X, Unit: Y, UnitPrice: Z, Status: W" -> [{ field, value }]
const parseSnapshotDetails = (details) => {
  if (!details) return [];
  return details.split(', ').map((part) => {
    const sepIndex = part.indexOf(': ');
    if (sepIndex === -1) return { field: part, value: '' };
    return { field: part.slice(0, sepIndex), value: part.slice(sepIndex + 2) };
  });
};

const chipSx = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 0.75,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  px: 1.2,
  py: 0.6,
  mr: 0.75,
  mb: 0.75,
  fontSize: '0.85rem',
  lineHeight: 1.4,
};

const ChangeChip = ({ field, oldVal, newVal }) => (
  <Box sx={chipSx}>
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: 'text.primary' }}>{field}:</Typography>
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'error.main' }}>{oldVal}</Typography>
    <Typography component="span" sx={{ fontSize: 'inherit', color: 'text.secondary', fontWeight: 700 }}>&rarr;</Typography>
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: 'success.main' }}>{newVal}</Typography>
  </Box>
);

const SnapshotChip = ({ field, value }) => (
  <Box sx={chipSx}>
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: 'text.primary' }}>{field}:</Typography>
    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'text.secondary' }}>{value}</Typography>
  </Box>
);

const ProductHistory = () => {
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [tab, page, rowsPerPage, startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const filters = { entityType: 'PRODUCT', action: TABS[tab].action };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      const res = await requestService.getAuditLogs(page + 1, rowsPerPage, filters);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (e, newTab) => {
    setTab(newTab);
    setPage(0);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setPage(0);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setPage(0);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <HistoryIcon sx={{ fontSize: 36, color: '#2B6CB0' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Product History
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          {TABS.map((t) => (
            <Tab key={t.action} label={t.label} />
          ))}
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, flexWrap: 'wrap' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
          />
          {(startDate || endDate) && (
            <Button size="small" onClick={handleClearDates}>Clear</Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actor User</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.userName || 'System'}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2B6CB0' }}>{row.entityId || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 420 }}>
                    {!row.details ? (
                      '-'
                    ) : tab === 0 ? (
                      parseEditDetails(row.details).map((c, i) => <ChangeChip key={i} {...c} />)
                    ) : (
                      parseSnapshotDetails(row.details).map((c, i) => <SnapshotChip key={i} {...c} />)
                    )}
                  </TableCell>
                  <TableCell>{row.ipAddress || '-'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No {TABS[tab].label.toLowerCase()} found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
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
    </Box>
  );
};

export default ProductHistory;
