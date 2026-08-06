import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { branchService } from '../services/branchService';
import StatusChip from '../components/common/StatusChip';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', status: 'ACTIVE' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranches();
  }, [page, rowsPerPage, search]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await branchService.getBranches(search, page + 1, rowsPerPage);
      if (res.success) {
        setBranches(res.data.branches || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (b = null) => {
    setError('');
    if (b) {
      setEditBranch(b);
      setForm({ name: b.name, code: b.code, address: b.address || '', status: b.status });
    } else {
      setEditBranch(null);
      setForm({ name: '', code: '', address: '', status: 'ACTIVE' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editBranch) {
        await branchService.updateBranch(editBranch.id, form);
      } else {
        await branchService.createBranch(form);
      }
      setModalOpen(false);
      fetchBranches();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Branch Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ backgroundColor: '#2B6CB0' }}>
          Create Branch
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search Branches"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{ endAdornment: <SearchIcon color="action" /> }}
        />
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Branch Code</TableCell>
                <TableCell>Branch Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#2B6CB0' }}>{row.code}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.address || '-'}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                      <EditIcon />
                    </IconButton>
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

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          {editBranch ? 'Edit Branch' : 'Create Branch'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Branch Code"
              required
              fullWidth
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. BR-104"
            />
            <TextField
              label="Branch Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. West Coast Branch"
            />
            <TextField
              label="Address"
              multiline
              rows={3}
              fullWidth
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Branch</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Branches;
