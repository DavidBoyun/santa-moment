const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 이메일 설정 (Gmail)
// ============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // 예: santa.moment.official@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD // Gmail 앱 비밀번호 (16자리)
  }
});

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

// ============================================
// 주문 저장소 (JSON 파일로 영구 저장)
// ============================================
const DATA_DIR = './data';
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
// 대기열 관리 시스템
// ============================================
const queueStats = {
  avgProcessTimeMinutes: 15, // 초기값: 건당 15분
  completedToday: 0,
  totalProcessTimeToday: 0, // 분 단위
  
  // 평균 처리 시간 업데이트
  updateAvgTime(processTimeMinutes) {
    this.completedToday++;
    this.totalProcessTimeToday += processTimeMinutes;
    this.avgProcessTimeMinutes = Math.round(this.totalProcessTimeToday / this.completedToday);
  },
  
  // 대기 순번 계산
  getQueuePosition(orderId) {
    const pendingOrders = orders.values()
      .filter(o => o.status === 'processing' && o.paymentStatus === 'paid')
      .sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt));
    
    const position = pendingOrders.findIndex(o => o.orderId === orderId);
    return position === -1 ? pendingOrders.length + 1 : position + 1;
  },
  
  // 예상 완료 시간 계산
  getEstimatedCompletion(orderId) {
    const position = this.getQueuePosition(orderId);
    const waitMinutes = (position - 1) * this.avgProcessTimeMinutes;
    const estimatedTime = new Date(Date.now() + waitMinutes * 60 * 1000);
    
    // 크리스마스 아침 (12/25 오전 7시) 전인지 체크
    const christmasMorning = new Date('2025-12-25T07:00:00+09:00');
    const beforeChristmas = estimatedTime < christmasMorning;
    
    return {
      position,
      totalInQueue: orders.values().filter(o => o.status === 'processing').length,
      avgProcessTime: this.avgProcessTimeMinutes,
      waitMinutes,
      estimatedTime: estimatedTime.toISOString(),
      beforeChristmas,
      guaranteeText: beforeChristmas 
        ? '✅ 크리스마스 아침 전 도착 보장!' 
        : '⚠️ 크리스마스 아침 이후 도착 예상'
    };
  }
};

// ============================================
// 가격 설정
// ============================================
const PRICING = {
  photo1: { id: 'photo1', price: 1900, originalPrice: 5000, name: '산타 포착 사진' },
  giftset: { id: 'giftset', price: 4900, originalPrice: 15000, name: '산타 선물세트' },
  videoonly: { id: 'videoonly', price: 17900, originalPrice: 39000, name: '영상만' },
  premium: { id: 'premium', price: 19900, originalPrice: 59000, name: '산타의 마법 영상' }
};

const BUMP_OFFERS = {
  certificate: { id: 'certificate', price: 2900, name: '착한아이 인증서' },
  letter: { id: 'letter', price: 3900, name: '산타 자필편지' },
  rush: { id: 'rush', price: 4900, name: '30분 급행' }
};

// ============================================
// 페이지 라우팅
// ============================================
app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

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
  const { orderId, amount, packageId, bumpOffers = [], childInfo, photoFilename, customerEmail } = req.body;

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
    customerEmail: customerEmail || '', // 🔥 고객 이메일 추가
    photoFilename,
    basePrice: selectedPackage.price,
    bumpOffers,
    totalPrice: amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentStatus: 'unpaid'
  };

  orders.set(orderId, order);
  console.log('✅ 주문 준비:', orderId, '₩' + amount);

  res.json({ success: true, orderId, amount });
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
      order.paidAt = new Date().toISOString();
      order.status = 'processing';
      orders.set(orderId, order);

      console.log(`✅ 결제 성공: ${orderId} - ₩${amount.toLocaleString()}`);

      // 🔥 관리자에게 새 주문 알림 이메일 발송
      sendAdminNotification(order);

      // 🔥 고객에게 주문 확인 이메일 발송
      sendCustomerConfirmation(order);

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
// 🔥 이메일 발송 함수들
// ============================================

// 관리자에게 새 주문 알림
async function sendAdminNotification(order) {
  if (!process.env.GMAIL_USER) {
    console.log('⚠️ 이메일 설정 없음 - 알림 스킵');
    return;
  }

  const photoUrl = order.photoFilename 
    ? `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${order.photoFilename}`
    : '사진 없음';

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
    subject: `🎅 새 주문! ${order.childName} - ${order.packageName} (₩${order.totalPrice.toLocaleString()})`,
    html: `
      <h2>🎅 새 주문이 들어왔습니다!</h2>
      <hr>
      <p><strong>주문번호:</strong> ${order.orderId}</p>
      <p><strong>아이 이름:</strong> ${order.childName}</p>
      <p><strong>나이:</strong> ${order.childAge || '미입력'}</p>
      <p><strong>메시지:</strong> ${order.parentMessage || '없음'}</p>
      <p><strong>패키지:</strong> ${order.packageName}</p>
      <p><strong>금액:</strong> ₩${order.totalPrice.toLocaleString()}</p>
      <p><strong>고객 이메일:</strong> ${order.customerEmail}</p>
      <hr>
      <p><strong>📸 고객 사진:</strong></p>
      <p><a href="${photoUrl}">${photoUrl}</a></p>
      <hr>
      <p>제작 완료 후 고객 이메일로 구글드라이브 링크를 보내주세요!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 관리자 알림 발송 완료: ${order.orderId}`);
  } catch (error) {
    console.error('관리자 알림 발송 실패:', error);
  }
}

// 고객에게 주문 확인 이메일
async function sendCustomerConfirmation(order) {
  if (!process.env.GMAIL_USER || !order.customerEmail) {
    console.log('⚠️ 이메일 설정 없음 또는 고객 이메일 없음');
    return;
  }

  const mailOptions = {
    from: `"산타를 만난 순간" <${process.env.GMAIL_USER}>`,
    to: order.customerEmail,
    subject: `🎅 주문이 완료되었어요! ${order.childName}의 산타 사진을 준비중입니다`,
    html: `
      <div style="max-width: 500px; margin: 0 auto; font-family: sans-serif;">
        <h2 style="color: #c41e3a;">🎅 주문이 완료되었습니다!</h2>
        <p>안녕하세요! <strong>${order.childName}</strong> 부모님,</p>
        <p>주문이 성공적으로 접수되었어요. AI 전문가 팀이 정성껏 제작하고 있습니다.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>📦 주문 정보</strong></p>
          <p>주문번호: ${order.orderId}</p>
          <p>패키지: ${order.packageName}</p>
          <p>결제금액: ₩${order.totalPrice.toLocaleString()}</p>
        </div>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p><strong>📩 완성 후 안내</strong></p>
          <p>제작이 완료되면 이 이메일 주소로 <strong>다운로드 링크</strong>를 보내드립니다.</p>
          <p>예상 소요시간: ${order.bumpOffers?.includes('rush') ? '30분~1시간' : '6~24시간'}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          문의: santa.moment.official@gmail.com
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 고객 확인 메일 발송 완료: ${order.customerEmail}`);
  } catch (error) {
    console.error('고객 확인 메일 발송 실패:', error);
  }
}

// 🔥 고객에게 완성 파일 전달 (관리자가 호출)
app.post('/api/admin/send-delivery', async (req, res) => {
  const { orderId, driveLink, message } = req.body;
  
  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  if (!order.customerEmail) {
    return res.status(400).json({ error: '고객 이메일이 없습니다' });
  }

  const mailOptions = {
    from: `"산타를 만난 순간" <${process.env.GMAIL_USER}>`,
    to: order.customerEmail,
    subject: `🎁 산타가 도착했어요! ${order.childName}의 크리스마스 선물`,
    html: `
      <div style="max-width: 500px; margin: 0 auto; font-family: sans-serif;">
        <h2 style="color: #c41e3a;">🎅 산타가 도착했어요!</h2>
        <p>안녕하세요! <strong>${order.childName}</strong> 부모님,</p>
        <p>드디어 산타 사진/영상이 완성되었습니다!</p>
        
        <div style="background: #fff9c4; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <p><strong>🎁 다운로드 링크</strong></p>
          <a href="${driveLink}" style="display: inline-block; background: #c41e3a; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">
            📥 사진/영상 다운로드
          </a>
        </div>
        
        ${message ? `<p style="background: #e3f2fd; padding: 15px; border-radius: 10px;">${message}</p>` : ''}
        
        <p>💡 <strong>사용 팁:</strong> 크리스마스 아침에 아이에게 "어젯밤 이상한 소리 나서 확인해봤는데..." 하면서 보여주세요!</p>
        
        <p style="color: #666; font-size: 14px;">
          ${order.childName}에게 마법 같은 크리스마스가 되길 바랍니다! 🎄<br>
          - 산타를 만난 순간 팀 드림
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    
    // 상태 업데이트
    order.status = 'completed';
    order.deliveryLink = driveLink;
    order.deliveredAt = new Date().toISOString();
    
    // 처리 시간 기록 (대기열 평균 계산용)
    if (order.paidAt) {
      const processTime = Math.round((Date.now() - new Date(order.paidAt).getTime()) / 60000);
      queueStats.updateAvgTime(processTime);
    }
    
    orders.set(orderId, order);

    console.log(`📧 완성 파일 전달 완료: ${order.customerEmail}`);
    res.json({ success: true, message: '이메일 발송 완료!' });
  } catch (error) {
    console.error('완성 파일 전달 실패:', error);
    res.status(500).json({ error: '이메일 발송 실패: ' + error.message });
  }
});

// ============================================
// API - 주문 조회 + 대기열 정보
// ============================================
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }
  
  // 대기열 정보 추가
  const queueInfo = queueStats.getEstimatedCompletion(req.params.orderId);
  
  res.json({
    ...order,
    queue: queueInfo
  });
});

// API - 전체 대기열 현황
app.get('/api/queue/status', (req, res) => {
  const processingOrders = orders.values().filter(o => o.status === 'processing');
  const completedToday = orders.values().filter(o => 
    o.status === 'completed' && 
    o.completedAt && 
    new Date(o.completedAt).toDateString() === new Date().toDateString()
  );
  
  res.json({
    currentQueue: processingOrders.length,
    completedToday: completedToday.length,
    avgProcessTime: queueStats.avgProcessTimeMinutes,
    // 마감 정보
    deadline: '2025-12-24T18:00:00+09:00',
    isOpen: new Date() < new Date('2025-12-24T18:00:00+09:00')
  });
});

// ============================================
// 관리자 API
// ============================================
app.get('/api/admin/orders', (req, res) => {
  const allOrders = orders.values()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    completed: allOrders.filter(o => o.status === 'completed').length,
    revenue: allOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0)
  };

  res.json({ orders: allOrders, stats });
});

app.put('/api/admin/orders/:orderId/status', (req, res) => {
  const { status } = req.body;
  const order = orders.get(req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  }

  order.status = status;
  orders.set(req.params.orderId, order);

  res.json({ success: true, order });
});

// ============================================
// 서버 시작
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎅 산타를 만난 순간 - 서버 시작!`);
  console.log(`🌐 PORT: ${PORT}`);
  console.log(`📧 이메일: ${process.env.GMAIL_USER ? '설정됨' : '미설정'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
