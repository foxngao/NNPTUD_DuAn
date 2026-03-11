const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { searchParts, getPartById } = require('../controllers/part.controller');
=======
const { searchParts, getSuggestions, getPartById } = require('../controllers/part.controller');

// GET /api/v1/parts/suggestions?q=... (phải đặt trước /:id)
router.get('/suggestions', getSuggestions);
>>>>>>> 9026a3f249b50e1b7f82b17f5da0d47cfd69ec9f

// GET /api/v1/parts/search
router.get('/search', searchParts);

// GET /api/v1/parts/:id
router.get('/:id', getPartById);

module.exports = router;
