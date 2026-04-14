const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const RFQ = require('./models/RFQ');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await Product.deleteMany({});
  await RFQ.deleteMany({});

  const password = await bcrypt.hash('password123', 12);

  // Manufacturers
  const manufacturers = await User.insertMany([
    {
      name: 'Rajesh Kumar', email: 'rajesh@amuldairy.demo', password,
      role: 'manufacturer', company: 'Amul Dairy Exports', country: 'India',
      phone: '+91-9876543210', isVerified: true,
      manufacturerProfile: {
        state: 'Gujarat', certifications: ['FSSAI', 'APEDA', 'ISO_22000', 'HALAL'],
        establishedYear: 1995, annualCapacity: '50,000 MT/year',
        exportCountries: ['UAE', 'Saudi Arabia', 'USA', 'UK'],
        description: 'Leading dairy exporter from Gujarat with 28 years of experience in ghee, butter and milk powder exports.',
        rating: 4.8, totalReviews: 124, coldChainAvailable: true
      }
    },
    {
      name: 'Priya Sharma', email: 'priya@heritagedairy.demo', password,
      role: 'manufacturer', company: 'Heritage Dairy Products', country: 'India',
      phone: '+91-9988776655', isVerified: true,
      manufacturerProfile: {
        state: 'Andhra Pradesh', certifications: ['FSSAI', 'APEDA', 'ISO_9001', 'HALAL', 'KOSHER'],
        establishedYear: 2001, annualCapacity: '20,000 MT/year',
        exportCountries: ['UAE', 'Israel', 'USA'],
        description: 'Premium dairy manufacturer specializing in cheese, paneer and yogurt for international markets.',
        rating: 4.5, totalReviews: 87, coldChainAvailable: true
      }
    },
    {
      name: 'Suresh Patel', email: 'suresh@nationalwhey.demo', password,
      role: 'manufacturer', company: 'National Whey Proteins', country: 'India',
      phone: '+91-9123456789', isVerified: true,
      manufacturerProfile: {
        state: 'Maharashtra', certifications: ['FSSAI', 'APEDA', 'ISO_22000', 'FDA', 'ORGANIC'],
        establishedYear: 2008, annualCapacity: '8,000 MT/year',
        exportCountries: ['USA', 'EU', 'Japan'],
        description: 'Specialized in whey protein concentrate and isolates for health food and sports nutrition sectors.',
        rating: 4.7, totalReviews: 203, coldChainAvailable: false
      }
    },
    {
      name: 'Meera Nair', email: 'meera@keralacheese.demo', password,
      role: 'manufacturer', company: 'Kerala Dairy Co-op', country: 'India',
      phone: '+91-9456789012', isVerified: false,
      manufacturerProfile: {
        state: 'Kerala', certifications: ['FSSAI', 'APEDA', 'ORGANIC'],
        establishedYear: 1989, annualCapacity: '3,000 MT/year',
        exportCountries: ['UAE', 'UK'],
        description: 'Organic certified dairy from God\'s Own Country. Specializing in traditional Kerala dairy products.',
        rating: 4.2, totalReviews: 45, coldChainAvailable: true
      }
    },
    {
      name: 'Simranjeet Singh', email: 'simran@punjabfields.demo', password,
      role: 'manufacturer', company: 'Punjab Fields Foods', country: 'India',
      phone: '+91-9234567891', isVerified: true,
      manufacturerProfile: {
        state: 'Punjab', certifications: ['FSSAI', 'FDA', 'HALAL'],
        establishedYear: 2012, annualCapacity: '12,000 MT/year',
        exportCountries: ['Canada', 'USA', 'UK'],
        description: 'Specialized in traditional North Indian dairy like pure desi ghee and paneer for the diaspora market.',
        rating: 4.6, totalReviews: 88, coldChainAvailable: true
      }
    },
    {
      name: 'Ravi Teja', email: 'ravi@deccandairy.demo', password,
      role: 'manufacturer', company: 'Deccan Dairy Co.', country: 'India',
      phone: '+91-9345678912', isVerified: true,
      manufacturerProfile: {
        state: 'Karnataka', certifications: ['FSSAI', 'ISO_22000'],
        establishedYear: 2005, annualCapacity: '18,000 MT/year',
        exportCountries: ['UAE', 'Singapore', 'Malaysia'],
        description: 'Exporting premium skimmed milk powder and UHT milk to South-East Asia and the Middle East.',
        rating: 4.4, totalReviews: 56, coldChainAvailable: false
      }
    },
    {
      name: 'Arun M', email: 'arun@maduraimilk.demo', password,
      role: 'manufacturer', company: 'Madurai Milk Products', country: 'India',
      phone: '+91-9876543222', isVerified: false,
      manufacturerProfile: {
        state: 'Tamil Nadu', certifications: ['FSSAI'],
        establishedYear: 2018, annualCapacity: '5,000 MT/year',
        exportCountries: ['Sri Lanka', 'UAE'],
        description: 'Growing manufacturer focusing on high quality butter and whole milk powder.',
        rating: 4.1, totalReviews: 24, coldChainAvailable: true
      }
    }
  ]);

  // Importers
  const importers = await User.insertMany([
    {
      name: 'Ahmed Al-Rashid', email: 'ahmed@gulffoods.demo', password,
      role: 'importer', company: 'Gulf Foods Trading LLC', country: 'UAE',
      phone: '+971-50-1234567', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia', 'Oceania'],
        preferredCategories: ['Ghee', 'Skimmed Milk Powder', 'Butter'],
        annualImportVolume: '2,000 MT/year',
        regulatoryMarkets: ['GCC']
      }
    },
    {
      name: 'Hans Mueller', email: 'hans@europeanfoods.demo', password,
      role: 'importer', company: 'European Dairy Imports GmbH', country: 'Germany',
      phone: '+49-30-98765432', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia'],
        preferredCategories: ['Whey Protein', 'Casein', 'Skimmed Milk Powder'],
        annualImportVolume: '5,000 MT/year',
        regulatoryMarkets: ['EU']
      }
    },
    {
      name: 'Amara Diallo', email: 'amara@africamarts.demo', password,
      role: 'importer', company: 'AfricaMart Foods', country: 'Nigeria',
      phone: '+234-803-1234567', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia', 'Europe'],
        preferredCategories: ['Skimmed Milk Powder', 'Whole Milk Powder', 'Butter'],
        annualImportVolume: '1,000 MT/year',
        regulatoryMarkets: ['GCC']
      }
    },
    {
      name: 'Kenji Tanaka', email: 'kenji@japanfoods.demo', password,
      role: 'importer', company: 'Nippon Dairy Imports', country: 'Japan',
      phone: '+81-3-12345678', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia', 'Oceania'],
        preferredCategories: ['Whey Protein', 'Casein', 'Cheese'],
        annualImportVolume: '800 MT/year',
        regulatoryMarkets: ['FDA']
      }
    },
    {
      name: 'Maria Garcia', email: 'maria@latamfoods.demo', password,
      role: 'importer', company: 'LatAm Dairy Imports', country: 'Brazil',
      phone: '+55-11-98765432', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia', 'Europe'],
        preferredCategories: ['Cheese', 'Whey Protein'],
        annualImportVolume: '3,000 MT/year',
        regulatoryMarkets: ['Mercosur']
      }
    },
    {
      name: 'David Chen', email: 'david@asianmarts.demo', password,
      role: 'importer', company: 'Asian Marts Group', country: 'Singapore',
      phone: '+65-91234567', isVerified: true,
      importerProfile: {
        importRegions: ['South Asia', 'Oceania'],
        preferredCategories: ['Ghee', 'UHT Milk', 'Butter'],
        annualImportVolume: '4,500 MT/year',
        regulatoryMarkets: ['SFA']
      }
    }
  ]);

  // Products
  const products = await Product.insertMany([
    {
      manufacturer: manufacturers[0]._id, name: 'Pure Cow Ghee - Export Grade',
      category: 'Ghee', description: 'Premium clarified butter made from 100% cow milk. Traditional slow-fire churning process. Ideal for GCC and Southeast Asian markets.',
      specifications: { fatContent: '99.7% min', moistureContent: '0.1% max', shelfLife: '24 months', storageTemp: 'Ambient (below 30°C)', packagingFormats: ['500ml glass jars', '15kg tins', '200kg drums'], grade: 'Export Grade A' },
      pricing: { basePrice: 2800, currency: 'USD', unit: 'MT', moq: 5, moqUnit: 'MT' },
      certifications: ['FSSAI', 'APEDA', 'HALAL', 'ISO_22000'],
      targetMarkets: ['UAE', 'Saudi Arabia', 'Kuwait', 'UK'],
      originState: 'Gujarat', coldChainRequired: false, views: 342, inquiries: 28
    },
    {
      manufacturer: manufacturers[0]._id, name: 'Skimmed Milk Powder - Extra Grade',
      category: 'Skimmed Milk Powder', description: 'High-quality SMP with consistent composition. Suitable for recombining, confectionery and bakery applications.',
      specifications: { fatContent: '1% max', moistureContent: '4% max', proteinContent: '34% min', shelfLife: '24 months', storageTemp: 'Cool, dry place', packagingFormats: ['25kg multi-wall bags', '1MT bulk bags'] },
      pricing: { basePrice: 2200, currency: 'USD', unit: 'MT', moq: 10, moqUnit: 'MT' },
      certifications: ['FSSAI', 'APEDA', 'HALAL', 'ISO_22000'],
      targetMarkets: ['Nigeria', 'UAE', 'Bangladesh'],
      originState: 'Gujarat', coldChainRequired: false, views: 567, inquiries: 45
    },
    {
      manufacturer: manufacturers[1]._id, name: 'Processed Cheddar Cheese - Export',
      category: 'Cheese', description: 'Matured cheddar cheese with rich flavour profile. Kosher and Halal certified for international retail and food service.',
      specifications: { fatContent: '32% min (dry basis)', moistureContent: '39% max', shelfLife: '12 months', storageTemp: '0-4°C', packagingFormats: ['2kg blocks', '5kg blocks', '20kg blocks'] },
      pricing: { basePrice: 4500, currency: 'USD', unit: 'MT', moq: 2, moqUnit: 'MT' },
      certifications: ['FSSAI', 'HALAL', 'KOSHER', 'ISO_9001'],
      targetMarkets: ['UAE', 'Israel', 'USA'],
      originState: 'Andhra Pradesh', coldChainRequired: true, views: 234, inquiries: 19
    },
    {
      manufacturer: manufacturers[2]._id, name: 'Whey Protein Concentrate 80%',
      category: 'Whey Protein', description: 'Pharmaceutical and food-grade WPC80 with excellent solubility and clean taste. Widely used in sports nutrition, infant formula and functional foods.',
      specifications: { proteinContent: '80% min (dry basis)', moistureContent: '5% max', fatContent: '5-8%', shelfLife: '18 months', storageTemp: 'Cool, dry, below 25°C', packagingFormats: ['25kg bags', '500g retail packs (private label)'] },
      pricing: { basePrice: 7500, currency: 'USD', unit: 'MT', moq: 1, moqUnit: 'MT' },
      certifications: ['FSSAI', 'APEDA', 'FDA', 'ISO_22000', 'ORGANIC'],
      targetMarkets: ['USA', 'Germany', 'Japan', 'Australia'],
      originState: 'Maharashtra', coldChainRequired: false, views: 891, inquiries: 73
    },
    {
      manufacturer: manufacturers[2]._id, name: 'Casein Micellar - Food Grade',
      category: 'Casein', description: 'Native micellar casein produced via microfiltration. Superior water-holding and textural properties for cheese analogues and high-protein foods.',
      specifications: { proteinContent: '85% min', moistureContent: '6% max', shelfLife: '24 months', storageTemp: 'Ambient', packagingFormats: ['25kg paper bags'] },
      pricing: { basePrice: 9000, currency: 'USD', unit: 'MT', moq: 1, moqUnit: 'MT' },
      certifications: ['FSSAI', 'FDA', 'ISO_22000'],
      targetMarkets: ['USA', 'EU', 'Japan'],
      originState: 'Maharashtra', coldChainRequired: false, views: 445, inquiries: 38
    },
    {
      manufacturer: manufacturers[3]._id, name: 'Organic Whole Milk Powder',
      category: 'Whole Milk Powder', description: 'Certified organic WMP from pasture-fed cows in Kerala. No additives, preservatives or synthetic hormones.',
      specifications: { fatContent: '26% min', moistureContent: '3.5% max', proteinContent: '25% min', shelfLife: '18 months', storageTemp: 'Cool, dry', packagingFormats: ['25kg bags', '1MT jumbo bags'] },
      pricing: { basePrice: 3800, currency: 'USD', unit: 'MT', moq: 3, moqUnit: 'MT' },
      certifications: ['FSSAI', 'APEDA', 'ORGANIC'],
      targetMarkets: ['Germany', 'UK', 'UAE'],
      originState: 'Kerala', coldChainRequired: false, views: 178, inquiries: 12
    },
    {
      manufacturer: manufacturers[4]._id, name: 'Premium Desi Ghee - Tin Pack',
      category: 'Ghee', description: 'Authentic granular cow ghee packed in food-grade tins. Long shelf life.',
      specifications: { fatContent: '99.5% min', moistureContent: '0.2% max', shelfLife: '18 months', storageTemp: 'Ambient', packagingFormats: ['1kg tin', '5kg tin'] },
      pricing: { basePrice: 3200, currency: 'USD', unit: 'MT', moq: 2, moqUnit: 'MT' },
      certifications: ['FSSAI', 'FDA'],
      targetMarkets: ['Canada', 'USA'],
      originState: 'Punjab', coldChainRequired: false, views: 612, inquiries: 54
    },
    {
      manufacturer: manufacturers[5]._id, name: 'UHT Whole Milk - 1L Tetra',
      category: 'UHT Milk', description: 'Ultra-high temperature processed whole milk with 3.5% fat. Excellent for retail.',
      specifications: { fatContent: '3.5%', shelfLife: '9 months', storageTemp: 'Ambient', packagingFormats: ['1L Tetra Brik', '24 pack carton'] },
      pricing: { basePrice: 850, currency: 'USD', unit: 'MT', moq: 20, moqUnit: 'MT' },
      certifications: ['FSSAI', 'ISO_22000'],
      targetMarkets: ['Singapore', 'Malaysia', 'UAE'],
      originState: 'Karnataka', coldChainRequired: false, views: 423, inquiries: 16
    },
    {
      manufacturer: manufacturers[6]._id, name: 'Salted Lactic Butter',
      category: 'Butter', description: 'Traditional lactic butter with 80% fat and 2% salt.',
      specifications: { fatContent: '80% min', moistureContent: '16% max', shelfLife: '12 months (frozen)', storageTemp: '-18°C', packagingFormats: ['25kg block'] },
      pricing: { basePrice: 4100, currency: 'USD', unit: 'MT', moq: 1, moqUnit: 'MT' },
      certifications: ['FSSAI'],
      targetMarkets: ['UAE'],
      originState: 'Tamil Nadu', coldChainRequired: true, views: 189, inquiries: 8
    },
    ...Array.from({ length: 15 }).map((_, i) => ({
      manufacturer: manufacturers[0]._id, name: `Amul Premium Export Grade ${i+1}`,
      category: ['Ghee', 'Butter', 'Cheese', 'Skimmed Milk Powder', 'Whole Milk Powder'][i%5],
      description: `High quality dairy product variant ${i+1} tailored for the Middle Eastern and Asian markets.`,
      specifications: { fatContent: 'Standard', moistureContent: 'Standard', shelfLife: '12-24 months', storageTemp: 'Ambient/Chilled', packagingFormats: ['Bulk', 'Retail'] },
      pricing: { basePrice: 2500 + (i*50), currency: 'USD', unit: 'MT', moq: 1 + (i%3), moqUnit: 'MT' },
      certifications: ['FSSAI', 'HALAL', 'APEDA'],
      targetMarkets: ['UAE', 'Saudi Arabia', 'Qatar', 'Oman'],
      originState: 'Gujarat', coldChainRequired: (i%2===0), views: 200 + (Math.floor(Math.random()*500)), inquiries: 10 + (Math.floor(Math.random()*50))
    }))
  ]);

  // RFQs
  await RFQ.insertMany([
    {
      importer: importers[0]._id, manufacturer: manufacturers[0]._id, product: products[0]._id,
      title: 'Ghee - 20 MT Monthly Contract Inquiry', productCategory: 'Ghee',
      quantity: 20, quantityUnit: 'MT', targetPrice: 2600, currency: 'USD',
      deliveryPort: 'Jebel Ali, Dubai', paymentTerms: 'LC at sight',
      specialRequirements: 'Halal certificate from ESMA-approved body required. Arabic labelling needed.',
      certificationRequired: ['HALAL', 'FSSAI'],
      status: 'quoted',
      quotations: [{ price: 2750, currency: 'USD', validUntil: new Date('2024-12-31'), notes: 'Price includes packaging in 500ml jars. Delivery 3 weeks from LC opening.' }]
    },
    {
      importer: importers[1]._id, manufacturer: manufacturers[2]._id, product: products[3]._id,
      title: 'WPC 80 - Annual Supply Contract', productCategory: 'Whey Protein',
      quantity: 50, quantityUnit: 'MT', targetPrice: 7000, currency: 'USD',
      deliveryPort: 'Hamburg, Germany', paymentTerms: 'T/T 30 days',
      specialRequirements: 'EU food grade certification, complete CoA for each batch, pesticide residue test.',
      certificationRequired: ['FDA', 'ISO_22000'],
      status: 'negotiating'
    },
    {
      importer: importers[2]._id, manufacturer: manufacturers[0]._id, product: products[1]._id,
      title: 'SMP 25 MT Immediate Shipment', productCategory: 'Skimmed Milk Powder',
      quantity: 25, quantityUnit: 'MT', targetPrice: 2100, currency: 'USD',
      deliveryPort: 'Lagos, Apapa Port', paymentTerms: 'LC 60 days',
      certificationRequired: ['FSSAI', 'APEDA'],
      status: 'pending'
    },
    {
      importer: importers[5]._id, manufacturer: manufacturers[4]._id, product: products[6]._id,
      title: 'Desi Ghee monthly shipment for Asian Supermarkets', productCategory: 'Ghee',
      quantity: 10, quantityUnit: 'MT', targetPrice: 3000, currency: 'USD',
      deliveryPort: 'Singapore Port', paymentTerms: 'T/T 15 days',
      specialRequirements: 'Retail packaging required. Singapore food agency compliance needed.',
      certificationRequired: ['FSSAI', 'HALAL'],
      status: 'accepted',
      quotations: [{ price: 3100, currency: 'USD', validUntil: new Date('2024-11-15'), notes: 'Agreed on 3100 USD/MT including retail packaging overheads.' }]
    },
    {
      importer: importers[4]._id, manufacturer: manufacturers[1]._id, product: products[2]._id,
      title: 'Cheddar Cheese Blocks continuous supply', productCategory: 'Cheese',
      quantity: 15, quantityUnit: 'MT', targetPrice: 4300, currency: 'USD',
      deliveryPort: 'Santos Port, Brazil', paymentTerms: 'LC at sight',
      certificationRequired: ['HALAL', 'ISO_9001'],
      status: 'quoted',
      quotations: [{ price: 4400, currency: 'USD', validUntil: new Date('2024-12-10'), notes: 'Refrigerated container costs included.' }]
    },
    ...Array.from({ length: 15 }).map((_, i) => ({
      importer: importers[0]._id, manufacturer: manufacturers[i%4]._id, product: products[i%6]._id,
      title: `Monthly requirement of ${['Ghee', 'Butter', 'Cheese', 'WMP', 'SMP'][i%5]} - Order #${i+1000}`, productCategory: ['Ghee', 'Butter', 'Cheese', 'Whole Milk Powder', 'Skimmed Milk Powder'][i%5],
      quantity: 15 + (i*5), quantityUnit: 'MT', targetPrice: 2000 + (i*100), currency: 'USD',
      deliveryPort: 'Jebel Ali, Dubai', paymentTerms: 'LC 30 days',
      specialRequirements: `Standard packaging required for order ${i+1}.`,
      certificationRequired: ['HALAL', 'FSSAI'],
      status: ['pending', 'quoted', 'negotiating', 'accepted', 'rejected'][i%5],
      quotations: i%5 === 1 ? [{ price: 2100 + (i*100), currency: 'USD', validUntil: new Date('2024-12-31'), notes: 'Included shipping.' }] : []
    }))
  ]);

  console.log('Database seeded successfully!');
  console.log('\nDemo accounts:');
  console.log('Manufacturer: rajesh@amuldairy.demo / password123');
  console.log('Importer: ahmed@gulffoods.demo / password123');
  console.log('Manufacturer: suresh@nationalwhey.demo / password123');
  console.log('Importer: hans@europeanfoods.demo / password123');

  mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
