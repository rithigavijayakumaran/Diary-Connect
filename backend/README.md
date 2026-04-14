# DairyBridge Backend — MERN Stack

> **S8 Final Year Project** | Online platform linking global dairy importers with Indian dairy manufacturers.

---

## Project Structure

```
backend/
├── server.js               ← Entry point
├── seed.js                 ← Demo data seeder
├── .env.example            ← Environment variable template
├── package.json
│
├── models/
│   ├── User.js             ← Manufacturer & Importer schemas
│   ├── Product.js          ← Product catalog schema
│   ├── RFQ.js              ← Request For Quotation schema
│   └── Message.js          ← Secure messaging schema
│
├── routes/
│   ├── auth.js             ← Register, Login, Profile, JWT
│   ├── products.js         ← Product CRUD + catalog search
│   ├── rfq.js              ← RFQ create, quote, negotiate
│   ├── messages.js         ← Secure messaging between users
│   ├── analytics.js        ← Dashboard stats & market data
│   ├── compliance.js       ← Regulatory Wizard (UAE, EU, USA, Japan, Nigeria)
│   ├── match.js            ← AI Matchmaking engine
│   └── admin.js            ← Admin panel routes
│
└── middleware/
    ├── auth.js             ← JWT protect + role authorize
    ├── upload.js           ← Multer file upload handler
    └── errorHandler.js     ← Global error middleware
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/dairybridge
JWT_SECRET=your_strong_secret_here
JWT_EXPIRE=7d
```

### 4. Seed demo data
```bash
npm run seed
```
This creates 4 manufacturers, 4 importers, 6 products, 3 RFQs.

### 5. Start server
```bash
npm run dev       # Development (nodemon, auto-restart)
npm start         # Production
```
Server runs at: **http://localhost:5000**

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Manufacturer | rajesh@amuldairy.demo | password123 |
| Manufacturer | suresh@nationalwhey.demo | password123 |
| Importer | ahmed@gulffoods.demo | password123 |
| Importer | hans@europeanfoods.demo | password123 |

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register manufacturer or importer |
| POST | `/login` | Public | Login, returns JWT token |
| GET | `/me` | Private | Get logged-in user profile |
| PUT | `/profile` | Private | Update profile |
| GET | `/manufacturers` | Public | List all verified manufacturers |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "importer",
  "company": "Gulf Foods LLC",
  "country": "UAE",
  "phone": "+971-50-1234567"
}
```

---

### Product Routes — `/api/products`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Browse catalog (filters: category, certification, price, search) |
| GET | `/:id` | Public | Product details (increments view count) |
| POST | `/` | Manufacturer | Create new product listing |
| PUT | `/:id` | Manufacturer | Update own product |
| DELETE | `/:id` | Manufacturer | Soft-delete product |
| GET | `/my/listings` | Manufacturer | Own product listings |

**Query params for GET /**
```
?category=Ghee
?certification=HALAL,ISO_22000
?minPrice=1000&maxPrice=5000
?search=milk powder
?coldChain=true
?page=1&limit=12
```

**Product categories:**
`Ghee | Skimmed Milk Powder | Whole Milk Powder | Butter | Cheese | Paneer | Whey Protein | Casein | UHT Milk | Condensed Milk | Lactose | Cream | Yogurt`

**Certifications:**
`FSSAI | APEDA | ISO_9001 | ISO_22000 | HALAL | KOSHER | ORGANIC | FDA`

---

### RFQ Routes — `/api/rfq`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Importer | Create new RFQ |
| GET | `/my` | Private | Get own RFQs |
| GET | `/:id` | Private | RFQ detail (auto-marks as viewed) |
| PUT | `/:id/quote` | Manufacturer | Submit quotation |
| PUT | `/:id/status` | Private | Update RFQ status |
| POST | `/:id/message` | Private | Add message to RFQ thread |
| GET | `/stats/overview` | Private | RFQ stats for dashboard |

**RFQ Status Flow:**
```
pending → viewed → quoted → negotiating → accepted / rejected → closed
```

**Create RFQ body:**
```json
{
  "manufacturer": "<manufacturer_id>",
  "title": "Ghee 20MT Monthly",
  "productCategory": "Ghee",
  "quantity": 20,
  "quantityUnit": "MT",
  "targetPrice": 2600,
  "currency": "USD",
  "deliveryPort": "Jebel Ali, Dubai",
  "paymentTerms": "LC at sight",
  "certificationRequired": ["HALAL", "FSSAI"]
}
```

---

### Messages — `/api/messages`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Send a message |
| GET | `/conversations` | Private | All conversations (grouped) |
| GET | `/:userId` | Private | Message thread with a user |

---

### Analytics — `/api/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Private | Role-specific dashboard stats |
| GET | `/market` | Public | Market-level data (category demand, state-wise, country-wise) |

**Manufacturer dashboard returns:**
- Total products, views, inquiries
- RFQ status counts
- Category breakdown
- Monthly RFQ trend (6 months)
- Top 5 importer countries

**Importer dashboard returns:**
- Total/pending/quoted/accepted RFQs
- Category breakdown of inquiries

---

### Compliance Wizard — `/api/compliance`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/markets` | Public | List all supported markets |
| GET | `/:market` | Public | Full requirements for a market |
| POST | `/check` | Public | Check if cert list meets market requirements |

**Supported markets:** `UAE | EU | USA | JAPAN | NIGERIA | SAUDI`

**POST /check body:**
```json
{
  "market": "UAE",
  "certifications": ["FSSAI", "APEDA", "HALAL"]
}
```
Returns export readiness score (0–100) and missing certifications list.

---

### AI Match Engine — `/api/match`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/products` | Importer | AI-matched products sorted by match score |
| GET | `/importers` | Manufacturer | AI-matched importers for manufacturer's products |
| GET | `/similar/:productId` | Public | Similar products by category |

Match score is computed based on:
- Category preference overlap (30 pts)
- Regulatory market × certification match (15 pts each)
- Manufacturer rating (up to 15 pts)
- Price range (up to 10 pts)
- Cold chain capability (10 pts)

---

### Admin — `/api/admin` *(role: admin)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Platform-wide stats |
| GET | `/users` | All users (filter by role, verified) |
| PUT | `/users/:id/verify` | Verify a manufacturer |
| PUT | `/users/:id/deactivate` | Deactivate a user |
| GET | `/rfqs` | All RFQs with filters |
| DELETE | `/products/:id` | Admin product removal |

---

## Data Models Summary

### User
```
name, email, password (hashed), role (manufacturer/importer/admin)
company, country, phone, isVerified, isActive
manufacturerProfile: { state, certifications[], rating, coldChainAvailable, ... }
importerProfile: { preferredCategories[], regulatoryMarkets[], ... }
```

### Product
```
manufacturer (ref), name, category, description, images[]
specifications: { fatContent, shelfLife, packagingFormats[], storageTemp, ... }
pricing: { basePrice, currency, unit, moq, moqUnit }
certifications[], targetMarkets[], coldChainRequired, views, inquiries
```

### RFQ
```
importer (ref), manufacturer (ref), product (ref)
title, productCategory, quantity, targetPrice, deliveryPort
status (pending→accepted), quotations[], messages[]
```

### Message
```
conversation (composite key), sender (ref), receiver (ref)
content, rfq (ref), isRead
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js 4.x |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |
| Email | Nodemailer |
| Dev | Nodemon |

---

## Novelty Features (Phase 2 — To be added)
- [ ] Live Cold Chain IoT Tracker (simulated temperature logs)
- [ ] Multi-language API responses (Arabic, French, Swahili)
- [ ] Python Flask microservice for advanced ML-based matching
- [ ] WebSocket real-time messaging
- [ ] Email notifications for RFQ status changes

---

*Built for S8 Final Year Project — Computer Science & Engineering*
