/**
 * 🎅 산타를 만난 순간 - Frontend JavaScript
 * 품질 체크 + 개인정보 동의 + 토스페이먼츠 통합
 */

// ============================================
// 전역 상태
// ============================================
const APP_STATE = {
  currentStep: 1,
  uploadedPhoto: null,
  childInfo: {
    name: '',
    age: '',
    message: ''
  },
  selectedPackage: null,
  bumpOffers: [],
  orderId: null,
  privacyAgreed: false
};

// 가격 데이터
const PRICING = {
  tripwire: { id: 'tripwire', price: 1900, originalPrice: 5000, name: '산타 포착 사진' },
  core: { id: 'core', price: 9900, originalPrice: 25000, name: '산타의 선물 세트', popular: true },
  premium: { id: 'premium', price: 24900, originalPrice: 59000, name: '산타의 마법 영상' }
};

const BUMP_OFFERS = {
  certificate: { id: 'certificate', price: 2900, name: '🎖️ 착한아이 인증서' },
  extraPhoto: { id: 'extraPhoto', price: 3900, name: '📸 추가 사진 2장' },
  rush: { id: 'rush', price: 4900, name: '⚡ 30분 급행' }
};

// 토스페이먼츠 클라이언트 키 (서버에서 받아옴)
let TOSS_CLIENT_KEY = '';

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // 서버에서 설정 가져오기
  try {
    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    TOSS_CLIENT_KEY = config.tossClientKey;
    console.log('✅ 토스 클라이언트 키 로드 완료');
  } catch (e) {
    console.error('❌ Config 로드 실패:', e);
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
  updateRemainingSlots();
  
  console.log('🎅 산타를 만난 순간 - App Initialized');
});

// ============================================
// 긴급성 카운트다운
// ============================================
function initCountdown() {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;
  
  const christmas = new Date('2024-12-26T00:00:00+09:00');
  
  function update() {
    const now = new Date();
    const diff = christmas - now;
    
    if (diff <= 0) {
      countdownEl.textContent = '종료!';
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    countdownEl.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  update();
  setInterval(update, 1000);
}

function updateRemainingSlots() {
  const slotsEl = document.getElementById('remainingSlots');
  if (slotsEl) {
    // 랜덤하게 줄어드는 효과
    let slots = 100 - Math.floor(Math.random() * 20);
    slotsEl.textContent = slots;
  }
}

// ============================================
// STEP 1: 사진 업로드 + 품질 체크
// ============================================
function initUploader() {
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const cameraBtn = document.getElementById('cameraBtn');
  const galleryBtn = document.getElementById('galleryBtn');
  const placeholder = document.getElementById('uploadPlaceholder');
  const previewContainer = document.getElementById('previewContainer');
  const retryBtn = document.getElementById('retryBtn');
  const nextBtn = document.getElementById('nextStep1');
  
  if (!uploadArea || !photoInput) return;
  
  // 카메라 버튼
  if (cameraBtn) {
    cameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.setAttribute('capture', 'environment');
      photoInput.value = '';
      photoInput.click();
    });
  }
  
  // 갤러리 버튼
  if (galleryBtn) {
    galleryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.removeAttribute('capture');
      photoInput.value = '';
      photoInput.click();
    });
  }
  
  // placeholder 클릭
  if (placeholder) {
    placeholder.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.removeAttribute('capture');
      photoInput.value = '';
      photoInput.click();
    });
  }
  
  // 파일 선택
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePhotoUpload(file);
    }
  });
  
  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handlePhotoUpload(file);
    }
  });
  
  // 다시 찍기
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      photoInput.value = '';
      uploadArea.style.display = 'block';
      if (previewContainer) previewContainer.style.display = 'none';
      if (nextBtn) nextBtn.disabled = true;
      APP_STATE.uploadedPhoto = null;
    });
  }
}

// ============================================
// 🔥 진짜 품질 체크 함수
// ============================================
async function handlePhotoUpload(file) {
  const uploadArea = document.getElementById('uploadArea');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const qualityBadge = document.getElementById('qualityBadge');
  const nextBtn = document.getElementById('nextStep1');
  const overlay = document.getElementById('qualityOverlay');
  
  // 오버레이 표시
  if (overlay) overlay.classList.add('show');
  
  // 미리보기 준비
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  try {
    // 품질 체크 실행
    const qualityResult = await checkImageQuality(file);
    
    // 오버레이 숨기기
    if (overlay) overlay.classList.remove('show');
    
    // 미리보기 표시
    uploadArea.style.display = 'none';
    previewContainer.style.display = 'block';
    
    if (qualityResult.pass) {
      // 서버에 업로드
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        APP_STATE.uploadedPhoto = result.filename;
        qualityBadge.querySelector('strong').textContent = qualityResult.score;
        qualityBadge.classList.remove('quality-bad');
        qualityBadge.classList.add('quality-good');
        nextBtn.disabled = false;
        showToast('✅ 완벽한 사진이에요!', 'success');
      }
    } else {
      // 품질 불합격
      qualityBadge.querySelector('strong').textContent = qualityResult.score;
      qualityBadge.classList.remove('quality-good');
      qualityBadge.classList.add('quality-bad');
      nextBtn.disabled = true;
      showToast('⚠️ ' + qualityResult.message, 'warning');
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    if (overlay) overlay.classList.remove('show');
    
    // 에러 시에도 진행 가능
    uploadArea.style.display = 'none';
    previewContainer.style.display = 'block';
    APP_STATE.uploadedPhoto = file;
    qualityBadge.querySelector('strong').textContent = '확인중';
    nextBtn.disabled = false;
    showToast('📶 오프라인 모드로 진행합니다', 'info');
  }
}

// ============================================
// 🔥 Canvas API로 실제 이미지 품질 분석
// ============================================
async function checkImageQuality(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        // Canvas로 이미지 분석
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 분석용 크기로 리사이즈
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 1. 밝기 체크
        updateQualityCheck('checkBrightness', 'checking');
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        const brightnessOk = avgBrightness > 40 && avgBrightness < 220;
        
        setTimeout(() => {
          updateQualityCheck('checkBrightness', brightnessOk ? 'pass' : 'fail');
          updateProgress(33);
        }, 500);
        
        // 2. 선명도/흔들림 체크 (라플라시안 분산)
        setTimeout(() => {
          updateQualityCheck('checkSharpness', 'checking');
        }, 600);
        
        let sharpnessScore = 0;
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * canvas.width + x) * 4;
            const laplacian = 
              -data[idx - canvas.width * 4] - data[idx - 4] + 
              4 * data[idx] - 
              data[idx + 4] - data[idx + canvas.width * 4];
            sharpnessScore += Math.abs(laplacian);
          }
        }
        const avgSharpness = sharpnessScore / (canvas.width * canvas.height);
        const sharpnessOk = avgSharpness > 5; // 너무 흐리면 실패
        
        setTimeout(() => {
          updateQualityCheck('checkSharpness', sharpnessOk ? 'pass' : 'fail');
          updateProgress(66);
        }, 1000);
        
        // 3. 해상도 체크
        setTimeout(() => {
          updateQualityCheck('checkResolution', 'checking');
        }, 1100);
        
        const resolutionOk = img.width >= 500 && img.height >= 500;
        
        setTimeout(() => {
          updateQualityCheck('checkResolution', resolutionOk ? 'pass' : 'fail');
          updateProgress(100);
        }, 1500);
        
        // 최종 결과
        setTimeout(() => {
          const allPass = brightnessOk && sharpnessOk && resolutionOk;
          let score = 50;
          if (brightnessOk) score += 20;
          if (sharpnessOk) score += 20;
          if (resolutionOk) score += 10;
          
          let message = '';
          if (!brightnessOk) message = '사진이 너무 어둡거나 밝아요. 조명을 확인해주세요.';
          else if (!sharpnessOk) message = '사진이 흔들렸어요. 다시 찍어주세요.';
          else if (!resolutionOk) message = '해상도가 너무 낮아요. 더 가까이서 찍어주세요.';
          
          const title = document.getElementById('qualityTitle');
          const msg = document.getElementById('qualityMessage');
          
          if (title) title.textContent = allPass ? '✅ 완벽해요!' : '⚠️ 다시 찍어주세요';
          if (msg) msg.textContent = allPass ? '산타 합성에 딱 좋은 사진이에요!' : message;
          
          resolve({
            pass: allPass,
            score: score,
            message: message,
            details: {
              brightness: { ok: brightnessOk, value: avgBrightness },
              sharpness: { ok: sharpnessOk, value: avgSharpness },
              resolution: { ok: resolutionOk, width: img.width, height: img.height }
            }
          });
        }, 2000);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateQualityCheck(checkId, status) {
  const el = document.getElementById(checkId);
  if (!el) return;
  
  el.classList.remove('pass', 'fail', 'checking');
  
  const icon = el.querySelector('.check-icon');
  if (status === 'checking') {
    icon.textContent = '🔄';
  } else if (status === 'pass') {
    el.classList.add('pass');
    icon.textContent = '✅';
  } else if (status === 'fail') {
    el.classList.add('fail');
    icon.textContent = '❌';
  } else {
    icon.textContent = '⏳';
  }
}

function updateProgress(percent) {
  const bar = document.getElementById('qualityProgressBar');
  if (bar) bar.style.width = percent + '%';
}

// ============================================
// STEP 2: 아이 정보 입력
// ============================================
function initFormValidation() {
  const childName = document.getElementById('childName');
  const childAge = document.getElementById('childAge');
  const santaMessage = document.getElementById('santaMessage');
  const charCount = document.getElementById('charCount');
  const nextBtn = document.getElementById('nextStep2');
  
  if (!childName || !nextBtn) return;
  
  function validateForm() {
    const isValid = childName.value.trim().length >= 1;
    nextBtn.disabled = !isValid;
    return isValid;
  }
  
  childName.addEventListener('input', () => {
    APP_STATE.childInfo.name = childName.value.trim();
    validateForm();
    const nameDisplay = document.getElementById('childNameDisplay');
    if (nameDisplay) nameDisplay.textContent = childName.value.trim() || '아이';
  });
  
  if (childAge) {
    childAge.addEventListener('change', () => {
      APP_STATE.childInfo.age = childAge.value;
    });
  }
  
  if (santaMessage && charCount) {
    santaMessage.addEventListener('input', () => {
      APP_STATE.childInfo.message = santaMessage.value;
      charCount.textContent = santaMessage.value.length;
    });
  }
}

// ============================================
// STEP 3: 패키지 선택
// ============================================
function initPackageSelection() {
  const cards = document.querySelectorAll('.price-card');
  const payBtn = document.getElementById('payButton');
  
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      APP_STATE.selectedPackage = card.dataset.package;
      updatePriceSummary();
      checkPaymentReady();
    });
  });
}

function initBumpOffers() {
  const bumps = document.querySelectorAll('.bump-item input');
  
  bumps.forEach(bump => {
    bump.addEventListener('change', () => {
      if (bump.checked) {
        APP_STATE.bumpOffers.push(bump.value);
      } else {
        APP_STATE.bumpOffers = APP_STATE.bumpOffers.filter(b => b !== bump.value);
      }
      updatePriceSummary();
    });
  });
}

// ============================================
// 🔥 개인정보 동의
// ============================================
function initPrivacyConsent() {
  const checkbox = document.getElementById('privacyAgree');
  if (!checkbox) return;
  
  checkbox.addEventListener('change', () => {
    APP_STATE.privacyAgreed = checkbox.checked;
    checkPaymentReady();
  });
}

function checkPaymentReady() {
  const payBtn = document.getElementById('payButton');
  if (!payBtn) return;
  
  const isReady = APP_STATE.selectedPackage && APP_STATE.privacyAgreed;
  payBtn.disabled = !isReady;
}

function updatePriceSummary() {
  const summaryPackage = document.getElementById('summaryPackage');
  const summaryBumps = document.getElementById('summaryBumps');
  const summaryBumpsRow = document.getElementById('summaryBumpsRow');
  const summaryTotal = document.getElementById('summaryTotal');
  const savingsEl = document.getElementById('savingsAmount');
  const savingsRow = document.getElementById('savingsRow');
  
  if (!APP_STATE.selectedPackage) return;
  
  const pkg = PRICING[APP_STATE.selectedPackage];
  let total = pkg.price;
  let original = pkg.originalPrice;
  
  if (summaryPackage) {
    summaryPackage.textContent = `${pkg.name} ₩${pkg.price.toLocaleString()}`;
  }
  
  const bumpNames = [];
  APP_STATE.bumpOffers.forEach(bumpId => {
    const bump = BUMP_OFFERS[bumpId];
    if (bump) {
      total += bump.price;
      original += bump.price;
      bumpNames.push(bump.name);
    }
  });
  
  if (summaryBumpsRow && summaryBumps) {
    if (bumpNames.length > 0) {
      summaryBumps.textContent = bumpNames.join(', ');
      summaryBumpsRow.style.display = 'flex';
    } else {
      summaryBumpsRow.style.display = 'none';
    }
  }
  
  if (summaryTotal) {
    summaryTotal.textContent = `₩${total.toLocaleString()}`;
  }
  
  const savings = original - total;
  if (savingsEl && savingsRow) {
    if (savings > 0) {
      savingsEl.textContent = `₩${savings.toLocaleString()}`;
      savingsRow.style.display = 'flex';
    } else {
      savingsRow.style.display = 'none';
    }
  }
}

// ============================================
// 네비게이션
// ============================================
function initNavigation() {
  const nextStep1 = document.getElementById('nextStep1');
  if (nextStep1) {
    nextStep1.addEventListener('click', () => goToStep(2));
  }
  
  const backStep2 = document.getElementById('backStep2');
  if (backStep2) {
    backStep2.addEventListener('click', () => goToStep(1));
  }
  
  const nextStep2 = document.getElementById('nextStep2');
  if (nextStep2) {
    nextStep2.addEventListener('click', () => {
      const nameDisplay = document.getElementById('childNameDisplay');
      if (nameDisplay && APP_STATE.childInfo.name) {
        nameDisplay.textContent = APP_STATE.childInfo.name;
      }
      goToStep(3);
    });
  }
  
  const backStep3 = document.getElementById('backStep3');
  if (backStep3) {
    backStep3.addEventListener('click', () => goToStep(2));
  }
}

function goToStep(step) {
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const targetStep = document.getElementById(`step${step}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }
  
  APP_STATE.currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 결제 처리
// ============================================
function initPayment() {
  const payButton = document.getElementById('payButton');
  if (!payButton) return;
  
  payButton.addEventListener('click', async () => {
    if (!APP_STATE.selectedPackage) {
      showToast('패키지를 선택해주세요', 'warning');
      return;
    }
    
    if (!APP_STATE.privacyAgreed) {
      showToast('개인정보 처리방침에 동의해주세요', 'warning');
      return;
    }
    
    if (!APP_STATE.childInfo.name) {
      showToast('아이 이름을 입력해주세요', 'warning');
      goToStep(2);
      return;
    }
    
    await processPayment();
  });
}

async function processPayment() {
  const pkg = PRICING[APP_STATE.selectedPackage];
  let totalAmount = pkg.price;
  
  APP_STATE.bumpOffers.forEach(bumpId => {
    const bump = BUMP_OFFERS[bumpId];
    if (bump) totalAmount += bump.price;
  });
  
  const orderId = `SANTA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  APP_STATE.orderId = orderId;
  
  // 로컬스토리지에 주문 정보 저장 (success 페이지에서 사용)
  localStorage.setItem('lastOrder', JSON.stringify({
    orderId,
    childName: APP_STATE.childInfo.name,
    packageName: pkg.name,
    amount: totalAmount
  }));
  
  try {
    // 서버에 주문 생성
    const prepareResponse = await fetch('/api/payment/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount: totalAmount,
        packageId: APP_STATE.selectedPackage,
        bumpOffers: APP_STATE.bumpOffers,
        childInfo: APP_STATE.childInfo,
        photoFilename: typeof APP_STATE.uploadedPhoto === 'string' 
          ? APP_STATE.uploadedPhoto 
          : 'pending'
      })
    });
    
    const prepareResult = await prepareResponse.json();
    
    if (!prepareResult.success) {
      throw new Error(prepareResult.message || '주문 준비 실패');
    }
    
    // 토스페이먼츠 결제창 호출
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    
    await tossPayments.requestPayment('카드', {
      amount: totalAmount,
      orderId: orderId,
      orderName: `🎅 ${pkg.name}${APP_STATE.bumpOffers.length > 0 ? ' + 추가옵션' : ''}`,
      customerName: APP_STATE.childInfo.name + ' 보호자',
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    
    if (error.code === 'USER_CANCEL') {
      showToast('결제가 취소되었습니다', 'info');
    } else {
      showToast('결제 처리 중 오류: ' + error.message, 'error');
    }
  }
}

// ============================================
// 유틸리티
// ============================================
function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#333'};
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 14px;
    z-index: 9999;
    animation: toastIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 모달 함수
function showPrivacyPolicy() {
  const modal = document.getElementById('privacyModal');
  if (modal) modal.classList.add('show');
}

function showTerms() {
  alert('이용약관은 준비 중입니다.');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

// 스타일 추가
const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes toastOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
  }
`;
document.head.appendChild(style);
