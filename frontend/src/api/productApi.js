import axiosClient from './axiosClient';

const productApi = {
<<<<<<< HEAD
  // Tìm kiếm phụ tùng
=======
  // Tìm kiếm phụ tùng (nâng cao)
>>>>>>> 9026a3f249b50e1b7f82b17f5da0d47cfd69ec9f
  search: (params) => axiosClient.get('/parts/search', { params }),
  
  // Chi tiết phụ tùng
  getById: (id) => axiosClient.get(`/parts/${id}`),
  
<<<<<<< HEAD
=======
  // Gợi ý tìm kiếm realtime
  getSuggestions: (q) => axiosClient.get('/parts/suggestions', { params: { q } }),
  
>>>>>>> 9026a3f249b50e1b7f82b17f5da0d47cfd69ec9f
  // Danh sách hãng xe
  getBrands: () => axiosClient.get('/brands'),
  
  // Danh sách dòng xe theo hãng
  getModels: (brandId) => axiosClient.get(`/brands/${brandId}/models`),
  
  // Danh sách năm theo dòng xe
  getYears: (modelId) => axiosClient.get(`/models/${modelId}/years`),
  
  // Phụ tùng tương thích với năm xe
  getCompatibleParts: (yearId) => axiosClient.get(`/years/${yearId}/compatibility`),
  
  // Danh sách danh mục
  getCategories: () => axiosClient.get('/categories'),
<<<<<<< HEAD
=======

  // ==================== VIN ====================
  // Giải mã VIN
  decodeVin: (vin) => axiosClient.get(`/vin/decode/${vin}`),
  
  // Tìm phụ tùng theo VIN
  searchByVin: (vin, params = {}) => axiosClient.get(`/vin/search/${vin}`, { params }),

  // ==================== Image Search ====================
  // Tìm kiếm bằng hình ảnh
  searchByImage: (formData) => axiosClient.post('/search/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
>>>>>>> 9026a3f249b50e1b7f82b17f5da0d47cfd69ec9f
};

export default productApi;