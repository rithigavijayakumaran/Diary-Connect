/**
 * routes/match.js  ─  DairyBridge AI Matchmaking Engine v2
 *
 * Scoring layers (for importer → product matching):
 *  [Static]   Category preference match           +30
 *  [Static]   Regulatory / certification match    +15 per cert hit
 *  [Static]   Rating boost                        up to +18
 *  [Static]   Cold chain capability               +10
 *  [Static]   Price competitiveness               +5–10
 *  [Learned]  Past RFQ to same manufacturer       +25 (loyalty signal)
 *  [Learned]  Past RFQ in same category           +20 (repeat interest)
 *  [Learned]  High inquiry volume in category     +0–15 (demand signal)
 *  [Learned]  Accepted/negotiating RFQ boost      +20 (conversion signal)
 *  [Learned]  Cert overlap with past RFQ demands  +10 per overlap
 *  [Learned]  Recent activity recency bonus       +0–10 (decays with time)
 *
 * For manufacturer → importer matching, symmetric signals are used.
 */

const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const User    = require('../models/User');
const RFQ     = require('../models/RFQ');
const { protect } = require('../middleware/auth');

// ─── Constants ────────────────────────────────────────────────────────────────
const MARKET_CERT_MAP = {
  GCC:     ['HALAL'],
  EU:      ['ISO_22000', 'ISO_9001'],
  FDA:     ['FDA'],
  ORGANIC: ['ORGANIC'],
  KOSHER:  ['KOSHER'],
  APEDA:   ['APEDA'],
};

const POSITIVE_STATUSES  = new Set(['accepted', 'negotiating', 'quoted']);
const COMPLETED_STATUSES = new Set(['accepted', 'closed']);

// ─── Recency weight: full weight within 30 days, decays to 0.1 after 180 days
function recencyWeight(date) {
  const daysAgo = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo <= 30)  return 1.0;
  if (daysAgo >= 180) return 0.1;
  return 1.0 - (daysAgo - 30) / (180 - 30) * 0.9;
}

// ─── Build importer behaviour profile from past RFQs ─────────────────────────
async function buildImporterProfile(importerId) {
  const rfqs = await RFQ.find({ importer: importerId })
    .populate('manufacturer', '_id')
    .sort({ createdAt: -1 })
    .limit(100);   // cap for performance

  const categoryFreq    = {};   // { category: count }
  const categoryRecent  = {};   // { category: latest Date }
  const mfgFreq         = {};   // { manufacturerId: count }
  const certsDemanded   = {};   // { cert: count }
  const positiveSignals = new Set();   // manufacturerIds with good outcomes
  let   totalVolume     = 0;

  rfqs.forEach(r => {
    const cat  = r.productCategory;
    const mfgId = r.manufacturer?._id?.toString();
    const w    = recencyWeight(r.createdAt);

    // Category frequency (weighted by recency)
    categoryFreq[cat]   = (categoryFreq[cat]  || 0) + w;
    if (!categoryRecent[cat] || r.createdAt > categoryRecent[cat]) categoryRecent[cat] = r.createdAt;

    // Manufacturer engagement
    if (mfgId) mfgFreq[mfgId] = (mfgFreq[mfgId] || 0) + w;

    // Certifications the importer explicitly requested
    (r.certificationRequired || []).forEach(c => {
      certsDemanded[c] = (certsDemanded[c] || 0) + w;
    });

    // Positive conversion signals
    if (POSITIVE_STATUSES.has(r.status) && mfgId) positiveSignals.add(mfgId);

    totalVolume += r.quantity || 0;
  });

  return { categoryFreq, categoryRecent, mfgFreq, certsDemanded, positiveSignals, totalVolume, rfqCount: rfqs.length };
}

// ─── Build manufacturer behaviour profile from past RFQs ─────────────────────
async function buildManufacturerProfile(manufacturerId) {
  const rfqs = await RFQ.find({ manufacturer: manufacturerId })
    .populate('importer', '_id country importerProfile')
    .sort({ createdAt: -1 })
    .limit(100);

  const importerFreq      = {};
  const importerCountries = {};
  const categoryFreq      = {};
  const positiveImporters = new Set();
  let   totalVolume       = 0;

  rfqs.forEach(r => {
    const impId  = r.importer?._id?.toString();
    const country = r.importer?.country;
    const cat    = r.productCategory;
    const w      = recencyWeight(r.createdAt);

    if (impId) importerFreq[impId] = (importerFreq[impId] || 0) + w;
    if (country) importerCountries[country] = (importerCountries[country] || 0) + w;
    categoryFreq[cat] = (categoryFreq[cat] || 0) + w;
    if (POSITIVE_STATUSES.has(r.status) && impId) positiveImporters.add(impId);
    totalVolume += r.quantity || 0;
  });

  return { importerFreq, importerCountries, categoryFreq, positiveImporters, totalVolume, rfqCount: rfqs.length };
}

// ─── Score: product ↔ importer ────────────────────────────────────────────────
function scoreProductForImporter(product, importerUser, learnedProfile) {
  let score = 0;
  const breakdown = [];
  const profile   = importerUser.importerProfile || {};
  const {
    categoryFreq, mfgFreq, certsDemanded, positiveSignals, rfqCount
  } = learnedProfile;

  const mfgId      = product.manufacturer?._id?.toString();
  const productCat = product.category;

  // ── Static signals ──────────────────────────────────────────────────────────

  // Category preference (registration profile)
  if ((profile.preferredCategories || []).includes(productCat)) {
    score += 30; breakdown.push({ reason: 'Matches your preferred category', pts: 30 });
  }

  // Regulatory / certification match
  const importerMarkets = profile.regulatoryMarkets || [];
  let certScore = 0;
  importerMarkets.forEach(market => {
    (MARKET_CERT_MAP[market] || []).forEach(cert => {
      if ((product.certifications || []).includes(cert)) certScore += 15;
    });
  });
  if (certScore) { score += certScore; breakdown.push({ reason: `Holds ${Math.round(certScore/15)} of your required certifications`, pts: certScore }); }

  // Manufacturer rating
  const rating = product.manufacturer?.manufacturerProfile?.rating || 0;
  const ratingPts = Math.round(rating * 3);
  if (ratingPts) { score += ratingPts; breakdown.push({ reason: `Manufacturer rated ${rating}/5`, pts: ratingPts }); }

  // Cold chain
  if (product.coldChainRequired && product.manufacturer?.manufacturerProfile?.coldChainAvailable) {
    score += 10; breakdown.push({ reason: 'Cold chain logistics available', pts: 10 });
  }

  // Price band
  const price = product.pricing?.basePrice;
  if (price < 3000)      { score += 10; breakdown.push({ reason: 'Competitive pricing', pts: 10 }); }
  else if (price < 5000) { score +=  5; breakdown.push({ reason: 'Moderate pricing', pts: 5 }); }

  // ── Learned signals (only kick in after importer has activity) ──────────────

  if (rfqCount > 0) {

    // Loyalty: importer previously contacted this manufacturer
    const mfgEngagement = mfgFreq[mfgId] || 0;
    if (mfgEngagement > 0) {
      const pts = Math.min(25, Math.round(mfgEngagement * 15));
      score += pts; breakdown.push({ reason: 'You have previously worked with this supplier', pts });
    }

    // Positive conversion: a past RFQ with this manufacturer led somewhere good
    if (positiveSignals.has(mfgId)) {
      score += 20; breakdown.push({ reason: 'Past successful negotiation with this supplier', pts: 20 });
    }

    // Repeat category interest
    const catEngagement = categoryFreq[productCat] || 0;
    if (catEngagement > 0 && !(profile.preferredCategories||[]).includes(productCat)) {
      const pts = Math.min(20, Math.round(catEngagement * 10));
      score += pts; breakdown.push({ reason: `You frequently source ${productCat}`, pts });
    }

    // Cert overlap with historically demanded certs
    let histCertPts = 0;
    Object.keys(certsDemanded).forEach(cert => {
      if ((product.certifications || []).includes(cert)) {
        histCertPts += Math.min(10, Math.round(certsDemanded[cert] * 5));
      }
    });
    if (histCertPts) { score += histCertPts; breakdown.push({ reason: "Holds certs you've historically required", pts: histCertPts }); }

    // Recency bonus: this category was sourced recently
    const catRecent = learnedProfile.categoryRecent?.[productCat];
    if (catRecent) {
      const recencyPts = Math.round(recencyWeight(catRecent) * 10);
      if (recencyPts >= 3) { score += recencyPts; breakdown.push({ reason: 'Recent sourcing activity in this category', pts: recencyPts }); }
    }
  }

  return { score: Math.min(Math.round(score), 100), breakdown };
}

// ─── Score: importer ↔ manufacturer products ──────────────────────────────────
function scoreImporterForManufacturer(importer, mfgCategories, mfgCerts, learnedProfile) {
  let score = 0;
  const breakdown = [];
  const profile   = importer.importerProfile || {};
  const {
    importerFreq, importerCountries, positiveImporters, rfqCount
  } = learnedProfile;

  const impId = importer._id?.toString();

  // ── Static signals ──────────────────────────────────────────────────────────

  // Category overlap
  const overlap = (profile.preferredCategories || []).filter(c => mfgCategories.includes(c));
  if (overlap.length) {
    const pts = Math.min(35, overlap.length * 25);
    score += pts; breakdown.push({ reason: `Interested in ${overlap.join(', ')}`, pts });
  }

  // Cert/market alignment
  let certPts = 0;
  (profile.regulatoryMarkets || []).forEach(market => {
    (MARKET_CERT_MAP[market] || []).forEach(cert => {
      if (mfgCerts.includes(cert)) certPts += 15;
    });
  });
  if (certPts) { score += certPts; breakdown.push({ reason: `Regulatory markets align with your certs`, pts: certPts }); }

  // Import volume indicator
  const volMap = { 'Less than 100 MT/year': 5, '100-500 MT/year': 8, '500+ MT/year': 12 };
  const volPts = volMap[profile.annualImportVolume] || 0;
  if (volPts) { score += volPts; breakdown.push({ reason: `Imports ${profile.annualImportVolume}`, pts: volPts }); }

  // ── Learned signals ─────────────────────────────────────────────────────────

  if (rfqCount > 0) {

    // This importer has sent RFQs to us before
    const impEngagement = importerFreq[impId] || 0;
    if (impEngagement > 0) {
      const pts = Math.min(25, Math.round(impEngagement * 15));
      score += pts; breakdown.push({ reason: 'Returning buyer — previously contacted you', pts });
    }

    // Positive outcome with this importer
    if (positiveImporters.has(impId)) {
      score += 20; breakdown.push({ reason: 'Prior successful negotiation with this buyer', pts: 20 });
    }

    // Country trade momentum
    const countryScore = Math.min(10, Math.round((importerCountries[importer.country] || 0) * 5));
    if (countryScore >= 3) {
      score += countryScore;
      breakdown.push({ reason: `Strong trade history with ${importer.country}`, pts: countryScore });
    }
  }

  return { score: Math.min(Math.round(score), 100), breakdown };
}

// ─── GET /api/match/products  (importer sees matched products) ─────────────────
router.get('/products', protect, async (req, res) => {
  try {
    if (req.user.role !== 'importer') {
      return res.status(403).json({ success: false, message: 'Only importers can access product matches' });
    }

    // Load all active products with manufacturer profile
    const products = await Product.find({ isActive: true })
      .populate('manufacturer', 'name company country manufacturerProfile')
      .limit(100);

    // Build learned profile from past RFQ history
    const learnedProfile = await buildImporterProfile(req.user._id);

    // Score each product
    const scored = products.map(p => {
      const { score, breakdown } = scoreProductForImporter(p, req.user, learnedProfile);
      return { ...p.toObject(), matchScore: score, matchBreakdown: breakdown };
    });

    // Sort by score descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Attach profile maturity metadata
    res.json({
      success: true,
      meta: {
        totalRFQs:       learnedProfile.rfqCount,
        profileMaturity: learnedProfile.rfqCount === 0 ? 'new'
                       : learnedProfile.rfqCount < 5   ? 'learning'
                       : 'calibrated',
        note: learnedProfile.rfqCount === 0
          ? 'Matches are based on your registration profile. Send RFQs to improve recommendations.'
          : `Recommendations calibrated from ${learnedProfile.rfqCount} past RFQs.`,
      },
      data: scored.slice(0, 20)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/match/importers  (manufacturer sees matched importers) ────────────
router.get('/importers', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manufacturer') {
      return res.status(403).json({ success: false, message: 'Only manufacturers can access importer matches' });
    }

    // This manufacturer's product footprint
    const ownProducts = await Product.find({ manufacturer: req.user._id, isActive: true });
    if (!ownProducts.length) {
      return res.json({ success: true, meta: { note: 'Add products first to receive importer matches.' }, data: [] });
    }

    const mfgCategories = [...new Set(ownProducts.map(p => p.category))];
    const mfgCerts      = [...new Set(ownProducts.flatMap(p => p.certifications || []))];

    // Build learned profile
    const learnedProfile = await buildManufacturerProfile(req.user._id);

    // Load importers
    const importers = await User.find({ role: 'importer', isActive: true }).select('-password');

    // Score each importer
    const scored = importers.map(imp => {
      const { score, breakdown } = scoreImporterForManufacturer(imp, mfgCategories, mfgCerts, learnedProfile);
      return { ...imp.toObject(), matchScore: score, matchBreakdown: breakdown };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      meta: {
        totalRFQs:       learnedProfile.rfqCount,
        profileMaturity: learnedProfile.rfqCount === 0 ? 'new'
                       : learnedProfile.rfqCount < 5   ? 'learning'
                       : 'calibrated',
        note: learnedProfile.rfqCount === 0
          ? 'Matches based on product categories. Receive RFQs to improve recommendations.'
          : `Calibrated from ${learnedProfile.rfqCount} received RFQs.`,
      },
      data: scored.slice(0, 15)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/match/similar/:productId  (unchanged, kept) ──────────────────────
router.get('/similar/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const similar = await Product.find({
      _id:      { $ne: product._id },
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

// ─── GET /api/match/insights  (why you got these matches — debug/display) ───────
router.get('/insights', protect, async (req, res) => {
  try {
    if (req.user.role === 'importer') {
      const p = await buildImporterProfile(req.user._id);
      res.json({
        success: true,
        data: {
          rfqCount:       p.rfqCount,
          topCategories:  Object.entries(p.categoryFreq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,w])=>({ cat, weight: Math.round(w*10)/10 })),
          topSuppliers:   Object.entries(p.mfgFreq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,w])=>({ id, weight: Math.round(w*10)/10 })),
          certsDemanded:  Object.entries(p.certsDemanded).sort((a,b)=>b[1]-a[1]).map(([c,w])=>({ cert:c, weight: Math.round(w*10)/10 })),
          totalVolume:    p.totalVolume,
        }
      });
    } else if (req.user.role === 'manufacturer') {
      const p = await buildManufacturerProfile(req.user._id);
      res.json({
        success: true,
        data: {
          rfqCount:         p.rfqCount,
          topCategories:    Object.entries(p.categoryFreq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat,w])=>({ cat, weight: Math.round(w*10)/10 })),
          topCountries:     Object.entries(p.importerCountries).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([c,w])=>({ country:c, weight: Math.round(w*10)/10 })),
          positiveImporters:p.positiveImporters.size,
          totalVolume:      p.totalVolume,
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;