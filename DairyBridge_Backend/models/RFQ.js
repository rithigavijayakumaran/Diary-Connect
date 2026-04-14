const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
  importer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

  title: { type: String, required: true },
  productCategory: { type: String, required: true },
  quantity: { type: Number, required: true },
  quantityUnit: { type: String, default: 'MT' },
  targetPrice: Number,
  currency: { type: String, default: 'USD' },
  deliveryPort: String,
  deliveryDate: Date,
  paymentTerms: String,
  specialRequirements: String,
  certificationRequired: [String],

  status: {
    type: String,
    enum: ['pending', 'viewed', 'quoted', 'negotiating', 'accepted', 'rejected', 'closed'],
    default: 'pending'
  },

  quotations: [{
    price: Number,
    currency: String,
    validUntil: Date,
    notes: String,
    submittedAt: { type: Date, default: Date.now }
  }],

  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    sentAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RFQ', rfqSchema);
