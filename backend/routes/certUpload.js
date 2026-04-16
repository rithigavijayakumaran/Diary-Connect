/**
 * routes/certUpload.js  — mounted at /api/certs
 * Allows manufacturers to upload cert documents without admin guard.
 */
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const upload  = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const VALID_TYPES = ['FSSAI', 'APEDA', 'ISO_9001', 'ISO_22000', 'HALAL', 'KOSHER', 'ORGANIC', 'FDA'];

// POST /api/certs/upload
router.post('/upload', protect, authorize('manufacturer'), upload.single('certFile'), async (req, res) => {
  try {
    const { certType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!VALID_TYPES.includes(certType))
      return res.status(400).json({ success: false, message: 'Invalid certificate type' });

    const user = await User.findById(req.user._id);
    // Remove existing pending/rejected doc of same type
    user.certDocuments = user.certDocuments.filter(
      c => !(c.type === certType && c.status !== 'approved')
    );
    user.certDocuments.push({
      type:       certType,
      fileUrl:    `/uploads/certs/${req.file.filename}`,
      fileName:   req.file.originalname,
      status:     'pending',
      uploadedAt: new Date(),
    });
    if (!user.onboarding) user.onboarding = {};
    user.onboarding.certsUploaded = true;
    await user.save();

    res.json({ success: true, message: 'Certificate submitted for review', data: user.certDocuments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
