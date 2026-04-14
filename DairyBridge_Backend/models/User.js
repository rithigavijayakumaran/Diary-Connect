const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['manufacturer', 'importer', 'admin'], required: true },
  company: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Manufacturer specific
  manufacturerProfile: {
    state: String,
    certifications: [{ type: String, enum: ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'] }],
    establishedYear: Number,
    annualCapacity: String, // e.g. "5000 MT/year"
    exportCountries: [String],
    description: String,
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    coldChainAvailable: { type: Boolean, default: false }
  },

  // Importer specific
  importerProfile: {
    importRegions: [String],
    preferredCategories: [String],
    annualImportVolume: String,
    regulatoryMarkets: [String] // e.g. ['EU', 'GCC', 'FDA']
  },

  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
