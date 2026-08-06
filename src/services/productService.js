import api from './api';

export const productService = {
  getProducts: async (search = '', category = '', page = 1, limit = 50) => {
    return await api.get(`/products?search=${search}&category=${category}&page=${page}&limit=${limit}`);
  },
  createProduct: async (productData) => {
    return await api.post('/products', productData);
  },
  updateProduct: async (id, productData) => {
    return await api.put(`/products/${id}`, productData);
  },
  deleteProduct: async (id) => {
    return await api.delete(`/products/${id}`);
  },
};
