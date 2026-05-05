const express = require('express');
const {
  getAllCrypto,
  getGainers,
  getNewListings,
  createCrypto,
  getCryptoById,
} = require('../controllers/cryptoController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllCrypto);
router.get('/gainers', getGainers);
router.get('/new', getNewListings);
router.get('/:id', getCryptoById);

// Protected routes
router.post('/', protect, createCrypto);

module.exports = router;
