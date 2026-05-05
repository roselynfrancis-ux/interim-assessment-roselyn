const Crypto = require('../models/Crypto');

// @desc    Get all cryptocurrencies
// @route   GET /crypto
// @access  Public
exports.getAllCrypto = async (req, res) => {
  try {
    const cryptos = await Crypto.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cryptos.length,
      data: cryptos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching cryptocurrencies',
    });
  }
};

// @desc    Get top gainers
// @route   GET /crypto/gainers
// @access  Public
exports.getGainers = async (req, res) => {
  try {
    const gainers = await Crypto.find()
      .sort({ change24h: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: gainers.length,
      data: gainers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching gainers',
    });
  }
};

// @desc    Get new listings
// @route   GET /crypto/new
// @access  Public
exports.getNewListings = async (req, res) => {
  try {
    const newListings = await Crypto.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: newListings.length,
      data: newListings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching new listings',
    });
  }
};

// @desc    Create new cryptocurrency
// @route   POST /crypto
// @access  Private
exports.createCrypto = async (req, res) => {
  try {
    const { name, symbol, price, image, change24h, change7d, marketCap, volume, supply, color, category, sparkline } = req.body;

    // Validation
    if (!name || !symbol || price === undefined || !image || change24h === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, symbol, price, image, and change24h',
      });
    }

    // Check if crypto with same symbol already exists
    const cryptoExists = await Crypto.findOne({ symbol: symbol.toUpperCase() });
    if (cryptoExists) {
      return res.status(400).json({
        success: false,
        message: 'Cryptocurrency with this symbol already exists',
      });
    }

    // Create cryptocurrency
    const crypto = await Crypto.create({
      name,
      symbol: symbol.toUpperCase(),
      price,
      image,
      change24h,
      change7d: change7d || 0,
      marketCap: marketCap || 0,
      volume: volume || 0,
      supply: supply || 0,
      color: color || '#0052FF',
      category: category || 'crypto',
      sparkline: sparkline || [price],
    });

    res.status(201).json({
      success: true,
      message: 'Cryptocurrency added successfully',
      data: crypto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating cryptocurrency',
    });
  }
};

// @desc    Get single cryptocurrency
// @route   GET /crypto/:id
// @access  Public
exports.getCryptoById = async (req, res) => {
  try {
    const crypto = await Crypto.findById(req.params.id);

    if (!crypto) {
      return res.status(404).json({
        success: false,
        message: 'Cryptocurrency not found',
      });
    }

    res.status(200).json({
      success: true,
      data: crypto,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching cryptocurrency',
    });
  }
};
