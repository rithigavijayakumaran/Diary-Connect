const express = require('express');
const router = express.Router();

// Regulatory requirements database
const regulatoryData = {
  UAE: {
    name: 'UAE / GCC',
    flag: '🇦🇪',
    requirements: [
      { cert: 'HALAL', required: true, authority: 'UAE ESMA / ESMA-recognized bodies', description: 'Mandatory for all dairy products' },
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Indian export license required' },
      { cert: 'APEDA', required: true, authority: 'APEDA India', description: 'Agricultural export registration' },
      { cert: 'COA', required: true, authority: 'Accredited Lab', description: 'Certificate of Analysis for each shipment' }
    ],
    importDuty: '5%',
    restrictions: ['Products must meet UAE.S 2055-1 Halal standard', 'Arabic labelling required'],
    processingTime: '15-20 working days',
    notes: 'UAE is India\'s largest dairy export destination. Strong demand for ghee and milk powder.'
  },
  EU: {
    name: 'European Union',
    flag: '🇪🇺',
    requirements: [
      { cert: 'ISO_22000', required: true, authority: 'Accredited CB', description: 'Food safety management system' },
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Indian export certification' },
      { cert: 'EU_HEALTH_CERT', required: true, authority: 'Indian vet authority', description: 'Veterinary health certificate' },
      { cert: 'COA', required: true, authority: 'Accredited Lab', description: 'Pesticide residue & contaminant tests' }
    ],
    importDuty: '17.5% avg',
    restrictions: ['Must meet EC 853/2004 hygiene regulations', 'Cold chain documentation mandatory', 'Establishment approval required'],
    processingTime: '30-45 working days',
    notes: 'EU market requires establishment approval. High standards but premium pricing.'
  },
  USA: {
    name: 'United States',
    flag: '🇺🇸',
    requirements: [
      { cert: 'FDA', required: true, authority: 'US FDA', description: 'FDA registration for food facility' },
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Export license' },
      { cert: 'FSMA', required: true, authority: 'FDA', description: 'Food Safety Modernization Act compliance' },
      { cert: 'COA', required: true, authority: 'FDA-recognized lab', description: 'Lab analysis certificate' }
    ],
    importDuty: '10-20%',
    restrictions: ['Prior Notice required for every shipment', 'FDA import alert compliance', 'PCQI trained personnel required'],
    processingTime: '30-60 working days',
    notes: 'Growing market for specialty dairy. Whey protein and ghee in high demand.'
  },
  JAPAN: {
    name: 'Japan',
    flag: '🇯🇵',
    requirements: [
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Export certification' },
      { cert: 'ISO_22000', required: true, authority: 'Accredited CB', description: 'Food safety management' },
      { cert: 'JAS', required: false, authority: 'MAFF Japan', description: 'Japanese Agricultural Standard (optional but preferred)' },
      { cert: 'COA', required: true, authority: 'Accredited Lab', description: 'Detailed compositional analysis' }
    ],
    importDuty: '25.5% for butter, 0% for casein',
    restrictions: ['Strict additive regulations', 'Detailed Japanese labelling required', 'High microbiological standards'],
    processingTime: '20-30 working days',
    notes: 'Premium market with strict standards. Casein and specialty proteins have good potential.'
  },
  NIGERIA: {
    name: 'Nigeria / West Africa',
    flag: '🇳🇬',
    requirements: [
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Indian export license' },
      { cert: 'NAFDAC', required: true, authority: 'NAFDAC Nigeria', description: 'Nigerian product registration' },
      { cert: 'HALAL', required: false, authority: 'Recognized body', description: 'Preferred for Muslim-majority regions' },
      { cert: 'COA', required: true, authority: 'Accredited Lab', description: 'Certificate of analysis' }
    ],
    importDuty: '5-20%',
    restrictions: ['NAFDAC registration can take 3-6 months first time', 'Shelf life min 2/3 of total must remain on arrival'],
    processingTime: '20-40 working days',
    notes: 'Fastest growing dairy import market. Strong demand for SMP and butter oil.'
  },
  SAUDI: {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    requirements: [
      { cert: 'HALAL', required: true, authority: 'SASO-approved bodies', description: 'Mandatory Halal certification' },
      { cert: 'FSSAI', required: true, authority: 'FSSAI India', description: 'Export license' },
      { cert: 'APEDA', required: true, authority: 'APEDA', description: 'Export registration' },
      { cert: 'SASO', required: true, authority: 'SASO Saudi Arabia', description: 'Saudi Standards compliance' }
    ],
    importDuty: '5% (GCC unified)',
    restrictions: ['Must meet GSO standards', 'Arabic labelling mandatory', 'Shelf life minimum 6 months on arrival'],
    processingTime: '15-25 working days',
    notes: 'Large market for ghee, SMP, and infant formula ingredients.'
  }
};

// @GET /api/compliance/markets - list all markets
router.get('/markets', (req, res) => {
  const markets = Object.entries(regulatoryData).map(([code, data]) => ({
    code,
    name: data.name,
    flag: data.flag,
    importDuty: data.importDuty,
    processingTime: data.processingTime
  }));
  res.json({ success: true, data: markets });
});

// @GET /api/compliance/:market - get full requirements for a market
router.get('/:market', (req, res) => {
  const market = req.params.market.toUpperCase();
  const data = regulatoryData[market];
  if (!data) return res.status(404).json({ success: false, message: 'Market not found' });
  res.json({ success: true, data: { code: market, ...data } });
});

// @POST /api/compliance/check - check if manufacturer meets market requirements
router.post('/check', (req, res) => {
  try {
    const { market, certifications } = req.body;
    const marketData = regulatoryData[market.toUpperCase()];
    if (!marketData) return res.status(404).json({ success: false, message: 'Market not found' });

    const results = marketData.requirements.map(req => ({
      ...req,
      status: !req.required ? 'optional' : certifications?.includes(req.cert) ? 'met' : 'missing'
    }));

    const missing = results.filter(r => r.status === 'missing');
    const readyToExport = missing.length === 0;

    res.json({
      success: true,
      data: {
        market: marketData.name,
        readyToExport,
        score: Math.round(((results.filter(r => r.status === 'met').length) / results.filter(r => r.required).length) * 100),
        requirements: results,
        missingCount: missing.length,
        notes: marketData.notes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
