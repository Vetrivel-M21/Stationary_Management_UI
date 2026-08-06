import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, TablePagination, CircularProgress, Alert, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import SearchIcon from '@mui/icons-material/Search';
import { userService } from '../services/userService';
import { branchService } from '../services/branchService';
import StatusChip from '../components/common/StatusChip';

const roles = [
  { id: 1, name: 'ADMIN' },
  { id: 2, name: 'BRANCH_REQUESTER' },
  { id: 3, name: 'APPROVER' },
  { id: 4, name: 'AGENCY' },
  { id: 5, name: 'MONITOR' },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    name: '', email: '', mobile: '', defaultPassword: 'User@123', roleId: 2, branchId: '', approverAccessType: 'ALL_BRANCHES', status: 'ACTIVE'
  });
  const [resetPasswordVal, setResetPasswordVal] = useState('Admin@123');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [page, rowsPerPage, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers(search, page + 1, rowsPerPage);
      if (res.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await branchService.getBranches('', 1, 100);
      if (res.success) {
        setBranches(res.data.branches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (u = null) => {
    setError('');
    if (u) {
      setSelectedUser(u);
      setForm({
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        defaultPassword: '',
        roleId: u.roleId || u.role?.id || 2,
        branchId: u.branchId || u.branch?.id || '',
        approverAccessType: u.approverAccessType || 'ALL_BRANCHES',
        status: u.status,
      });
    } else {
      setSelectedUser(null);
      const defaultBranchId = branches.length > 0 ? branches[0].id : '';
      setForm({
        name: '', email: '', mobile: '', defaultPassword: 'User@123', roleId: 2, branchId: defaultBranchId, approverAccessType: 'ALL_BRANCHES', status: 'ACTIVE'
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      roleId: Number(form.roleId),
      branchId: form.branchId ? Number(form.branchId) : null,
    };

    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, payload);
        setSuccess('User updated successfully');
      } else {
        await userService.createUser(payload);
        setSuccess('User created successfully');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await userService.resetPassword(selectedUser.id, resetPasswordVal);
      setSuccess(`Password for ${selectedUser.name} reset successfully`);
      setResetModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          User & RBAC Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ backgroundColor: '#2B6CB0' }}>
          Create New User
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="Search Users (Name, Email, Mobile)"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 350 }}
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
                <TableCell>Name</TableCell>
                <TableCell>Contact Details</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Approver Scope</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.mobile}</Typography>
                  </TableCell>
                  <TableCell><Chip label={row.role?.name} color="primary" variant="outlined" size="small" /></TableCell>
                  <TableCell>{row.branch ? row.branch.name : 'Global / All'}</TableCell>
                  <TableCell>{row.role?.name === 'APPROVER' ? row.approverAccessType : 'N/A'}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="warning" onClick={() => { setSelectedUser(row); setResetModalOpen(true); }}>
                      <LockResetIcon />
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

      {/* User Form Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          {selectedUser ? 'Edit User Profile' : 'Create New User'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Full Name" required fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email Address" type="email" required fullWidth value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Mobile Number" required fullWidth value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            
            {!selectedUser && (
              <TextField label="Default Password" required fullWidth value={form.defaultPassword} onChange={(e) => setForm({ ...form, defaultPassword: e.target.value })} />
            )}

            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select value={form.roleId} label="Role" onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Approver Access Type Selection */}
            {Number(form.roleId) === 3 && (
              <FormControl fullWidth required>
                <InputLabel>Approver Access Scope</InputLabel>
                <Select value={form.approverAccessType} label="Approver Access Scope" onChange={(e) => setForm({ ...form, approverAccessType: e.target.value })}>
                  <MenuItem value="ALL_BRANCHES">All Branches (Global Approver)</MenuItem>
                  <MenuItem value="SINGLE_BRANCH">Single Branch Only</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Branch Dropdown */}
            <FormControl fullWidth required={Number(form.roleId) === 2 || (Number(form.roleId) === 3 && form.approverAccessType === 'SINGLE_BRANCH')}>
              <InputLabel>Assigned Branch</InputLabel>
              <Select
                value={form.branchId}
                label="Assigned Branch"
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                <MenuItem value="">-- None / Global Access (All Branches) --</MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save User</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          Reset Password for {selectedUser?.name}
        </DialogTitle>
        <form onSubmit={handleResetPassword}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              label="New Temporary Password"
              required
              fullWidth
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="warning">Reset Password</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users;
