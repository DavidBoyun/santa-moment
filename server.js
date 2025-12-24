const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

// âœ… Railway í¬íŠ¸ - ë°˜ë“œì‹œ ì´ë ‡ê²Œ!
const PORT = process.env.PORT || 3000;

// âœ… Health check - Railwayê°€ ì„œë²„ ì‚´ì•„ìžˆëŠ”ì§€ í™•ì¸ìš©
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ✅ 토스페이먼츠 설정 API - 클라이언트 키 전달
app.get('/api/config', (req, res) => {
  res.json({
    tossClientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
  });
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer ì„¤ì •
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ì£¼ë¬¸ ì €ìž¥ì†Œ (ì‹¤ì œë¡œëŠ” DB ì‚¬ìš©)
const orders = new Map();

// ============================================
// ðŸŽ¯ ëŸ¬ì…€ ë¸ŒëŸ°ìŠ¨ í¼ë„ + ìƒìœ„ 0.1% ê°€ê²© ì²´ê³„
// ============================================
const PRICING = {
  tripwire: {
    id: 'tripwire',
    name: 'ì‚°íƒ€ í¬ì°© ì‚¬ì§„',
    emoji: 'ðŸ“¸',
    price: 1900,
    originalPrice: 5000,
    discount: 62,
    description: 'ìš°ë¦¬ ì§‘ì— ì˜¨ ì‚°íƒ€ ì¦ê±°ì‚¬ì§„ 1ìž¥',
    includes: ['ì‚°íƒ€ í•©ì„± ì‚¬ì§„ 1ìž¥', 'ê³ í™”ì§ˆ ë‹¤ìš´ë¡œë“œ', '24ì‹œê°„ ë‚´ ì „ë‹¬'],
    deliveryTime: '24ì‹œê°„'
  },
  
  core: {
    id: 'core',
    name: 'ì‚°íƒ€ì˜ ì„ ë¬¼ ì„¸íŠ¸',
    emoji: 'ðŸŽ',
    price: 9900,
    originalPrice: 25000,
    discount: 60,
    description: 'ì‚¬ì§„ 3ìž¥ + ì°©í•œì•„ì´ ì¸ì¦ì„œ',
    includes: [
      'ì‚°íƒ€ í•©ì„± ì‚¬ì§„ 3ìž¥ (ë‹¤ì–‘í•œ ì•µê¸€)',
      'ì°©í•œì•„ì´ ì¸ì¦ì„œ (ì•„ì´ ì´ë¦„ í¬í•¨)',
      'ê³ í™”ì§ˆ ë‹¤ìš´ë¡œë“œ',
      '12ì‹œê°„ ë‚´ ì „ë‹¬'
    ],
    deliveryTime: '12ì‹œê°„',
    badge: 'ê°€ìž¥ ì¸ê¸° â­'
  },
  
  premium: {
    id: 'premium',
    name: 'ì‚°íƒ€ì˜ ë§ˆë²• ì˜ìƒ',
    emoji: 'ðŸŽ¬',
    price: 24900,
    originalPrice: 59000,
    discount: 58,
    description: 'ì‚¬ì§„ + ì˜ìƒíŽ¸ì§€ + í”„ë¦¬ë¯¸ì—„ í’€íŒ¨í‚¤ì§€',
    includes: [
      'ì‚°íƒ€ í•©ì„± ì‚¬ì§„ 5ìž¥',
      'ðŸŽ¬ ì‚°íƒ€ ì˜ìƒíŽ¸ì§€ (ì•„ì´ ì´ë¦„ í˜¸ëª…!)',
      'ì°©í•œì•„ì´ ì¸ì¦ì„œ (í”„ë¦¬ë¯¸ì—„ ë””ìžì¸)',
      'ì‚°íƒ€ ìŒì„± ë©”ì‹œì§€',
      '6ì‹œê°„ ë‚´ ìš°ì„  ì „ë‹¬'
    ],
    deliveryTime: '6ì‹œê°„',
    badge: 'VIP ðŸ‘‘'
  }
};

// Bump Offers (ê²°ì œ ì§ì „ ì¶”ê°€ ìƒí’ˆ)
const BUMP_OFFERS = {
  extraPhoto: {
    id: 'extraPhoto',
    name: 'ì¶”ê°€ ì‚¬ì§„ 2ìž¥',
    price: 2900,
    description: 'ë‹¤ë¥¸ ì•µê¸€ì˜ ì‚°íƒ€ ì‚¬ì§„ 2ìž¥ ì¶”ê°€'
  },
  framePrint: {
    id: 'framePrint',
    name: 'ì•¡ìž ì¸í™” ì„œë¹„ìŠ¤',
    price: 4900,
    description: 'í”„ë¦¬ë¯¸ì—„ ì•¡ìžì— ì¸í™”í•˜ì—¬ ë°°ì†¡'
  },
  voiceMessage: {
    id: 'voiceMessage', 
    name: 'ì‚°íƒ€ ìŒì„±ë©”ì‹œì§€',
    price: 3900,
    description: 'ì•„ì´ ì´ë¦„ì„ ë¶€ë¥´ëŠ” ì‚°íƒ€ ìŒì„± íŒŒì¼'
  }
};

// ============================================
// API ì—”ë“œí¬ì¸íŠ¸
// ============================================

// ê°€ê²© ì •ë³´ ì¡°íšŒ
app.get('/api/pricing', (req, res) => {
  res.json({
    packages: PRICING,
    bumpOffers: BUMP_OFFERS,
    currency: 'KRW'
  });
});

// ì‚¬ì§„ ì—…ë¡œë“œ
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'íŒŒì¼ì´ ì—†ìŠµë‹ˆë‹¤' });
  }
  
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// ì£¼ë¬¸ ìƒì„±
app.post('/api/orders', (req, res) => {
  const { 
    packageId, 
    childName, 
    parentMessage, 
    photoPath,
    contact,
    bumpOffers = []
  } = req.body;

  // íŒ¨í‚¤ì§€ í™•ì¸
  const selectedPackage = PRICING[packageId];
  if (!selectedPackage) {
    return res.status(400).json({ error: 'ìž˜ëª»ëœ íŒ¨í‚¤ì§€ìž…ë‹ˆë‹¤' });
  }

  // ì´ ê°€ê²© ê³„ì‚°
  let totalPrice = selectedPackage.price;
  const selectedBumps = [];
  
  bumpOffers.forEach(bumpId => {
    if (BUMP_OFFERS[bumpId]) {
      totalPrice += BUMP_OFFERS[bumpId].price;
      selectedBumps.push(BUMP_OFFERS[bumpId]);
    }
  });

  // ì£¼ë¬¸ ID ìƒì„±
  const orderId = 'SANTA-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  // ì£¼ë¬¸ ì €ìž¥
  const order = {
    orderId,
    packageId,
    packageName: selectedPackage.name,
    childName,
    parentMessage: parentMessage || '',
    photoPath,
    contact,
    basePrice: selectedPackage.price,
    bumpOffers: selectedBumps,
    totalPrice,
    status: 'pending',
    createdAt: new Date(),
    paymentStatus: 'unpaid'
  };

  orders.set(orderId, order);

  res.json({
    success: true,
    orderId,
    totalPrice,
    orderName: `${selectedPackage.emoji} ${selectedPackage.name}`,
    order
  });
});

// ê²°ì œ í™•ì¸ (Toss Payments ì½œë°±)
app.post('/api/payments/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'ì£¼ë¬¸ì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤' });
  }

  // ê¸ˆì•¡ ê²€ì¦
  if (order.totalPrice !== parseInt(amount)) {
    return res.status(400).json({ error: 'ê¸ˆì•¡ì´ ì¼ì¹˜í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤' });
  }

  try {
    // Toss Payments APIë¡œ ê²°ì œ ìŠ¹ì¸ ìš”ì²­
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_demo';
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    });

    const result = await response.json();

    if (response.ok) {
      // ê²°ì œ ì„±ê³µ
      order.paymentStatus = 'paid';
      order.paymentKey = paymentKey;
      order.paidAt = new Date();
      order.status = 'processing';

      console.log(`âœ… ê²°ì œ ì„±ê³µ: ${orderId} - â‚©${amount.toLocaleString()}`);

      res.json({ 
        success: true, 
        order,
        message: 'ê²°ì œê°€ ì™„ë£Œë˜ì—ˆìŠµë‹ˆë‹¤!'
      });
    } else {
      console.log(`âŒ ê²°ì œ ì‹¤íŒ¨: ${orderId}`, result);
      res.status(400).json({ 
        success: false, 
        error: result.message || 'ê²°ì œ ìŠ¹ì¸ì— ì‹¤íŒ¨í–ˆìŠµë‹ˆë‹¤' 
      });
    }
  } catch (error) {
    console.error('ê²°ì œ ì²˜ë¦¬ ì˜¤ë¥˜:', error);
    res.status(500).json({ error: 'ê²°ì œ ì²˜ë¦¬ ì¤‘ ì˜¤ë¥˜ê°€ ë°œìƒí–ˆìŠµë‹ˆë‹¤' });
  }
});

// ì£¼ë¬¸ ì¡°íšŒ
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'ì£¼ë¬¸ì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤' });
  }
  res.json(order);
});

// ê²°ì œ ì„±ê³µ íŽ˜ì´ì§€ ë°ì´í„°
app.get('/api/payment/success', (req, res) => {
  const { orderId } = req.query;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'ì£¼ë¬¸ì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤' });
  }

  res.json({
    success: true,
    order,
    estimatedDelivery: getEstimatedDelivery(order.packageId)
  });
});

function getEstimatedDelivery(packageId) {
  const hours = {
    tripwire: 24,
    core: 12,
    premium: 6
  };
  const deliveryHours = hours[packageId] || 24;
  const deliveryTime = new Date(Date.now() + deliveryHours * 60 * 60 * 1000);
  return deliveryTime.toISOString();
}

// ============================================
// ê´€ë¦¬ìž API
// ============================================

// ëª¨ë“  ì£¼ë¬¸ ì¡°íšŒ
app.get('/api/admin/orders', (req, res) => {
  const allOrders = Array.from(orders.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    totalRevenue: allOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0)
  };

  res.json({ orders: allOrders, stats });
});

// ì£¼ë¬¸ ìƒíƒœ ì—…ë°ì´íŠ¸
app.put('/api/admin/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'ì£¼ë¬¸ì„ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤' });
  }

  order.status = status;
  if (status === 'completed') {
    order.completedAt = new Date();
  }

  res.json({ success: true, order });
});

// ============================================
// ì„œë²„ ì‹œìž‘ - Railway í˜¸í™˜
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`ðŸŽ… ì‚°íƒ€ë¥¼ ë§Œë‚œ ìˆœê°„ - ì„œë²„ ì‹œìž‘!`);
  console.log(`ðŸŒ PORT: ${PORT}`);
  console.log(`âœ… Health check: /health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
