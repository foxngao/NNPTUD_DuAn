const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Controllers
const { createBrand, updateBrand, deleteBrand } = require('../controllers/brand.controller');
const { createModel, updateModel, deleteModel, createModelYear, deleteModelYear } = require('../controllers/model.controller');
const { createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { createPart, updatePart, deletePart, addCompatibility } = require('../controllers/part.controller');
const { getAllUsers, toggleUserStatus, getRevenueStats } = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(verifyToken, isAdmin);

// ========== BRANDS ==========
router.post('/brands', [
  body('name').trim().notEmpty().withMessage('Brand name is required'),
  body('country').optional().trim(),
  validate
], createBrand);

router.put('/brands/:id', [
  body('name').trim().notEmpty().withMessage('Brand name is required'),
  body('country').optional().trim(),
  validate
], updateBrand);

router.delete('/brands/:id', deleteBrand);

// ========== MODELS ==========
router.post('/models', [
  body('brand_id').isInt({ min: 1 }).withMessage('Valid brand_id is required'),
  body('name').trim().notEmpty().withMessage('Model name is required'),
  validate
], createModel);

router.put('/models/:id', [
  body('brand_id').isInt({ min: 1 }).withMessage('Valid brand_id is required'),
  body('name').trim().notEmpty().withMessage('Model name is required'),
  validate
], updateModel);

router.delete('/models/:id', deleteModel);

// ========== MODEL YEARS ==========
router.post('/model-years', [
  body('model_id').isInt({ min: 1 }).withMessage('Valid model_id is required'),
  body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid year is required'),
  validate
], createModelYear);

router.delete('/model-years/:id', deleteModelYear);

// ========== CATEGORIES ==========
router.post('/categories', [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  validate
], createCategory);

router.put('/categories/:id', [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  validate
], updateCategory);

router.delete('/categories/:id', deleteCategory);

// ========== PARTS ==========
router.post('/parts', [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category_id is required'),
  body('name').trim().notEmpty().withMessage('Part name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  validate
], createPart);

router.put('/parts/:id', [
  body('category_id').isInt({ min: 1 }).withMessage('Valid category_id is required'),
  body('name').trim().notEmpty().withMessage('Part name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  validate
], updatePart);

router.delete('/parts/:id', deletePart);

// POST /api/v1/admin/parts/:id/compatibility
router.post('/parts/:id/compatibility', [
  body('model_year_ids').isArray({ min: 1 }).withMessage('model_year_ids must be a non-empty array'),
  validate
], addCompatibility);

// ========== USERS ==========
router.get('/users', getAllUsers);

router.put('/users/:id/status', [
  body('is_active').isBoolean().withMessage('is_active must be boolean'),
  validate
], toggleUserStatus);

// ========== STATISTICS ==========
router.get('/stats/revenue', getRevenueStats);

module.exports = router;
