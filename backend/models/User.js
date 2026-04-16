const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const certDocSchema = new mongoose.Schema({
  type:       { type: String, enum: ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'], required: true },
  fileUrl:    { type: String, required: true },   // path served via /uploads/certs/
  fileName:   { type: String },
  uploadedAt: { type: Date, default: Date.now },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:  { type: String },                   // rejection reason or approval note
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, unique: true, lowercase: true },
  password:{ type: String, required: true, minlength: 6 },
  role:    { type: String, enum: ['manufacturer', 'importer', 'admin'], required: true },
  company: { type: String, required: true },
  country: { type: String, required: true },
  phone:   { type: String },
  avatar:  { type: String },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },

  // ── Manufacturer specific ─────────────────────────────────────────────────
  manufacturerProfile: {
    state:             String,
    certifications:    [{ type: String, enum: ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'] }],
    establishedYear:   Number,
    annualCapacity:    String,
    exportCountries:   [String],
    description:       String,
    rating:            { type: Number, default: 0 },
    totalReviews:      { type: Number, default: 0 },
    coldChainAvailable:{ type: Boolean, default: false },
  },

  // ── Certificate documents (uploaded by manufacturer, reviewed by admin) ───
  certDocuments: [certDocSchema],

  // ── Importer specific ─────────────────────────────────────────────────────
  importerProfile: {
    importRegions:        [String],
    preferredCategories:  [String],
    annualImportVolume:   String,
    regulatoryMarkets:    [String],
  },

  // ── Subscription (manufacturer) ───────────────────────────────────────────
  subscription: {
    plan:      { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
    status:    { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
    startDate: { type: Date },
    endDate:   { type: Date },
    // admin manually sets this for now (no payment gateway)
    assignedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt:{ type: Date },
  },

  // ── Premium leads (importer) ──────────────────────────────────────────────
  premiumLeads: {
    isActive:   { type: Boolean, default: false },
    expiresAt:  { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
  },

  // ── Onboarding status ─────────────────────────────────────────────────────
  onboarding: {
    profileComplete:    { type: Boolean, default: false },
    certsUploaded:      { type: Boolean, default: false },
    firstProductAdded:  { type: Boolean, default: false },  // manufacturer
    firstRFQSent:       { type: Boolean, default: false },  // importer
    welcomeEmailSent:   { type: Boolean, default: false },
  },

  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

// Virtual: how many certs are approved
userSchema.virtual('approvedCertCount').get(function () {
  return (this.certDocuments || []).filter(c => c.status === 'approved').length;
});

module.exports = mongoose.model('User', userSchema);