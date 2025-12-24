const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Health Check
// ============================================
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ============================================
// 토스페이먼츠 설정 API
// ============================================
app.get('/api/config', (req, res) => {
  res.json({
    tossClientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
  });
});

// ============================================
// Middleware
// ============================================
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer 설정 (사진 업로드)
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

// ============================================
// 주문 저장소 (JSON 파일로 영구 저장)
// ============================================
const ORDERS_FILE = './data/orders.json';

// 데이터 폴더 생성
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

// 기존 주문 불러오기
let ordersData = {};
if (fs.existsSync(ORDERS_FILE)) {
  try {
    ordersData = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    console.log(`📦 기존 주문 ${Object.keys(ordersData).length}건 로드됨`);
  } catch (e) {
    console.log('⚠️ 주문 파일 로드 실패, 새로 시작');
    ordersData = {};
  }
}

// Map 대신 객체 사용 + 자동 저장
const orders = {
  _data: ordersData,
  
  get(orderId) {
    return this._data[orderId] || null;
  },
  
  set(orderId, order) {
    this._data[orderId] = order;
    this._save();
  },
  
  values() {
    return Object.values(this._data);
  },
  
  _save() {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(this._data, null, 2));
    } catch (e) {
      console.error('주문 저장 실패:', e);
    }
  }
};

// ============================================
// 가격 설정
// ============================================
const PRICING = {
  tripwire: {
    id: 'tripwire',
    name: '산타 포착 사진',
    emoji: '📸',
    price: 1900,
    originalPrice: 5000
  },
  core: {
    id: 'core',
    name: '산타의 선물 세트',
    emoji: '🎁',
    price: 9900,
    originalPrice: 25000,
    badge: '가장 인기 ⭐'
  },
  premium: {
    id: 'premium',
    name: '산타의 마법 영상',
    emoji: '🎬',
    price: 24900,
    originalPrice: 59000
  }
};

const BUMP_OFFERS = {
  certificate: { id: 'certificate', price: 2900, name: '착한아이 인증서' },
  extraPhoto: { id: 'extraPhoto', price: 3900, name: '추가 사진 2장' },
  rush: { id: 'rush', price: 4900, name: '30분 급행' },
  letter: { id: 'letter', price: 2900, name: '산타 손편지' }
};

// ============================================
// 페이지 라우팅
// ============================================

// 주문 조회 페이지
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// 결제 성공 페이지
app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// 결제 실패 페이지
app.get('/payment/fail', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fail.html'));
});

// ============================================
// API - 사진 업로드
// ============================================
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 없습니다' });
  }
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// ============================================
// API - 결제 준비
// ============================================
app.post('/api/payment/prepare', (req, res) => {
  const { orderId, amount, packageId, bumpOffers = [], childInfo, photoFilename } = req.body;

  const selectedPackage = PRICING[packageId];
  if (!selectedPackage) {
    return res.status(400).json({ success: false, message: '잘못된 패키지입니다' });
  }

  const order = {
    orderId,
    packageId,
    packageName: selectedPackage.name,
    childName: childInfo?.name || '',
    childAge: childInfo?.age || '',
    parentMessage: childInfo?.message || '',
    photoFilename,
    basePrice: selectedPackage.price,
    bumpOffers,
    totalPrice: amount,
    status: 'pending',
    createdAt: new Date(),
    paymentStatus: 'unpaid'
  };

  orders.set(orderId, order);
  console.log('✅ 주문 준비:', orderId, '₩' + amount);

  res.json({ success: true, orderId, amount });
});

// ============================================
// API - 주문 생성 (기존 호환)
// ============================================
app.post('/api/orders', (req, res) => {
  const { packageId, childName, parentMessage, photoPath, contact, bumpOffers = [] } = req.body;

  const selectedPackage = PRICING[packageId];
  if (!selectedPackage) {
    return res.status(400).json({ error: '잘못된 패키지입니다' });
  }

  let totalPrice = selectedPackage.price;
  const selectedBumps = [];
  
  bumpOffers.forEach(bumpId => {
    if (BUMP_OFFERS[bumpId]) {
      totalPrice += BUMP_OFFERS[bumpId].price;
      selectedBumps.push(BUMP_OFFERS[bumpId]);
    }
  });

  const orderId = 'SANTA-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

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

// ============================================
// API - 결제 승인 (토스페이먼츠)
// ============================================
app.post('/api/payments/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  if (order.totalPrice !== parseInt(amount)) {
    return res.status(400).json({ error: '금액이 일치하지 않습니다' });
  }

  try {
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
      order.paymentStatus = 'paid';
      order.paymentKey = paymentKey;
      order.paidAt = new Date();
      order.status = 'processing';

      console.log(`✅ 결제 성공: ${orderId} - ₩${amount.toLocaleString()}`);

      res.json({ 
        success: true, 
        order,
        message: '결제가 완료되었습니다!'
      });
    } else {
      console.log(`❌ 결제 실패: ${orderId}`, result);
      res.status(400).json({ 
        success: false, 
        error: result.message || '결제 승인에 실패했습니다' 
      });
    }
  } catch (error) {
    console.error('결제 처리 오류:', error);
    res.status(500).json({ error: '결제 처리 중 오류가 발생했습니다' });
  }
});

// ============================================
// API - 주문 조회
// ============================================
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }
  res.json(order);
});

// ============================================
// API - 결제 성공 데이터
// ============================================
app.get('/api/payment/success', (req, res) => {
  const { orderId } = req.query;
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  res.json({
    success: true,
    order
  });
});

// ============================================
// 관리자 API - 주문 목록
// ============================================
app.get('/api/admin/orders', (req, res) => {
  const allOrders = Array.from(orders.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    revenue: allOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
  };

  res.json({ orders: allOrders, stats });
});

// ============================================
// 관리자 API - 상태 변경
// ============================================
app.put('/api/admin/orders/:orderId/status', (req, res) => {
  const { status } = req.body;
  const order = orders.get(req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  order.status = status;
  if (status === 'completed') {
    order.completedAt = new Date();
  }

  res.json({ success: true, order });
});

// ============================================
// 관리자 API - 완성 파일 업로드
// ============================================
const deliveryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/delivery';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  }
});

const deliveryUpload = multer({
  storage: deliveryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.post('/api/admin/upload', deliveryUpload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const { orderId } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }
  
  const deliveryFiles = {
    photos: [],
    video: null
  };
  
  if (req.files['photos']) {
    deliveryFiles.photos = req.files['photos'].map(f => `/uploads/delivery/${f.filename}`);
  }
  
  if (req.files['video'] && req.files['video'][0]) {
    deliveryFiles.video = `/uploads/delivery/${req.files['video'][0].filename}`;
  }
  
  order.deliveryFiles = deliveryFiles;
  order.status = 'ready';
  order.completedAt = new Date();
  
  console.log(`✅ 주문 완성: ${orderId}`);
  
  res.json({
    success: true,
    orderId,
    deliveryFiles
  });
});

// 배달 파일 접근
app.use('/uploads/delivery', express.static('uploads/delivery'));

// ============================================
// 서버 시작
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎅 산타를 만난 순간 - 서버 시작!`);
  console.log(`🌐 PORT: ${PORT}`);
  console.log(`✅ Health check: /health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
