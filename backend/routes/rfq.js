const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const Product = require('../models/Product');
const Dispute = require('../models/Dispute');
const { protect, authorize } = require('../middleware/auth');

// @POST /api/rfq - importer creates RFQ
router.post('/', protect, authorize('importer'), async (req, res) => {
  try {
    const rfq = await RFQ.create({ ...req.body, importer: req.user._id });
    if (req.body.product) {
      await Product.findByIdAndUpdate(req.body.product, { $inc: { inquiries: 1 } });
    }
    res.status(201).json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rfq/my - get user's RFQs
router.get('/my', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'importer'
      ? { importer: req.user._id }
      : { manufacturer: req.user._id };

    const rfqs = await RFQ.find(filter)
      .populate('importer', 'name company country')
      .populate('manufacturer', 'name company country')
      .populate('product', 'name category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: rfqs.length, data: rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rfq/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('importer', 'name company country phone importerProfile')
      .populate('manufacturer', 'name company country manufacturerProfile')
      .populate('product', 'name category specifications pricing');

    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    // Mark as viewed if manufacturer
    if (req.user.role === 'manufacturer' && rfq.status === 'pending') {
      rfq.status = 'viewed';
      await rfq.save();
    }

    // Find any associated dispute
    const dispute = await Dispute.findOne({ rfq: rfq._id })
      .populate('raisedBy', 'name company')
      .populate('againstUser', 'name company');

    res.json({ success: true, data: { ...rfq._doc, dispute } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/rfq/:id/quote - manufacturer submits quote
router.put('/:id/quote', protect, authorize('manufacturer'), async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    rfq.quotations.push(req.body);
    rfq.status = 'quoted';
    rfq.updatedAt = Date.now();
    await rfq.save();

    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/rfq/:id/status - update RFQ status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const rfq = await RFQ.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/rfq/:id/message - add message to RFQ thread
router.post('/:id/message', protect, async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    rfq.messages.push({ sender: req.user._id, content: req.body.content });
    if (rfq.status === 'quoted') rfq.status = 'negotiating';
    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rfq/stats/overview - dashboard stats
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'importer'
      ? { importer: req.user._id }
      : { manufacturer: req.user._id };

    const [total, pending, quoted, accepted] = await Promise.all([
      RFQ.countDocuments(filter),
      RFQ.countDocuments({ ...filter, status: 'pending' }),
      RFQ.countDocuments({ ...filter, status: 'quoted' }),
      RFQ.countDocuments({ ...filter, status: 'accepted' })
    ]);

    res.json({ success: true, data: { total, pending, quoted, accepted } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/rfq/:id/dispute - raise a dispute for an RFQ
router.post('/:id/dispute', protect, authorize('importer', 'manufacturer'), async (req, res) => {
  try {
    const { category, title, description, againstUserId } = req.body;
    
    if (!category || !title || !description || !againstUserId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if there is already an active dispute for this RFQ
    const existing = await Dispute.findOne({ 
      rfq: req.params.id, 
      status: { $in: ['open', 'under_review'] } 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'A dispute is already active for this transaction.' 
      });
    }

    const dispute = await Dispute.create({
      rfq: req.params.id,
      raisedBy: req.user._id,
      againstUser: againstUserId,
      category,
      title,
      description,
      status: 'open',
    });

    res.status(201).json({ success: true, data: dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/rfq/my/disputes - get user's related disputes
router.get('/my/disputes/list', protect, async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ raisedBy: req.user._id }, { againstUser: req.user._id }],
    })
      .populate('raisedBy', 'name company')
      .populate('againstUser', 'name company')
      .populate('rfq', 'title productCategory status')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: disputes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
