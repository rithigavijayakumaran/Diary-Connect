const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/products - public catalog with filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, certification, country, search, coldChain, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (certification) query.certifications = { $in: certification.split(',') };
    if (coldChain === 'true') query.coldChainRequired = true;
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('manufacturer', 'name company country manufacturerProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), page: Number(page), data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('manufacturer', 'name company country phone manufacturerProfile');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/products - manufacturer only
router.post('/', protect, authorize('manufacturer'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, manufacturer: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/products/:id
router.put('/:id', protect, authorize('manufacturer'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, manufacturer: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    Object.assign(product, req.body, { updatedAt: Date.now() });
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/products/:id
router.delete('/:id', protect, authorize('manufacturer'), async (req, res) => {
  try {
    await Product.findOneAndUpdate({ _id: req.params.id, manufacturer: req.user._id }, { isActive: false });
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/products/my/listings
router.get('/my/listings', protect, authorize('manufacturer'), async (req, res) => {
  try {
    const products = await Product.find({ manufacturer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
