const mongoose = require('mongoose');

const cryptoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a cryptocurrency name'],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Please provide a cryptocurrency symbol'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    change24h: {
      type: Number,
      required: [true, 'Please provide 24h change percentage'],
      default: 0,
    },
    change7d: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    supply: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: '#0052FF',
    },
    category: {
      type: String,
      enum: ['crypto', 'stablecoin', 'stock', 'prediction'],
      default: 'crypto',
    },
    sparkline: {
      type: [Number],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for sorting by gainers
cryptoSchema.index({ change24h: -1 });

// Index for sorting by newest
cryptoSchema.index({ createdAt: -1 });

// Add ID field (MongoDB uses _id by default, but we'll add a virtual id for consistency)
cryptoSchema.virtual('id').get(function() {
  return this._id;
});

cryptoSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Crypto', cryptoSchema);
