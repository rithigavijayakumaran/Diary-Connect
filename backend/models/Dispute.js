const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  rfq:        { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  raisedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstUser:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  category: {
    type: String,
    enum: ['payment', 'quality', 'delivery', 'fraud', 'communication', 'other'],
    required: true,
  },
  title:      { type: String, required: true },
  description:{ type: String, required: true },
  evidence:   [String],  // file URLs

  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_favour_raiser', 'resolved_favour_defendant', 'dismissed'],
    default: 'open',
  },

  adminNotes: [{
    admin:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note:    String,
    addedAt: { type: Date, default: Date.now },
  }],

  resolution:  { type: String },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  { type: Date },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Dispute', disputeSchema);