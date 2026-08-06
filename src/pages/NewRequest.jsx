import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField, Table,
  TableHead, TableRow, TableCell, TableBody, IconButton, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { requestService } from '../services/requestService';
import { branchService } from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || user?.branch?.id || 1);

  // Applicant Details
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantMobile, setApplicantMobile] = useState(user?.mobile || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState('GOLD LOAN');
  const [location, setLocation] = useState('');

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const prodRes = await productService.getProducts('', '', 1, 100);
      if (prodRes.success) {
        setProducts(prodRes.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }

    try {
      const branchRes = await branchService.getBranches('', 1, 100);
      if (branchRes.success) {
        const bList = branchRes.data.branches || [];
        setBranches(bList);
        const userBranchId = user?.branchId || user?.branch?.id;
        if (userBranchId) {
          setSelectedBranchId(Number(userBranchId));
        } else if (bList.length > 0) {
          setSelectedBranchId(Number(bList[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].requestedQty += 1;
      setCart(updated);
    } else {
      setCart([...cart, { productId: product.id, name: product.name, unit: product.unit, category: product.category, requestedQty: 1 }]);
    }
  };

  const handleQtyChange = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;
    setCart(cart.map((item) => (item.productId === productId ? { ...item, requestedQty: qty } : item)));
  };

  const handleRemoveItem = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const handleSubmit = async () => {
    setError('');
    if (!applicantName.trim()) {
      setError('Please provide the Applicant Name.');
      return;
    }
    if (!applicantMobile.trim()) {
      setError('Please provide the Applicant Mobile Number.');
      return;
    }
    if (!applicantEmail.trim()) {
      setError('Please provide the Applicant Email Address.');
      return;
    }
    if (!department) {
      setError('Please select a Department.');
      return;
    }
    if (cart.length === 0) {
      setError('Please add at least one product to submit a request.');
      return;
    }
    if (!selectedBranchId) {
      setError('Please select a target branch for this request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branchId: Number(selectedBranchId),
        applicantName: applicantName.trim(),
        applicantMobile: applicantMobile.trim(),
        applicantEmail: applicantEmail.trim(),
        department,
        location: location.trim(),
        items: cart.map((i) => ({ productId: i.productId, requestedQty: i.requestedQty })),
      };

      const res = await requestService.createRequest(payload);
      if (res.success) {
        navigate('/requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Create Stationery Request
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Applicant Information Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A202C' }}>
          Applicant & Department Information
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Applicant Name"
              fullWidth
              required
              size="small"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Mobile Number"
              fullWidth
              required
              size="small"
              value={applicantMobile}
              onChange={(e) => setApplicantMobile(e.target.value)}
              placeholder="e.g. 09888888888"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              size="small"
              value={applicantEmail}
              onChange={(e) => setApplicantEmail(e.target.value)}
              placeholder="applicant@company.com"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                onChange={(e) => setDepartment(e.target.value)}
              >
                <MenuItem value="GOLD LOAN">GOLD LOAN</MenuItem>
                <MenuItem value="CHIT FUND">CHIT FUND</MenuItem>
                <MenuItem value="OTHERS">OTHERS</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Target Branch</InputLabel>
              <Select
                value={selectedBranchId ? Number(selectedBranchId) : ''}
                label="Target Branch"
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              >
                {branches.map((b) => (
                  <MenuItem key={b.id} value={Number(b.id)}>
                    {b.name} ({b.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Location / Office Detail"
              fullWidth
              size="small"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor, Gold Counter A"
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A202C' }}>
              Select Available Stationery Items
            </Typography>

            <Grid container spacing={2}>
              {products.map((prod) => (
                <Grid item xs={12} sm={6} key={prod.id}>
                  <Card sx={{ border: '1px solid #CBD5E0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2B6CB0' }}>
                        {prod.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Category: {prod.category} | Unit: {prod.unit}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: '#4A5568' }}>
                        {prod.description}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={() => handleAddToCart(prod)}
                        fullWidth
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, backgroundColor: '#FFFFFF', position: 'sticky', top: 90 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1A202C' }}>
              Requested Items Cart ({cart.length})
            </Typography>

            {cart.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Your request cart is empty. Click "Add to Cart" on any product.
              </Typography>
            ) : (
              <>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell width={90}>Qty</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.requestedQty}
                            onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                            inputProps={{ min: 1 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="error" size="small" onClick={() => handleRemoveItem(item.productId)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={submitting}
                  sx={{ backgroundColor: '#2B6CB0', py: 1.5 }}
                >
                  {submitting ? 'Submitting Request...' : 'Submit Request'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewRequest;
