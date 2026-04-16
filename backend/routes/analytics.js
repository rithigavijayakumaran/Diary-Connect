const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const RFQ = require('../models/RFQ');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── Helper: last N months labels ────────────────────────────────────────────
function buildMonthBuckets(n = 6) {
  const buckets = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7); // "2025-10"
    buckets[key] = 0;
  }
  return buckets;
}

// ─── India state production data (seeded / aggregated) ────────────────────────
const STATE_COORDS = {
  'Gujarat':         { lat: 22.3, lng: 72.1 },
  'Rajasthan':       { lat: 27.0, lng: 74.2 },
  'Uttar Pradesh':   { lat: 26.8, lng: 80.9 },
  'Punjab':          { lat: 31.1, lng: 75.3 },
  'Haryana':         { lat: 29.0, lng: 76.1 },
  'Maharashtra':     { lat: 19.8, lng: 75.7 },
  'Andhra Pradesh':  { lat: 15.9, lng: 79.7 },
  'Karnataka':       { lat: 15.3, lng: 75.7 },
  'Tamil Nadu':      { lat: 11.1, lng: 78.7 },
  'Kerala':          { lat: 10.8, lng: 76.3 },
  'Madhya Pradesh':  { lat: 22.9, lng: 78.7 },
  'Bihar':           { lat: 25.1, lng: 85.3 },
  'West Bengal':     { lat: 22.9, lng: 87.9 },
  'Himachal Pradesh':{ lat: 31.1, lng: 77.2 },
  'Uttarakhand':     { lat: 30.1, lng: 79.2 },
};

// ─── GET /api/analytics/dashboard ─────────────────────────────────────────────
router.get('/dashboard', protect, async (req, res) => {
  try {
    if (req.user.role === 'manufacturer') {
      const products = await Product.find({ manufacturer: req.user._id });
      const rfqs     = await RFQ.find({ manufacturer: req.user._id });

      const totalViews     = products.reduce((s, p) => s + p.views, 0);
      const totalInquiries = products.reduce((s, p) => s + p.inquiries, 0);

      // Status counts
      const statusCounts = rfqs.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      // Category breakdown
      const categoryMap = {};
      products.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      });

      // Monthly RFQ trend (last 6 months)
      const monthlyTrend = buildMonthBuckets(6);
      rfqs.forEach(r => {
        const key = r.createdAt.toISOString().slice(0, 7);
        if (key in monthlyTrend) monthlyTrend[key]++;
      });

      // Top inquiry countries (from importer profiles)
      const rfqPopulated = await RFQ.find({ manufacturer: req.user._id }).populate('importer', 'country');
      const countryMap = {};
      rfqPopulated.forEach(r => {
        const c = r.importer?.country;
        if (c) countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([country, count]) => ({ country, count }));

      // Product performance (views + inquiries per product)
      const productPerformance = products
        .map(p => ({ name: p.name, category: p.category, views: p.views, inquiries: p.inquiries }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);

      // RFQ value pipeline
      const pipeline = rfqs.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + (r.quantity || 0);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          activeProducts: products.filter(p => p.isActive).length,
          totalViews,
          totalInquiries,
          totalRFQs: rfqs.length,
          statusCounts,
          categoryBreakdown: categoryMap,
          monthlyTrend: Object.entries(monthlyTrend).map(([month, count]) => ({ month, count })),
          topCountries,
          productPerformance,
          pipeline,
        }
      });

    } else if (req.user.role === 'importer') {
      const rfqs = await RFQ.find({ importer: req.user._id });

      const statusCounts = rfqs.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      const categoryMap = {};
      rfqs.forEach(r => {
        if (r.productCategory) categoryMap[r.productCategory] = (categoryMap[r.productCategory] || 0) + 1;
      });

      // Monthly trend
      const monthlyTrend = buildMonthBuckets(6);
      rfqs.forEach(r => {
        const key = r.createdAt.toISOString().slice(0, 7);
        if (key in monthlyTrend) monthlyTrend[key]++;
      });

      // Suppliers by country
      const rfqPop = await RFQ.find({ importer: req.user._id }).populate('manufacturer', 'country company');
      const supplierCountries = {};
      rfqPop.forEach(r => {
        const c = r.manufacturer?.country;
        if (c) supplierCountries[c] = (supplierCountries[c] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalRFQs: rfqs.length,
          pendingRFQs:    rfqs.filter(r => r.status === 'pending').length,
          quotedRFQs:     rfqs.filter(r => r.status === 'quoted').length,
          acceptedRFQs:   rfqs.filter(r => r.status === 'accepted').length,
          rejectedRFQs:   rfqs.filter(r => r.status === 'rejected').length,
          statusCounts,
          categoryBreakdown: categoryMap,
          monthlyTrend: Object.entries(monthlyTrend).map(([month, count]) => ({ month, count })),
          supplierCountries: Object.entries(supplierCountries)
            .sort((a, b) => b[1] - a[1])
            .map(([country, count]) => ({ country, count })),
        }
      });
    } else {
      // If none of the roles match (e.g., admin), send a 403 or empty data
      // This prevents the request from hanging
      return res.status(403).json({ success: false, message: 'Access denied for this role' });
    }
  } catch (err) {
    console.error('Analytics dashboard error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /api/analytics/market ─────────────────────────────────────────────────
router.get('/market', async (req, res) => {
  try {
    // Category demand from RFQs
    const categoryDemand = await RFQ.aggregate([
      { $group: { _id: '$productCategory', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
      { $match: { _id: { $ne: null } } }
    ]);

    // Importer countries
    const importerCountries = await User.aggregate([
      { $match: { role: 'importer' } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ]);

    // Platform RFQ monthly trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const rfqTrend = await RFQ.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        totalQty: { $sum: '$quantity' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fill in zero months
    const monthBuckets = buildMonthBuckets(12);
    rfqTrend.forEach(r => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2,'0')}`;
      if (key in monthBuckets) monthBuckets[key] = r.count;
    });

    // India state heatmap — aggregate manufacturers by state + product counts
    const stateManufacturers = await User.aggregate([
      { $match: { role: 'manufacturer', 'manufacturerProfile.state': { $exists: true, $ne: null } } },
      { $group: { _id: '$manufacturerProfile.state', manufacturerCount: { $sum: 1 } } }
    ]);

    // Attach product counts per state
    const stateProductCounts = await Product.aggregate([
      { $lookup: {
        from: 'users',
        localField: 'manufacturer',
        foreignField: '_id',
        as: 'mfg'
      }},
      { $unwind: '$mfg' },
      { $match: { 'mfg.manufacturerProfile.state': { $exists: true, $ne: null } } },
      { $group: {
        _id: '$mfg.manufacturerProfile.state',
        productCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalInquiries: { $sum: '$inquiries' },
        categories: { $addToSet: '$category' }
      }}
    ]);

    // Merge state data with coordinates
    const stateMap = {};
    stateManufacturers.forEach(s => { stateMap[s._id] = { state: s._id, manufacturerCount: s.manufacturerCount, productCount: 0, totalViews: 0, totalInquiries: 0, categories: [] }; });
    stateProductCounts.forEach(s => {
      if (!stateMap[s._id]) stateMap[s._id] = { state: s._id, manufacturerCount: 0 };
      stateMap[s._id].productCount    = s.productCount;
      stateMap[s._id].totalViews      = s.totalViews;
      stateMap[s._id].totalInquiries  = s.totalInquiries;
      stateMap[s._id].categories      = s.categories;
    });

    const stateHeatmap = Object.values(stateMap).map(s => ({
      ...s,
      ...STATE_COORDS[s.state],
    })).filter(s => s.lat); // only states with known coords

    // Top verified manufacturers
    const topManufacturers = await User.find({ role: 'manufacturer', isVerified: true })
      .select('name company country manufacturerProfile.state manufacturerProfile.rating manufacturerProfile.totalReviews manufacturerProfile.certifications')
      .sort({ 'manufacturerProfile.rating': -1 })
      .limit(5);

    // Certification distribution across products
    const certDist = await Product.aggregate([
      { $unwind: '$certifications' },
      { $group: { _id: '$certifications', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Status distribution across all RFQs
    const rfqStatusDist = await RFQ.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        categoryDemand,
        importerCountries,
        rfqMonthlyTrend: Object.entries(monthBuckets).map(([month, count]) => ({ month, count })),
        stateHeatmap,
        topManufacturers,
        certDist,
        rfqStatusDist,
        summary: {
          totalManufacturers: await User.countDocuments({ role: 'manufacturer' }),
          totalImporters:     await User.countDocuments({ role: 'importer' }),
          totalProducts:      await Product.countDocuments({ isActive: true }),
          totalRFQs:          await RFQ.countDocuments(),
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;