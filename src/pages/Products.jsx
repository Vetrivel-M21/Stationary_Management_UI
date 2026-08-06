import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, TablePagination, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { productService } from '../services/productService';
import StatusChip from '../components/common/StatusChip';
import { useAuth } from '../contexts/AuthContext';

const categories = ['Writing Instruments', 'Paper Products', 'Desk Supplies', 'Filing & Storage', 'Electronics', 'General Office'];

const Products = () => {
  const { user } = useAuth();
  const role = typeof user?.role === 'object' ? user?.role?.name : (user?.role || '');
  const isAdmin = role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [form, setForm] = useState({ name: '', category: 'Writing Instruments', unit: 'Box', description: '', status: 'ACTIVE' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, search, selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(search, selectedCategory, page + 1, rowsPerPage);
      if (res.success) {
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prod = null) => {
    setError('');
    if (prod) {
      setEditProduct(prod);
      setForm({ name: prod.name, category: prod.category, unit: prod.unit, description: prod.description || '', status: prod.status });
    } else {
      setEditProduct(null);
      setForm({ name: '', category: 'Writing Instruments', unit: 'Box', description: '', status: 'ACTIVE' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editProduct) {
        await productService.updateProduct(editProduct.id, form);
        setSuccess('Product updated successfully');
      } else {
        await productService.createProduct(form);
        setSuccess('Product created successfully');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to disable/soft-delete this product?')) {
      try {
        await productService.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Product Catalog
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} sx={{ backgroundColor: '#2B6CB0' }}>
            Add New Product
          </Button>
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Search Products"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{ endAdornment: <SearchIcon color="action" /> }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category Filter</InputLabel>
          <Select value={selectedCategory} label="Category Filter" onChange={(e) => setSelectedCategory(e.target.value)}>
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.description || '-'}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
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

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1A202C', color: '#FFFFFF', fontWeight: 700 }}>
          {editProduct ? 'Edit Product' : 'Create New Product'}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Product Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Unit of Measure (e.g. Box, Ream, Piece)"
              required
              fullWidth
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {editProduct && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                  <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Save Product</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Products;
