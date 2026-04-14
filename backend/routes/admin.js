const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const RFQ = require('../models/RFQ');
const { protect, authorize } = require('../middleware/auth');

// All admin routes protected
router.use(protect, authorize('admin'));

// @GET /api/admin/stats - platform overview
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, manufacturers, importers,
      totalProducts, activeProducts,
      totalRFQs, pendingRFQs, acceptedRFQs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'manufacturer' }),
      User.countDocuments({ role: 'importer' }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      RFQ.countDocuments(),
      RFQ.countDocuments({ status: 'pending' }),
      RFQ.countDocuments({ status: 'accepted' })
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, manufacturers, importers },
        products: { total: totalProducts, active: activeProducts },
        rfqs: { total: totalRFQs, pending: pendingRFQs, accepted: acceptedRFQs }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/users - list all users with filters
router.get('/users', async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (verified !== undefined) query.isVerified = verified === 'true';

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/users/:id/verify - verify a manufacturer
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User verified', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/admin/users/:id/deactivate
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/admin/rfqs - all RFQs
router.get('/rfqs', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const total = await RFQ.countDocuments(query);
    const rfqs = await RFQ.find(query)
      .populate('importer', 'name company country')
      .populate('manufacturer', 'name company country')
      .populate('product', 'name category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/admin/products/:id - admin product removal
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted by admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
