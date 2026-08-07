import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, TablePagination, CircularProgress, Alert, Chip, FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
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

const departmentsList = ['GOLD LOAN', 'CHIT FUND', 'OTHERS'];

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('User@123');

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    defaultPassword: 'User@123',
    roleId: 2,
    branchId: '',
    department: 'GOLD LOAN',
    approverAccessType: 'ALL_BRANCHES',
    status: 'ACTIVE'
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchBranches();
  }, []);

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
      console.error('Failed to load branches for dropdown:', err);
    }
  };

  const handleOpenModal = (u = null) => {
    setError('');
    setFieldErrors({});
    if (u) {
      setSelectedUser(u);
      setForm({
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        defaultPassword: '',
        roleId: u.roleId || u.role?.id || 2,
        branchId: u.branchId || u.branch?.id || '',
        department: u.department || 'GOLD LOAN',
        approverAccessType: u.approverAccessType || 'ALL_BRANCHES',
        status: u.status,
      });
    } else {
      setSelectedUser(null);
      setForm({
        name: '', email: '', mobile: '', defaultPassword: 'User@123', roleId: 2, branchId: '', department: 'GOLD LOAN', approverAccessType: 'ALL_BRANCHES', status: 'ACTIVE'
      });
    }
    setModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    let sanitizedValue = value;
    if (field === 'mobile') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setForm((prev) => ({ ...prev, [field]: sanitizedValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const newErrors = {};

    if (!form.name || !form.name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !form.email.trim()) {
      newErrors.email = 'Email Address / User ID is required';
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = 'Enter a valid Email Address (e.g. user@company.com)';
    }

    const cleanMobile = (form.mobile || '').trim().replace(/[\s-]/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(cleanMobile)) {
      newErrors.mobile = 'Enter a valid 10-digit Mobile Number (e.g. 9876543210)';
    }

    if (!selectedUser && (!form.defaultPassword || !form.defaultPassword.trim())) {
      newErrors.defaultPassword = 'Default Password is required';
    }

    const roleIdNum = Number(form.roleId);
    if (roleIdNum === 3 && form.approverAccessType === 'SINGLE_BRANCH' && !form.branchId) {
      newErrors.branchId = 'Assigned Branch selection is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Please fix all field errors marked in red.');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      mobile: cleanMobile,
      roleId: roleIdNum,
      branchId: (roleIdNum === 3 && form.approverAccessType === 'SINGLE_BRANCH' && form.branchId) ? Number(form.branchId) : null,
      department: (roleIdNum === 3 || roleIdNum === 5) ? form.department : 'ALL',
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

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setError('');
    try {
      await userService.deleteUser(userToDelete.id);
      setSuccess(`User "${userToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const existingRequester = users.find(u => (u.role?.name === 'BRANCH_REQUESTER' || u.roleId === 2) && u.id !== selectedUser?.id);
  const existingAgency = users.find(u => (u.role?.name === 'AGENCY' || u.roleId === 4) && u.id !== selectedUser?.id);
  const existingApproverForDept = users.find(u => (u.role?.name === 'APPROVER' || u.roleId === 3) && u.department === form.department && u.id !== selectedUser?.id);
  const existingMonitorForDept = users.find(u => (u.role?.name === 'MONITOR' || u.roleId === 5) && u.department === form.department && u.id !== selectedUser?.id);

  const selectedRoleId = Number(form.roleId);
  const isRequesterBlocked = selectedRoleId === 2 && Boolean(existingRequester);
  const isAgencyBlocked = selectedRoleId === 4 && Boolean(existingAgency);
  const isApproverBlocked = selectedRoleId === 3 && Boolean(existingApproverForDept);
  const isMonitorBlocked = selectedRoleId === 5 && Boolean(existingMonitorForDept);

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
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={{ minWidth: 130 }}>Actions</TableCell>
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
                  <TableCell>
                    {row.department ? (
                      <Chip label={row.department} size="small" sx={{ fontWeight: 600, backgroundColor: '#EBF8FF', color: '#2B6CB0' }} />
                    ) : (
                      'Global / All'
                    )}
                  </TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenModal(row)} title="Edit Profile">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="warning" onClick={() => { setSelectedUser(row); setResetModalOpen(true); }} title="Reset Password">
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={row.role?.name === 'ADMIN'}
                        onClick={() => { setUserToDelete(row); setDeleteModalOpen(true); }}
                        title={row.role?.name === 'ADMIN' ? 'Admin user cannot be deleted' : 'Delete User'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
            
            {selectedRoleId === 2 && (
              <Alert severity={isRequesterBlocked ? "warning" : "info"}>
                {isRequesterBlocked 
                  ? "⚠️ A shared Requester account already exists. Only 1 shared Requester account is allowed."
                  : "ℹ️ Shared Requester Account: 1 single shared account in the system for all requesters."}
              </Alert>
            )}

            {selectedRoleId === 4 && (
              <Alert severity={isAgencyBlocked ? "warning" : "info"}>
                {isAgencyBlocked 
                  ? "⚠️ An Agency account already exists. Only 1 global Agency account is allowed."
                  : "ℹ️ Delivery Agency Account: 1 single global agency account in the system."}
              </Alert>
            )}

            {selectedRoleId === 3 && (
              <Alert severity={isApproverBlocked ? "warning" : "info"}>
                {isApproverBlocked 
                  ? `⚠️ An Approver account already exists for the "${form.department}" department. Only 1 Approver per department is allowed.`
                  : `ℹ️ Department Approver: 1 Approver allowed per department (${departmentsList.join(', ')}).`}
              </Alert>
            )}

            {selectedRoleId === 5 && (
              <Alert severity={isMonitorBlocked ? "warning" : "info"}>
                {isMonitorBlocked 
                  ? `⚠️ A Monitor account already exists for the "${form.department}" department. Only 1 Monitor per department is allowed.`
                  : `ℹ️ Department Monitor: 1 Monitor allowed per department (${departmentsList.join(', ')}).`}
              </Alert>
            )}

            <TextField
              label="Full Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
            />
            <TextField
              label="Email Address / User ID"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
            />
            <TextField
              label="Mobile Number"
              required
              fullWidth
              value={form.mobile}
              onChange={(e) => handleInputChange('mobile', e.target.value)}
              error={Boolean(fieldErrors.mobile)}
              helperText={fieldErrors.mobile}
              placeholder="e.g. 9876543210"
              inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
            />
            
            {!selectedUser && (
              <TextField
                label="Default Password"
                required
                fullWidth
                value={form.defaultPassword}
                onChange={(e) => handleInputChange('defaultPassword', e.target.value)}
                error={Boolean(fieldErrors.defaultPassword)}
                helperText={fieldErrors.defaultPassword}
              />
            )}

            <FormControl fullWidth required>
              <InputLabel>Role / Position</InputLabel>
              <Select value={form.roleId} label="Role / Position" onChange={(e) => handleInputChange('roleId', e.target.value)}>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {(selectedRoleId === 3 || selectedRoleId === 5) && (
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={form.department}
                  label="Department"
                  onChange={(e) => handleInputChange('department', e.target.value)}
                >
                  {departmentsList.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isRequesterBlocked || isAgencyBlocked || isApproverBlocked || isMonitorBlocked}
            >
              Save User
            </Button>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#9B2C2C', color: '#FFFFFF', fontWeight: 700 }}>
          Confirm User Deletion
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">
            Are you sure you want to delete user <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            This action will permanently delete this user account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
