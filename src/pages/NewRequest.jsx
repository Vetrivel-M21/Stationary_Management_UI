import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField, Table,
  TableHead, TableRow, TableCell, TableBody, IconButton, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, FormHelperText, Chip, Autocomplete
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { requestService } from '../services/requestService';
import { branchService } from '../services/branchService';
import { useAuth } from '../contexts/AuthContext';
import { DEPARTMENTS } from '../constants/departments';

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = role === 'ADMIN';
  const isRequester = role === 'BRANCH_REQUESTER';

  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Applicant Details - Start EMPTY by default per user request
  const [applicantName, setApplicantName] = useState('');
  const [applicantMobile, setApplicantMobile] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [cart, setCart] = useState([]);
  const [shopItemName, setShopItemName] = useState('');
  const [shopItemQty, setShopItemQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isRequester && user?.department) {
      setDepartment(user.department);
    }
  }, [isRequester, user]);

  useEffect(() => {
    setSelectedBranch(null);
    if (!department) {
      setBranches([]);
      return;
    }
    branchService.getBranches('', 1, 100, department)
      .then((res) => {
        if (res.success) setBranches(res.data.branches || []);
      })
      .catch((err) => console.error('Failed to load branches for department:', err));
  }, [department]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const prodRes = await productService.getProducts('', '', 1, 100);
      if (prodRes.success) {
        setProducts(prodRes.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value, setter) => {
    let sanitizedValue = value;
    if (field === 'applicantMobile') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setter(sanitizedValue);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddToCart = (product) => {
    const key = `cat-${product.id}`;
    const existingIndex = cart.findIndex((item) => item.key === key);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].requestedQty += 1;
      setCart(updated);
    } else {
      setCart([...cart, { key, kind: 'CATALOG', productId: product.id, name: product.name, unit: product.unit, category: product.category, requestedQty: 1 }]);
    }
  };

  const handleAddShopItem = () => {
    const name = shopItemName.trim();
    const qty = parseInt(shopItemQty, 10);
    if (!name) {
      setError('Enter a name for the shop item before adding it.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Enter a valid quantity for the shop item.');
      return;
    }
    setError('');
    setCart([...cart, { key: `shop-${Date.now()}`, kind: 'SHOP', itemName: name, requestedQty: qty }]);
    setShopItemName('');
    setShopItemQty(1);
  };

  const handleQtyChange = (key, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) return;
    setCart(cart.map((item) => (item.key === key ? { ...item, requestedQty: qty } : item)));
  };

  const handleRemoveItem = (key) => {
    setCart(cart.filter((item) => item.key !== key));
  };

  const handleSubmit = async () => {
    setError('');
    const newErrors = {};

    if (!applicantName.trim()) {
      newErrors.applicantName = 'Applicant Name is required';
    }

    const cleanMobile = applicantMobile.trim().replace(/[\s-]/g, '');
    if (!cleanMobile) {
      newErrors.applicantMobile = 'Mobile Number is required';
    } else if (!/^\d{10}$/.test(cleanMobile)) {
      newErrors.applicantMobile = 'Enter a valid 10-digit mobile number';
    }

    if (!applicantEmail.trim()) {
      newErrors.applicantEmail = 'Email Address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(applicantEmail.trim())) {
        newErrors.applicantEmail = 'Enter a valid email address (e.g. name@company.com)';
      }
    }

    if (!department) {
      newErrors.department = 'Department selection is required';
    }

    if (!selectedBranch) {
      newErrors.branchInput = 'Please select a target branch from the list';
    }

    if (!location.trim()) {
      newErrors.location = 'Location / Office Detail is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Please fill in all required applicant details marked in red.');
      return;
    }

    if (cart.length === 0) {
      setError('Please add at least one catalog product or shop item to submit a request.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branchId: Number(selectedBranch.id),
        branchName: selectedBranch.name,
        applicantName: applicantName.trim(),
        applicantMobile: cleanMobile,
        applicantEmail: applicantEmail.trim(),
        department,
        location: location.trim(),
        items: cart.filter((i) => i.kind === 'CATALOG').map((i) => ({ productId: i.productId, requestedQty: i.requestedQty })),
        shopItems: cart.filter((i) => i.kind === 'SHOP').map((i) => ({ itemName: i.itemName, requestedQty: i.requestedQty })),
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
    <Box sx={{ pb: 5 }}>
      {/* Header Banner */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentIcon sx={{ color: '#2563EB', fontSize: 36 }} />
          Create Stationery Request
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
          Fill in applicant details and select stationery items to submit a request for approval and delivery.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Applicant Information Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #2563EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonOutlineIcon sx={{ color: '#2563EB', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Applicant & Department Information
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Applicant Name"
              fullWidth
              required
              size="small"
              value={applicantName}
              onChange={(e) => handleFieldChange('applicantName', e.target.value, setApplicantName)}
              placeholder="e.g. John Doe"
              error={Boolean(fieldErrors.applicantName)}
              helperText={fieldErrors.applicantName}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Mobile Number"
              fullWidth
              required
              size="small"
              value={applicantMobile}
              onChange={(e) => handleFieldChange('applicantMobile', e.target.value, setApplicantMobile)}
              placeholder="e.g. 9888888888"
              error={Boolean(fieldErrors.applicantMobile)}
              helperText={fieldErrors.applicantMobile}
              inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
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
              onChange={(e) => handleFieldChange('applicantEmail', e.target.value, setApplicantEmail)}
              placeholder="applicant@company.com"
              error={Boolean(fieldErrors.applicantEmail)}
              helperText={fieldErrors.applicantEmail}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" required error={Boolean(fieldErrors.department)}>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                disabled={isRequester}
                onChange={(e) => handleFieldChange('department', e.target.value, setDepartment)}
              >
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
              {fieldErrors.department ? (
                <FormHelperText>{fieldErrors.department}</FormHelperText>
              ) : isRequester ? (
                <FormHelperText>Locked to your assigned department</FormHelperText>
              ) : null}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={branches}
              getOptionLabel={(b) => b.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={selectedBranch}
              onChange={(e, newValue) => {
                setSelectedBranch(newValue);
                if (fieldErrors.branchInput) {
                  setFieldErrors((prev) => ({ ...prev, branchInput: '' }));
                }
              }}
              disabled={!department}
              noOptionsText={department ? 'No branches assigned to this department yet. Contact an admin.' : 'Select a department first'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Target Branch"
                  required
                  size="small"
                  placeholder="Search and select a branch"
                  error={Boolean(fieldErrors.branchInput)}
                  helperText={fieldErrors.branchInput || (department && branches.length === 0 ? 'No branches assigned to this department yet' : '')}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Location / Office Detail"
              required
              fullWidth
              multiline
              rows={3}
              value={location}
              onChange={(e) => handleFieldChange('location', e.target.value, setLocation)}
              placeholder="e.g. 2nd Floor, Gold Counter A, Main Office Building, City Center"
              error={Boolean(fieldErrors.location)}
              helperText={fieldErrors.location || 'Provide exact location, floor, and counter details'}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Shop Item (Non-Catalog) Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #D97706' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StorefrontIcon sx={{ color: '#D97706', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Add a Shop Item (Not in Catalog)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              For items bought from a nearby shop instead of the agency. These go only to the Approver and are settled by you with a bill and payment proof after approval.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={7}>
            <TextField
              label="Item Name"
              fullWidth
              size="small"
              value={shopItemName}
              onChange={(e) => setShopItemName(e.target.value)}
              placeholder="e.g. Custom Rubber Stamp"
            />
          </Grid>
          <Grid item xs={7} sm={3}>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              size="small"
              value={shopItemQty}
              onChange={(e) => setShopItemQty(e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={5} sm={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleAddShopItem}
              sx={{ backgroundColor: '#D97706', fontWeight: 700, textTransform: 'none', borderRadius: 2, '&:hover': { backgroundColor: '#B45309' } }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Grid: Products vs Cart */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #0EA5E9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InventoryIcon sx={{ color: '#0284C7', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Select Available Stationery Items
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {products.map((prod) => (
                <Grid item xs={12} sm={6} key={prod.id}>
                  <Card
                    sx={{
                      borderRadius: 2.5,
                      border: '1px solid #E2E8F0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      transition: 'all 0.25s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(37,99,235,0.12)',
                        borderColor: '#3B82F6',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E3A8A', lineHeight: 1.3 }}>
                          {prod.name}
                        </Typography>
                        <Chip label={prod.category} size="small" sx={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.7rem' }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 1 }}>
                        Unit: {prod.unit} {prod.unitPrice > 0 && `| ₹${prod.unitPrice}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                        {prod.description}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={() => handleAddToCart(prod)}
                        fullWidth
                        sx={{
                          backgroundColor: '#2563EB',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#1D4ED8' },
                        }}
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
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #10B981', position: 'sticky', top: 90 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCartIcon sx={{ color: '#059669', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Requested Items Cart
                </Typography>
              </Box>
              <Chip label={`${cart.length} Items`} color="success" size="small" sx={{ fontWeight: 700 }} />
            </Box>

            {cart.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                <ShoppingCartIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Your request cart is currently empty.
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Click "Add to Cart" on any stationery product.
                </Typography>
              </Box>
            ) : (
              <>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Item</TableCell>
                      <TableCell width={90} sx={{ fontWeight: 700, color: '#475569' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.key} hover>
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>
                          {item.kind === 'SHOP' ? item.itemName : item.name}
                          {item.kind === 'SHOP' && (
                            <Chip label="Shop Item" size="small" sx={{ ml: 1, backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 700, fontSize: '0.65rem' }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.requestedQty}
                            onChange={(e) => handleQtyChange(item.key, e.target.value)}
                            inputProps={{ min: 1, style: { padding: '4px 8px', fontWeight: 700 } }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="error" size="small" onClick={() => handleRemoveItem(item.key)} title="Remove Item">
                            <DeleteIcon fontSize="small" />
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
                  sx={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2.5,
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                    },
                  }}
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
