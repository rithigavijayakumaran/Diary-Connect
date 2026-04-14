const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const RFQ = require('../models/RFQ');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @GET /api/analytics/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    if (req.user.role === 'manufacturer') {
      const products = await Product.find({ manufacturer: req.user._id });
      const rfqs = await RFQ.find({ manufacturer: req.user._id });

      const totalViews = products.reduce((sum, p) => sum + p.views, 0);
      const totalInquiries = products.reduce((sum, p) => sum + p.inquiries, 0);

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
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentRFQs = rfqs.filter(r => r.createdAt >= sixMonthsAgo);

      const monthlyTrend = {};
      recentRFQs.forEach(r => {
        const key = r.createdAt.toISOString().slice(0, 7);
        monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
      });

      // Top inquiry countries
      const rfqPopulated = await RFQ.find({ manufacturer: req.user._id }).populate('importer', 'country');
      const countryMap = {};
      rfqPopulated.forEach(r => {
        if (r.importer?.country) countryMap[r.importer.country] = (countryMap[r.importer.country] || 0) + 1;
      });
      const topCountries = Object.entries(countryMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

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
          monthlyTrend,
          topCountries
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
        categoryMap[r.productCategory] = (categoryMap[r.productCategory] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalRFQs: rfqs.length,
          pendingRFQs: rfqs.filter(r => r.status === 'pending').length,
          quotedRFQs: rfqs.filter(r => r.status === 'quoted').length,
          acceptedRFQs: rfqs.filter(r => r.status === 'accepted').length,
          statusCounts,
          categoryBreakdown: categoryMap
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/analytics/market - public market data
router.get('/market', async (req, res) => {
  try {
    const categoryDemand = await RFQ.aggregate([
      { $group: { _id: '$productCategory', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      { $sort: { count: -1 } }
    ]);

    const topManufacturerStates = await User.aggregate([
      { $match: { role: 'manufacturer' } },
      { $group: { _id: '$manufacturerProfile.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const importerCountries = await User.aggregate([
      { $match: { role: 'importer' } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: { categoryDemand, topManufacturerStates, importerCountries }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
