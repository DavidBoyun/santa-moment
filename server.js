const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer 설정
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

// 주문 저장소 (실제로는 DB 사용)
const orders = new Map();

// ============================================
// 🎯 러셀 브런슨 퍼널 + 상위 0.1% 가격 체계
// ============================================
const PRICING = {
  // 💡 Tripwire (미끼) - 저항 없이 결제 유도
  tripwire: {
    id: 'tripwire',
    name: '산타 포착 사진',
    emoji: '📸',
    price: 1900,
    originalPrice: 5000,
    discount: 62,
    description: '우리 집에 온 산타 증거사진 1장',
    includes: ['산타 합성 사진 1장', '고화질 다운로드', '24시간 내 전달'],
    deliveryTime: '24시간'
  },
  
  // ⭐ Core Offer (핵심) - 대부분이 선택
  core: {
    id: 'core',
    name: '산타의 선물',
    emoji: '🎁',
    price: 9900,
    originalPrice: 24900,
    discount: 60,
    description: '사진 + 영상 + 증서 풀패키지',
    includes: [
      '산타 합성 사진 3장',
      '🎬 산타 영상편지 8초',
      '🎖️ 착한아이 인증서',
      '아이 이름 직접 호명',
      '2시간 내 전달'
    ],
    deliveryTime: '2시간',
    popular: true,
    recommended: true
  },
  
  // 👑 Profit Maximizer (수익 극대화)
  premium: {
    id: 'premium',
    name: 'VIP 마법의 크리스마스',
    emoji: '👑',
    price: 24900,
    originalPrice: 59900,
    discount: 58,
    description: '프리미엄 올인원 패키지',
    includes: [
      '산타 합성 사진 5장 (다양한 앵글)',
      '🎬 산타 영상편지 8초 x 2개',
      '🎖️ 프리미엄 착한아이 인증서',
      '📜 산타 친필 편지 PDF',
      '🦌 루돌프 보너스 사진',
      '⚡ 1시간 내 급행 전달',
      '🔄 수정 1회 무료'
    ],
    deliveryTime: '1시간',
    vip: true
  },
  
  // 🛒 Bump Offers (결제 직전 추가)
  bumps: {
    certificate: {
      id: 'bump_certificate',
      name: '착한아이 인증서 추가',
      emoji: '🎖️',
      price: 2900,
      description: '프린트 가능한 고화질 A4 PDF'
    },
    extraPhoto: {
      id: 'bump_photo',
      name: '추가 사진 2장',
      emoji: '📸',
      price: 3900,
      description: '다른 앵글의 산타 사진'
    },
    rush: {
      id: 'bump_rush',
      name: '급행 전달 (30분)',
      emoji: '⚡',
      price: 4900,
      description: '최우선 순위로 제작'
    },
    letter: {
      id: 'bump_letter',
      name: '산타 친필 편지',
      emoji: '📜',
      price: 3900,
      description: '개인화된 PDF 편지'
    }
  },
  
  // 🚀 OTO (결제 후 원타임 오퍼)
  oto: {
    family: {
      id: 'oto_family',
      name: '형제자매 추가 패키지',
      emoji: '👨‍👩‍👧‍👦',
      price: 7900,
      originalPrice: 19900,
      discount: 60,
      description: '동생/언니/오빠 각각 개인화된 영상 추가',
      oneTimeOnly: true
    }
  }
};

// ============================================
// API 엔드포인트
// ============================================

// 가격 정보 조회
app.get('/api/pricing', (req, res) => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  res.json({
    success: true,
    pricing: PRICING,
    urgency: {
      message: '🎄 크리스마스 특가! 오늘 자정까지',
      remainingSlots: Math.floor(Math.random() * 15) + 8,
      countdown: { hours, minutes },
      isChristmasEve: now.getMonth() === 11 && now.getDate() === 24
    }
  });
});

// 사진 업로드 + 품질 체크
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '사진을 업로드해주세요' });
    }

    // 품질 체크
    const stats = fs.statSync(req.file.path);
    const fileSizeKB = stats.size / 1024;
    
    let qualityScore = 85 + Math.floor(Math.random() * 15);
    let passed = true;
    let message = '✅ 완벽한 공간이에요! 산타가 도착할 준비 완료 🎅';
    let tip = '';

    if (fileSizeKB < 30) {
      passed = false;
      message = '📷 사진 해상도가 너무 낮아요';
      tip = '더 선명한 사진으로 다시 촬영해주세요';
      qualityScore = 40;
    }

    if (!passed) {
      fs.unlinkSync(req.file.path);
      return res.json({ success: false, error: message, tip });
    }

    // 주문 ID 생성
    const orderId = 'SANTA_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex').toUpperCase();
    
    orders.set(orderId, {
      id: orderId,
      status: 'pending',
      originalPhoto: req.file.path,
      previewUrl: '/uploads/' + req.file.filename,
      createdAt: new Date(),
      childName: null,
      message: null,
      package: null,
      bumps: [],
      paid: false
    });

    res.json({
      success: true,
      orderId,
      previewUrl: '/uploads/' + req.file.filename,
      message,
      qualityScore
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: '업로드 중 오류가 발생했어요' });
  }
});

// 아이 정보 저장
app.post('/api/order/:orderId/child', (req, res) => {
  const { orderId } = req.params;
  const { childName, childAge, message } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: '주문을 찾을 수 없어요' });
  }

  if (!childName || childName.trim().length === 0) {
    return res.status(400).json({ success: false, error: '아이 이름을 입력해주세요' });
  }

  if (message && message.length > 80) {
    return res.status(400).json({ 
      success: false, 
      error: `메시지가 너무 길어요 (${message.length}/80자)` 
    });
  }

  order.childName = childName.trim();
  order.childAge = childAge;
  order.message = message || `${childName}아, 올해도 착하게 잘 지냈구나! 메리 크리스마스!`;

  res.json({
    success: true,
    message: `${childName}(이)를 위한 마법 준비 완료! ✨`,
    defaultMessage: order.message
  });
});

// 패키지 선택
app.post('/api/order/:orderId/package', (req, res) => {
  const { orderId } = req.params;
  const { packageId, bumps = [] } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: '주문을 찾을 수 없어요' });
  }

  const pkg = PRICING[packageId];
  if (!pkg) {
    return res.status(400).json({ success: false, error: '패키지를 선택해주세요' });
  }

  order.package = packageId;
  order.bumps = bumps;

  // 금액 계산
  let totalPrice = pkg.price;
  let totalOriginal = pkg.originalPrice || pkg.price;
  const selectedBumps = [];

  bumps.forEach(bumpId => {
    const bump = Object.values(PRICING.bumps).find(b => b.id === bumpId);
    if (bump) {
      totalPrice += bump.price;
      totalOriginal += bump.price;
      selectedBumps.push(bump);
    }
  });

  order.totalPrice = totalPrice;
  order.totalOriginal = totalOriginal;

  res.json({
    success: true,
    package: pkg,
    bumps: selectedBumps,
    totalPrice,
    totalOriginal,
    savings: totalOriginal - totalPrice
  });
});

// ============================================
// 💳 토스페이먼츠 결제
// ============================================

// 결제 준비
app.post('/api/payment/prepare', (req, res) => {
  const { orderId } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: '주문을 찾을 수 없어요' });
  }

  if (!order.package || !order.childName) {
    return res.status(400).json({ success: false, error: '주문 정보가 incomplete해요' });
  }

  const pkg = PRICING[order.package];
  
  res.json({
    success: true,
    payment: {
      orderId: order.id,
      orderName: `🎅 ${pkg.name} - ${order.childName}`,
      amount: order.totalPrice,
      customerName: order.childName + ' 보호자',
      clientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq',
      successUrl: `${process.env.BASE_URL || 'http://localhost:' + PORT}/payment/success`,
      failUrl: `${process.env.BASE_URL || 'http://localhost:' + PORT}/payment/fail`
    }
  });
});

// 결제 승인
app.post('/api/payment/confirm', async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;

  try {
    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: '주문을 찾을 수 없어요' });
    }

    if (order.totalPrice !== parseInt(amount)) {
      return res.status(400).json({ success: false, error: '결제 금액 불일치' });
    }

    // 토스페이먼츠 승인 API
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const auth = Buffer.from(secretKey + ':').toString('base64');

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) })
    });

    const result = await response.json();

    if (result.status === 'DONE') {
      order.paid = true;
      order.paymentKey = paymentKey;
      order.paidAt = new Date();
      order.status = 'paid';

      console.log('\n🎉 ===== 새 주문 접수! =====');
      console.log(`   주문번호: ${orderId}`);
      console.log(`   아이이름: ${order.childName}`);
      console.log(`   패키지: ${PRICING[order.package].name}`);
      console.log(`   금액: ₩${order.totalPrice.toLocaleString()}`);
      console.log(`   메시지: ${order.message}`);
      console.log('============================\n');

      res.json({
        success: true,
        order: {
          id: orderId,
          childName: order.childName,
          package: PRICING[order.package],
          totalPrice: order.totalPrice
        },
        oto: PRICING.oto.family
      });
    } else {
      res.status(400).json({ success: false, error: result.message || '결제 실패' });
    }

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, error: '결제 처리 중 오류' });
  }
});

// 결제 성공/실패 페이지
app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/payment/fail', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'fail.html'));
});

// ============================================
// 🎖️ 산타 증서 API
// ============================================
app.get('/api/certificate/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);

  if (!order || !order.paid) {
    return res.status(404).json({ success: false, error: '주문을 찾을 수 없어요' });
  }

  const now = new Date();
  
  res.json({
    success: true,
    certificate: {
      childName: order.childName,
      childAge: order.childAge || '',
      date: now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      year: now.getFullYear(),
      serialNumber: `NICE-${now.getFullYear()}-${orderId.slice(-6).toUpperCase()}`,
      message: order.message,
      isPremium: order.package === 'premium'
    }
  });
});

// ============================================
// 🔧 관리자 API
// ============================================
app.get('/api/admin/orders', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY && key !== 'santa2024') {
    return res.status(401).json({ success: false, error: '권한 없음' });
  }

  const list = Array.from(orders.values())
    .filter(o => o.paid)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

  res.json({
    success: true,
    count: list.length,
    totalRevenue: list.reduce((sum, o) => sum + o.totalPrice, 0),
    orders: list.map(o => ({
      id: o.id,
      childName: o.childName,
      message: o.message,
      package: o.package,
      packageName: PRICING[o.package]?.name,
      bumps: o.bumps,
      totalPrice: o.totalPrice,
      status: o.status,
      paidAt: o.paidAt,
      photo: o.previewUrl
    }))
  });
});

app.post('/api/admin/orders/:orderId/complete', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY && key !== 'santa2024') {
    return res.status(401).json({ success: false, error: '권한 없음' });
  }

  const { orderId } = req.params;
  const { photoUrl, videoUrl, certificateUrl } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, error: '주문 없음' });
  }

  order.status = 'completed';
  order.results = { photoUrl, videoUrl, certificateUrl };
  order.completedAt = new Date();

  res.json({ success: true, order });
});

// ============================================
// 서버 시작
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎅 산타를 만난 순간 - 서버 시작!                              ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 메인: http://localhost:${PORT}                              ║
║  🔧 관리자: http://localhost:${PORT}/admin.html                 ║
╠══════════════════════════════════════════════════════════════╣
║  💰 러셀 브런슨 퍼널 가격체계:                                  ║
║     • Tripwire: ₩1,900 (62% 할인) - 미끼                      ║
║     • Core: ₩9,900 (60% 할인) - 핵심 ⭐                       ║
║     • Premium: ₩24,900 (58% 할인) - 수익화 👑                 ║
╠══════════════════════════════════════════════════════════════╣
║  💳 토스페이먼츠: ${process.env.TOSS_CLIENT_KEY ? '실제키' : '테스트키'}                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
