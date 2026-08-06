import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, CircularProgress, Chip
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { requestService } from '../services/requestService';
import { formatDateTime } from '../utils/formatters';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, [page, rowsPerPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await requestService.getAuditLogs(page + 1, rowsPerPage);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 36, color: '#2B6CB0' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          System Security & Audit Trail
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actor User</TableCell>
                <TableCell>Action Executed</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.userName || 'System'}</TableCell>
                  <TableCell>
                    <Chip label={row.action} color="primary" variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>{row.entityType || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#2B6CB0' }}>{row.entityId || '-'}</TableCell>
                  <TableCell>{row.ipAddress || '-'}</TableCell>
                </TableRow>
              ))}
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

export default AuditLogs;
