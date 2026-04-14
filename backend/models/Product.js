const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Ghee', 'Skimmed Milk Powder', 'Whole Milk Powder', 'Butter', 'Cheese', 'Paneer',
           'Whey Protein', 'Casein', 'UHT Milk', 'Condensed Milk', 'Lactose', 'Cream', 'Yogurt', 'Other']
  },
  description: { type: String, required: true },
  images: [String],

  specifications: {
    fatContent: String,        // e.g. "45% min"
    moistureContent: String,
    proteinContent: String,
    shelfLife: String,         // e.g. "24 months"
    storageTemp: String,       // e.g. "-18°C to 4°C"
    packagingFormats: [String],// e.g. ["25kg bags", "200L drums"]
    grade: String
  },

  pricing: {
    basePrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    unit: { type: String, default: 'MT' },
    moq: { type: Number, required: true }, // Minimum Order Quantity
    moqUnit: { type: String, default: 'MT' }
  },

  certifications: [{ type: String, enum: ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'] }],
  targetMarkets: [String],
  originState: String,

  coldChainRequired: { type: Boolean, default: false },
  exportReady: { type: Boolean, default: true },

  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },

  tags: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
