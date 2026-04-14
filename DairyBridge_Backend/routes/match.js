const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const RFQ = require('../models/RFQ');
const { protect } = require('../middleware/auth');

// Simple content-based AI matching algorithm
function scoreMatch(product, importer) {
  let score = 0;
  const profile = importer.importerProfile || {};

  // Category preference match
  if (profile.preferredCategories?.includes(product.category)) score += 30;

  // Certification match for regulatory markets
  const marketCertMap = {
    'GCC': ['HALAL'], 'EU': ['ISO_22000'], 'FDA': ['FDA'],
    'ORGANIC': ['ORGANIC'], 'KOSHER': ['KOSHER']
  };
  const importerMarkets = profile.regulatoryMarkets || [];
  importerMarkets.forEach(market => {
    const needed = marketCertMap[market] || [];
    needed.forEach(cert => {
      if (product.certifications?.includes(cert)) score += 15;
    });
  });

  // Rating boost
  score += (product.manufacturer?.manufacturerProfile?.rating || 0) * 3;

  // Cold chain capability
  if (product.coldChainRequired && product.manufacturer?.manufacturerProfile?.coldChainAvailable) score += 10;

  // Price competitiveness (lower price = higher score for importer)
  if (product.pricing?.basePrice < 3000) score += 10;
  else if (product.pricing?.basePrice < 5000) score += 5;

  return Math.min(score, 100);
}

// @GET /api/match/products - AI matched products for importer
router.get('/products', protect, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('manufacturer', 'name company country manufacturerProfile')
      .limit(50);

    const scored = products.map(p => ({
      ...p.toObject(),
      matchScore: scoreMatch(p, req.user)
    })).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, data: scored.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/match/importers - AI matched importers for manufacturer
router.get('/importers', protect, async (req, res) => {
  try {
    const products = await Product.find({ manufacturer: req.user._id, isActive: true });
    if (products.length === 0) return res.json({ success: true, data: [] });

    const categories = [...new Set(products.map(p => p.category))];
    const certifications = [...new Set(products.flatMap(p => p.certifications || []))];

    const importers = await User.find({ role: 'importer', isActive: true }).select('-password');

    const scored = importers.map(imp => {
      let score = 0;
      const profile = imp.importerProfile || {};

      // Category interest overlap
      const overlap = (profile.preferredCategories || []).filter(c => categories.includes(c));
      score += overlap.length * 25;

      // Certification market match
      const marketCertMap = { 'GCC': 'HALAL', 'EU': 'ISO_22000', 'FDA': 'FDA' };
      (profile.regulatoryMarkets || []).forEach(m => {
        if (certifications.includes(marketCertMap[m])) score += 20;
      });

      return { ...imp.toObject(), matchScore: Math.min(score, 100) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, data: scored.slice(0, 15) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/match/similar/:productId - similar products
router.get('/similar/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const similar = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
      .populate('manufacturer', 'name company country manufacturerProfile')
      .limit(6);

    res.json({ success: true, data: similar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
