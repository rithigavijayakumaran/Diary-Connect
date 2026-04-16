const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const Product  = require('../models/Product');
const RFQ      = require('../models/RFQ');
const Dispute  = require('../models/Dispute');
const upload   = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// ════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, manufacturers, importers,
      totalProducts, activeProducts,
      totalRFQs, pendingRFQs, acceptedRFQs,
      pendingCerts, openDisputes,
      unverifiedManufacturers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'manufacturer' }),
      User.countDocuments({ role: 'importer' }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      RFQ.countDocuments(),
      RFQ.countDocuments({ status: 'pending' }),
      RFQ.countDocuments({ status: 'accepted' }),
      // Certs awaiting admin review
      User.countDocuments({ 'certDocuments.status': 'pending' }),
      Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } }),
      User.countDocuments({ role: 'manufacturer', isVerified: false }),
    ]);

    // Subscription breakdown
    const subBreakdown = await User.aggregate([
      { $match: { role: 'manufacturer' } },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, manufacturers, importers, unverifiedManufacturers },
        products: { total: totalProducts, active: activeProducts },
        rfqs: { total: totalRFQs, pending: pendingRFQs, accepted: acceptedRFQs },
        pendingCertReviews: pendingCerts,
        openDisputes,
        subscriptions: subBreakdown,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ════════════════════════════════════════════════════════════════
router.get('/users', async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role)     query.role = role;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (search)   query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Manufacturer verified', data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/unverify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'User deactivated', data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// CERTIFICATE VERIFICATION
// ════════════════════════════════════════════════════════════════

// GET all manufacturers with pending cert docs
router.get('/certs/pending', async (req, res) => {
  try {
    const users = await User.find({
      role: 'manufacturer',
      'certDocuments.status': 'pending',
    }).select('-password');

    // Flatten to a list of { user, cert } pairs for easy rendering
    const pending = [];
    users.forEach(u => {
      (u.certDocuments || []).forEach(cert => {
        if (cert.status === 'pending') {
          pending.push({
            userId:      u._id,
            userName:    u.name,
            userCompany: u.company,
            userCountry: u.country,
            userVerified:u.isVerified,
            cert,
          });
        }
      });
    });

    res.json({ success: true, count: pending.length, data: pending });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET all cert docs for a specific manufacturer
router.get('/certs/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user, certDocuments: user.certDocuments || [] } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT approve a single cert document
router.put('/certs/:userId/:certId/approve', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cert = user.certDocuments.id(req.params.certId);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    cert.status     = 'approved';
    cert.adminNote  = adminNote || 'Certificate verified and approved';
    cert.reviewedAt = new Date();
    cert.reviewedBy = req.user._id;

    // Add to the manufacturer's verified certifications list if not already there
    if (!user.manufacturerProfile.certifications.includes(cert.type)) {
      user.manufacturerProfile.certifications.push(cert.type);
    }

    // Auto-verify the manufacturer if at least 1 cert is approved
    const approvedCount = user.certDocuments.filter(c => c.status === 'approved').length;
    if (approvedCount >= 1) user.isVerified = true;

    await user.save();
    res.json({ success: true, message: `${cert.type} approved`, data: user.certDocuments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT reject a single cert document
router.put('/certs/:userId/:certId/reject', async (req, res) => {
  try {
    const { adminNote } = req.body;
    if (!adminNote) return res.status(400).json({ success: false, message: 'Rejection reason required' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const cert = user.certDocuments.id(req.params.certId);
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    cert.status     = 'rejected';
    cert.adminNote  = adminNote;
    cert.reviewedAt = new Date();
    cert.reviewedBy = req.user._id;

    // Remove from approved certifications list if it was there
    user.manufacturerProfile.certifications = user.manufacturerProfile.certifications
      .filter(c => c !== cert.type);

    await user.save();
    res.json({ success: true, message: `${cert.type} rejected`, data: user.certDocuments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// MANUFACTURER: UPLOAD CERT DOCS (called from manufacturer side)
// ════════════════════════════════════════════════════════════════
// Note: this route is on /api/admin but called by manufacturers
// Re-export under a manufacturer route if preferred
router.post('/certs/upload', protect, authorize('manufacturer'), upload.single('certFile'), async (req, res) => {
  try {
    const { certType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const VALID_TYPES = ['FSSAI','APEDA','ISO_9001','ISO_22000','HALAL','KOSHER','ORGANIC','FDA'];
    if (!VALID_TYPES.includes(certType)) {
      return res.status(400).json({ success: false, message: 'Invalid certificate type' });
    }

    const user = await User.findById(req.user._id);

    // Remove any existing pending/rejected doc of same type (allow re-upload)
    user.certDocuments = user.certDocuments.filter(
      c => !(c.type === certType && c.status !== 'approved')
    );

    user.certDocuments.push({
      type:      certType,
      fileUrl:   `/uploads/certs/${req.file.filename}`,
      fileName:  req.file.originalname,
      status:    'pending',
      uploadedAt:new Date(),
    });

    user.onboarding = user.onboarding || {};
    user.onboarding.certsUploaded = true;
    await user.save();

    res.json({ success: true, message: 'Certificate submitted for review', data: user.certDocuments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// DISPUTE MANAGEMENT
// ════════════════════════════════════════════════════════════════

// GET all disputes
router.get('/disputes', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const total = await Dispute.countDocuments(query);
    const disputes = await Dispute.find(query)
      .populate('raisedBy',    'name company country role')
      .populate('againstUser', 'name company country role')
      .populate('rfq',         'title productCategory status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, data: disputes });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single dispute
router.get('/disputes/:id', async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('raisedBy',    'name company country email phone role')
      .populate('againstUser', 'name company country email phone role')
      .populate('rfq')
      .populate('adminNotes.admin', 'name');
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, data: dispute });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT add admin note to dispute
router.put('/disputes/:id/note', async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note is required' });
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { $push: { adminNotes: { admin: req.user._id, note } }, status: 'under_review' },
      { new: true }
    ).populate('adminNotes.admin', 'name');
    res.json({ success: true, data: dispute });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT resolve dispute
router.put('/disputes/:id/resolve', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const validResolutions = ['resolved_favour_raiser', 'resolved_favour_defendant', 'dismissed'];
    if (!validResolutions.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid resolution status' });
    }
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, resolution, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, message: 'Dispute resolved', data: dispute });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// User-facing dispute routes moved to rfq.js to bypass global admin authorize guard.

// ════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT
// ════════════════════════════════════════════════════════════════
const PLAN_LIMITS = {
  free:       { products: 3,   rfqsPerMonth: 5,   featuredProducts: 0, premiumLeads: false },
  basic:      { products: 20,  rfqsPerMonth: 50,  featuredProducts: 2, premiumLeads: false },
  premium:    { products: 100, rfqsPerMonth: 200, featuredProducts: 10, premiumLeads: true  },
  enterprise: { products: 999, rfqsPerMonth: 999, featuredProducts: 50, premiumLeads: true  },
};

router.put('/users/:id/subscription', async (req, res) => {
  try {
    const { plan, durationDays = 30 } = req.body;
    if (!PLAN_LIMITS[plan]) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const now      = new Date();
    const endDate  = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        'subscription.plan':       plan,
        'subscription.status':     'active',
        'subscription.startDate':  now,
        'subscription.endDate':    endDate,
        'subscription.assignedBy': req.user._id,
        'subscription.assignedAt': now,
      },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `Plan upgraded to ${plan}`, data: user, limits: PLAN_LIMITS[plan] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET plan limits (public — used by frontend to show feature gates)
router.get('/plans', async (req, res) => {
  res.json({ success: true, data: PLAN_LIMITS });
});

// PUT assign premium leads to importer
router.put('/users/:id/premium-leads', async (req, res) => {
  try {
    const { durationDays = 30 } = req.body;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        'premiumLeads.isActive':   true,
        'premiumLeads.expiresAt':  expiresAt,
        'premiumLeads.assignedBy': req.user._id,
        'premiumLeads.assignedAt': new Date(),
      },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'Premium leads activated', data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ONBOARDING CHECKLIST (admin view)
// ════════════════════════════════════════════════════════════════
router.get('/onboarding/incomplete', async (req, res) => {
  try {
    const { role } = req.query;
    const query = { 'onboarding.profileComplete': false };
    if (role) query.role = role;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// EXISTING ROUTES (kept)
// ════════════════════════════════════════════════════════════════
router.get('/rfqs', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await RFQ.countDocuments(query);
    const rfqs  = await RFQ.find(query)
      .populate('importer',     'name company country')
      .populate('manufacturer', 'name company country')
      .populate('product',      'name category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, data: rfqs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted by admin' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;