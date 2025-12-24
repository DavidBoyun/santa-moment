/**
 * 🎅 산타를 만난 순간 - Frontend
 */

const APP_STATE = {
  currentStep: 1,
  uploadedPhoto: null,
  childInfo: { name: '', age: '', message: '' },
  customerEmail: '',
  selectedPackage: null,
  bumpOffers: [],
  privacyAgreed: false
};

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

let TOSS_CLIENT_KEY = '';

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    TOSS_CLIENT_KEY = config.tossClientKey;
  } catch (e) {
    TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  }
  
  initCountdown();
  initUploader();
  initFormValidation();
  initPackageSelection();
  initBumpOffers();
  initPrivacyConsent();
  initPayment();
  initNavigation();
  initFaq();
  renderReviews();
  startOrderNotifications();
});

// ============================================
// 카운트다운
// ============================================
function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  
  const christmas = new Date('2025-12-26T00:00:00+09:00');
  
  setInterval(() => {
    const diff = christmas - new Date();
    if (diff <= 0) { el.textContent = '종료!'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }, 1000);
}

// ============================================
// 사진 업로드 + 품질 체크
// ============================================
function initUploader() {
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const cameraBtn = document.getElementById('cameraBtn');
  const galleryBtn = document.getElementById('galleryBtn');
  const retryBtn = document.getElementById('retryBtn');
  
  if (!photoInput) return;
  
  cameraBtn?.addEventListener('click', () => {
    photoInput.setAttribute('capture', 'environment');
    photoInput.click();
  });
  
  galleryBtn?.addEventListener('click', () => {
    photoInput.removeAttribute('capture');
    photoInput.click();
  });
  
  document.getElementById('uploadPlaceholder')?.addEventListener('click', () => {
    photoInput.removeAttribute('capture');
    photoInput.click();
  });
  
  photoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handlePhotoUpload(e.target.files[0]);
  });
  
  retryBtn?.addEventListener('click', () => {
    photoInput.value = '';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('nextStep1').disabled = true;
    APP_STATE.uploadedPhoto = null;
  });
}

async function handlePhotoUpload(file) {
  const overlay = document.getElementById('qualityOverlay');
  const uploadArea = document.getElementById('uploadArea');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const qualityBadge = document.getElementById('qualityBadge');
  const nextBtn = document.getElementById('nextStep1');
  
  // 미리보기
  const reader = new FileReader();
  reader.onload = (e) => { previewImage.src = e.target.result; };
  reader.readAsDataURL(file);
  
  // 오버레이 표시
  if (overlay) overlay.classList.add('show');
  
  // 품질 체크
  const quality = await checkImageQuality(file);
  
  if (overlay) overlay.classList.remove('show');
  uploadArea.style.display = 'none';
  previewContainer.style.display = 'block';
  
  // 결과 표시
  qualityBadge.innerHTML = `<span class="quality-score">품질: <strong>${quality.score}점</strong></span>`;
  
  if (quality.pass) {
    // 통과 - 서버 업로드
    const formData = new FormData();
    formData.append('photo', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success) {
        APP_STATE.uploadedPhoto = data.filename;
        qualityBadge.classList.remove('quality-bad');
        qualityBadge.classList.add('quality-good');
        nextBtn.disabled = false;
        showToast('✅ 완벽한 사진이에요!', 'success');
      }
    } catch (e) {
      showToast('⚠️ 업로드 실패. 다시 시도해주세요.', 'warning');
    }
  } else {
    // 실패
    qualityBadge.classList.remove('quality-good');
    qualityBadge.classList.add('quality-bad');
    nextBtn.disabled = true;
    showToast('⚠️ ' + quality.message, 'warning');
  }
}

function checkImageQuality(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 캔버스에 그리기
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 분석용 크기 (너무 작으면 정확도 떨어짐)
      const maxSize = 300;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // 1. 밝기 체크
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        totalBrightness += (pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114);
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);
      const brightnessOk = avgBrightness >= 40 && avgBrightness <= 220;
      
      // 2. 선명도 체크 (Laplacian variance)
      const grayData = [];
      for (let i = 0; i < pixels.length; i += 4) {
        grayData.push(pixels[i] * 0.299 + pixels[i+1] * 0.587 + pixels[i+2] * 0.114);
      }
      
      let laplacianSum = 0;
      let laplacianCount = 0;
      const w = canvas.width;
      const h = canvas.height;
      
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          // Laplacian 커널: [0, 1, 0], [1, -4, 1], [0, 1, 0]
          const lap = (
            grayData[idx - w] +
            grayData[idx - 1] +
            grayData[idx + 1] +
            grayData[idx + w] -
            4 * grayData[idx]
          );
          laplacianSum += lap * lap;
          laplacianCount++;
        }
      }
      const laplacianVariance = laplacianSum / laplacianCount;
      const sharpnessOk = laplacianVariance >= 100; // 흐릿하면 이 값이 매우 낮음
      
      // 3. 해상도 체크
      const resolutionOk = img.width >= 400 && img.height >= 400;
      
      // UI 업데이트
      updateCheck('checkBrightness', brightnessOk);
      updateCheck('checkSharpness', sharpnessOk);
      updateCheck('checkResolution', resolutionOk);
      
      // 점수 계산
      let score = 0;
      if (brightnessOk) score += 35;
      if (sharpnessOk) score += 45;
      if (resolutionOk) score += 20;
      
      const allPass = brightnessOk && sharpnessOk && resolutionOk;
      
      // 메시지
      let message = '';
      if (!brightnessOk) message = '사진이 너무 어둡거나 밝아요. 조명을 켜고 다시 찍어주세요.';
      else if (!sharpnessOk) message = '사진이 흔들렸어요. 카메라를 고정하고 다시 찍어주세요.';
      else if (!resolutionOk) message = '해상도가 너무 낮아요. 더 큰 사진을 올려주세요.';
      
      // 오버레이 텍스트 업데이트
      const title = document.getElementById('qualityTitle');
      const msg = document.getElementById('qualityMessage');
      if (title) title.textContent = allPass ? '✅ 완벽해요!' : '⚠️ 다시 찍어주세요';
      if (msg) msg.textContent = allPass ? '산타 합성에 딱 좋은 사진이에요!' : message;
      
      console.log('품질 체크:', { avgBrightness, laplacianVariance, brightnessOk, sharpnessOk, resolutionOk, score });
      
      resolve({ pass: allPass, score, message });
    };
    
    img.onerror = () => {
      resolve({ pass: false, score: 0, message: '이미지를 불러올 수 없어요.' });
    };
    
    // 이미지 로드
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  });
}

function updateCheck(id, pass) {
  const el = document.getElementById(id);
  if (el) {
    const icon = el.querySelector('.check-icon');
    if (icon) icon.textContent = pass ? '✅' : '❌';
  }
}

// ============================================
// 폼 검증 (이메일 포함)
// ============================================
function initFormValidation() {
  const childName = document.getElementById('childName');
  const childAge = document.getElementById('childAge');
  const santaMessage = document.getElementById('santaMessage');
  const charCount = document.getElementById('charCount');
  const customerEmail = document.getElementById('customerEmail');
  const nextBtn = document.getElementById('nextStep2');
  
  function validate() {
    const nameOk = childName?.value.trim().length >= 1;
    const emailOk = customerEmail?.value.includes('@');
    nextBtn.disabled = !(nameOk && emailOk);
  }
  
  childName?.addEventListener('input', () => {
    APP_STATE.childInfo.name = childName.value.trim();
    validate();
    const display = document.getElementById('childNameDisplay');
    if (display) display.textContent = childName.value.trim() || '아이';
  });
  
  childAge?.addEventListener('change', () => {
    APP_STATE.childInfo.age = childAge.value;
  });
  
  santaMessage?.addEventListener('input', () => {
    APP_STATE.childInfo.message = santaMessage.value;
    if (charCount) charCount.textContent = santaMessage.value.length;
  });
  
  customerEmail?.addEventListener('input', () => {
    APP_STATE.customerEmail = customerEmail.value.trim();
    validate();
  });
}

// ============================================
// 패키지 선택
// ============================================
function initPackageSelection() {
  document.querySelectorAll('.price-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.price-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      APP_STATE.selectedPackage = card.dataset.package;
      updatePriceSummary();
      checkPaymentReady();
    });
  });
}

function initBumpOffers() {
  document.querySelectorAll('.bump-item input').forEach(bump => {
    bump.addEventListener('change', () => {
      if (bump.checked) APP_STATE.bumpOffers.push(bump.value);
      else APP_STATE.bumpOffers = APP_STATE.bumpOffers.filter(b => b !== bump.value);
      updatePriceSummary();
    });
  });
}

function initPrivacyConsent() {
  document.getElementById('privacyAgree')?.addEventListener('change', (e) => {
    APP_STATE.privacyAgreed = e.target.checked;
    checkPaymentReady();
  });
}

function checkPaymentReady() {
  const btn = document.getElementById('payButton');
  if (btn) btn.disabled = !(APP_STATE.selectedPackage && APP_STATE.privacyAgreed);
}

function updatePriceSummary() {
  if (!APP_STATE.selectedPackage) return;
  
  const pkg = PRICING[APP_STATE.selectedPackage];
  let total = pkg.price;
  let original = pkg.originalPrice;
  
  document.getElementById('summaryPackage').textContent = `${pkg.name} ₩${pkg.price.toLocaleString()}`;
  
  const bumpNames = [];
  APP_STATE.bumpOffers.forEach(id => {
    const bump = BUMP_OFFERS[id];
    if (bump) { total += bump.price; original += bump.price; bumpNames.push(bump.name); }
  });
  
  const bumpsRow = document.getElementById('summaryBumpsRow');
  if (bumpNames.length > 0) {
    document.getElementById('summaryBumps').textContent = bumpNames.join(', ');
    bumpsRow.style.display = 'flex';
  } else {
    bumpsRow.style.display = 'none';
  }
  
  document.getElementById('summaryTotal').textContent = `₩${total.toLocaleString()}`;
  document.getElementById('savingsAmount').textContent = `₩${(original - total).toLocaleString()}`;
}

// ============================================
// 네비게이션
// ============================================
function initNavigation() {
  document.getElementById('nextStep1')?.addEventListener('click', () => goToStep(2));
  document.getElementById('backStep2')?.addEventListener('click', () => goToStep(1));
  document.getElementById('nextStep2')?.addEventListener('click', () => goToStep(3));
  document.getElementById('backStep3')?.addEventListener('click', () => goToStep(2));
}

function goToStep(step) {
  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`step${step}`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 결제
// ============================================
function initPayment() {
  document.getElementById('payButton')?.addEventListener('click', processPayment);
}

async function processPayment() {
  if (!APP_STATE.selectedPackage || !APP_STATE.privacyAgreed || !APP_STATE.customerEmail) {
    showToast('필수 정보를 확인해주세요', 'warning');
    return;
  }
  
  const pkg = PRICING[APP_STATE.selectedPackage];
  let total = pkg.price;
  APP_STATE.bumpOffers.forEach(id => { if (BUMP_OFFERS[id]) total += BUMP_OFFERS[id].price; });
  
  const orderId = `SANTA-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
  
  localStorage.setItem('lastOrder', JSON.stringify({
    orderId, childName: APP_STATE.childInfo.name, packageName: pkg.name, amount: total
  }));
  
  try {
    await fetch('/api/payment/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId, amount: total,
        packageId: APP_STATE.selectedPackage,
        bumpOffers: APP_STATE.bumpOffers,
        childInfo: APP_STATE.childInfo,
        customerEmail: APP_STATE.customerEmail,
        photoFilename: APP_STATE.uploadedPhoto
      })
    });
    
    const toss = TossPayments(TOSS_CLIENT_KEY);
    await toss.requestPayment('카드', {
      amount: total,
      orderId,
      orderName: `🎅 ${pkg.name}`,
      customerName: APP_STATE.childInfo.name + ' 보호자',
      successUrl: `${location.origin}/payment/success`,
      failUrl: `${location.origin}/payment/fail`
    });
  } catch (e) {
    if (e.code !== 'USER_CANCEL') showToast('결제 오류: ' + e.message, 'error');
  }
}

// ============================================
// FAQ 토글
// ============================================
function initFaq() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', function() {
      const item = this.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      
      // 모두 닫기
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      
      // 클릭한 것만 토글
      if (!isOpen) item.classList.add('open');
    });
  });
}

// 전역 함수로 노출 (onclick에서 사용 - 백업용)
window.toggleFaq = function(el) {
  const item = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
};
window.showPrivacyPolicy = function() {
  document.getElementById('privacyModal')?.classList.add('show');
};
window.closeModal = function(id) {
  document.getElementById(id)?.classList.remove('show');
};

// ============================================
// 47개 리뷰 렌더링
// ============================================
function renderReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  
  const reviews = [
    { name: '김**맘', text: '아이가 사진 보고 "엄마 진짜 산타야!!" 하면서 눈물 글썽거렸어요 ㅠㅠ 평생 간직할 추억이 됐습니다', date: '12.24' },
    { name: '이**', text: '퀄리티가 진짜 미쳤어요!! 그림자랑 조명까지 완벽해서 합성인지 전혀 모르겠어요', date: '12.24' },
    { name: '박**', text: '급행으로 했는데 20분만에 왔어요! 크리스마스 아침에 보여줬는데 아이가 뛰어다녔어요', date: '12.24' },
    { name: '최**맘', text: '작년에도 했는데 올해도 또 했어요! 아이가 아직도 작년 사진 보면서 좋아해요', date: '12.24' },
    { name: '정**', text: '영상까지 했는데 산타가 움직이면서 선물 놓는 거 보고 아이가 소리질렀어요 ㅋㅋ', date: '12.24' },
    { name: '강**맘', text: '7살 딸이 산타 안 믿기 시작했는데 이거 보여주니까 다시 믿어요 ㅋㅋ', date: '12.24' },
    { name: '조**', text: '처음엔 반신반의했는데 결과물 보고 입 떡 벌어졌어요. 너무 자연스러워요', date: '12.24' },
    { name: '윤**', text: '아이 둘이서 서로 "내가 착해서 산타 온 거야" 싸워요 ㅋㅋ 행복한 크리스마스!', date: '12.24' },
    { name: '장**맘', text: '가격 대비 퀄리티 미쳤어요. 이 가격에 이 퀄리티? 5만원 받아도 할 것 같아요', date: '12.24' },
    { name: '임**', text: '남편이 "이거 어떻게 한 거야?" 하면서 한참 들여다봤어요 ㅋㅋ', date: '12.24' },
    { name: '한**맘', text: '6살 아들이 사진 들고 유치원 갔어요. 친구들한테 자랑한대요 ㅎㅎ', date: '12.24' },
    { name: '신**', text: '우리 집 거실이랑 너무 잘 맞아서 깜빡 속을 뻔했어요 진짜', date: '12.24' },
    { name: '서**맘', text: '인증서까지 받았는데 아이가 벽에 붙여놨어요 ㅋㅋ 너무 좋아해요', date: '12.24' },
    { name: '권**', text: '이메일로 바로 와서 편했어요. 다운로드도 쉽고요!', date: '12.24' },
    { name: '황**맘', text: '친정엄마한테 보여드렸더니 깜짝 놀라셨어요 ㅋㅋ 진짜인 줄', date: '12.24' },
    { name: '안**', text: '4살 딸이 "산타 또 와?" 하면서 매일 물어봐요 귀여워 죽겠어요', date: '12.23' },
    { name: '송**맘', text: '급행 추가했는데 정말 30분 만에 왔어요! 믿고 맡기세요', date: '12.23' },
    { name: '류**', text: '작년에 다른 데서 했는데 별로였거든요. 여긴 진짜 다르네요', date: '12.23' },
    { name: '홍**맘', text: '사진 3장 다 다른 포즈라 골라서 보여주기 좋아요', date: '12.23' },
    { name: '문**', text: '아이가 "산타 할아버지 우리 집 알아?" 하면서 신기해해요', date: '12.23' },
    { name: '양**맘', text: '트리 옆에 산타가 서있는 거 보고 아이가 멍때렸어요 ㅋㅋ', date: '12.23' },
    { name: '배**', text: '영상에서 산타가 손 흔드는 거 보고 아이가 따라 흔들었어요 ㅠㅠ', date: '12.23' },
    { name: '백**맘', text: '시댁에서도 신기해하셨어요 ㅋㅋ 시어머니가 저한테 뭐냐고', date: '12.23' },
    { name: '노**', text: '5살 조카 선물로 해줬는데 언니가 너무 좋아했어요!', date: '12.23' },
    { name: '하**맘', text: '둘째도 해줘야 할 것 같아서 추가 주문했어요 ㅋㅋ', date: '12.23' },
    { name: '전**', text: '거실 조명이랑 완벽하게 맞춰주셨어요 대박', date: '12.23' },
    { name: '심**맘', text: '아이가 산타 사진 액자에 넣어달라고 해서 넣어줬어요', date: '12.23' },
    { name: '오**', text: '인스타에 올렸더니 다들 어떻게 한 거냐고 물어봐요 ㅋㅋ', date: '12.23' },
    { name: '주**맘', text: '8살인데도 완전 믿어요 ㅋㅋ 순수해서 그런가', date: '12.23' },
    { name: '우**', text: '선물 놓는 포즈가 진짜 자연스러워요 감탄했어요', date: '12.23' },
    { name: '민**맘', text: '아이 방에서 찍은 사진으로 했는데 너무 잘 나왔어요!', date: '12.23' },
    { name: '유**', text: '처음엔 좀 걱정했는데 결과물 받고 걱정이 사라졌어요', date: '12.23' },
    { name: '나**맘', text: '크리스마스 선물 중에 이게 제일 반응 좋았어요 ㅋㅋ', date: '12.23' },
    { name: '차**', text: '빠른 답변이랑 친절한 서비스 감사해요!', date: '12.23' },
    { name: '성**맘', text: '매년 하기로 했어요 ㅋㅋ 아이가 커도 계속 할 예정', date: '12.23' },
    { name: '곽**', text: '영상 퀄리티가 생각보다 훨씬 좋아서 놀랐어요', date: '12.23' },
    { name: '변**맘', text: '이웃집 아이도 해주고 싶을 정도예요 추천합니다!', date: '12.23' },
    { name: '공**', text: '산타 표정이 진짜 자연스러워요 AI 맞아요? ㅋㅋ', date: '12.23' },
    { name: '진**맘', text: '아이가 매일 사진 보면서 산타 얘기해요 ㅠㅠ 감동', date: '12.23' },
    { name: '남**', text: '친구들한테도 추천했어요 다들 만족하더라고요', date: '12.23' },
    { name: '여**맘', text: '가족 단톡방에 올렸더니 다들 신기해해요', date: '12.23' },
    { name: '도**', text: '배경이 우리 집이라 더 실감나요 완전 추천!', date: '12.23' },
    { name: '추**맘', text: '아이가 "나 착하게 살았지?" 하면서 확인해요 ㅋㅋ', date: '12.23' },
    { name: '엄**', text: '사진 인화해서 거실에 걸어뒀어요 손님들 다 놀라요', date: '12.23' },
    { name: '표**맘', text: '내년에도 꼭 하려고요! 가격도 착하고 퀄리티도 최고', date: '12.23' },
    { name: '감**', text: '우리 아이 크리스마스 최고의 선물이었어요 감사합니다', date: '12.23' },
    { name: '채**맘', text: '아이가 산타 할아버지 팬이 됐어요 ㅋㅋㅋ 너무 좋아해요', date: '12.23' }
  ];
  
  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <span class="reviewer">${r.name}</span>
        <span class="review-rating">⭐⭐⭐⭐⭐</span>
      </div>
      <p class="review-text">${r.text}</p>
      <span class="review-date">25.${r.date}</span>
    </div>
  `).join('');
}

// ============================================
// 실시간 주문 알림
// ============================================
function startOrderNotifications() {
  const names = ['김**','이**','박**','최**','정**','강**','조**','윤**','장**','임**','한**','신**','서**','권**','황**'];
  const packages = ['산타 포착 사진','산타 선물세트','영상만','산타의 마법 영상'];
  
  function show() {
    const notif = document.getElementById('orderNotification');
    const name = document.getElementById('notifName');
    const pkg = document.getElementById('notifPackage');
    if (!notif) return;
    
    name.textContent = names[Math.floor(Math.random() * names.length)];
    pkg.textContent = packages[Math.floor(Math.random() * packages.length)];
    
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 4000);
  }
  
  setTimeout(() => {
    show();
    setInterval(show, 20000 + Math.random() * 10000);
  }, 8000);
}

// ============================================
// 유틸리티
// ============================================
function showToast(msg, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:${type==='success'?'#4CAF50':type==='warning'?'#ff9800':'#333'};
    color:white; padding:12px 24px; border-radius:25px; z-index:9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
