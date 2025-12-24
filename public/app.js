/**
 * 🎅 산타를 만난 순간 - Frontend JavaScript
 * 러셀 브런슨 퍼널 + 토스페이먼츠 통합
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
  orderId: null
};

// 가격 데이터 (서버와 동기화)
const PRICING = {
  tripwire: { id: 'tripwire', price: 1900, originalPrice: 5000, name: '산타 포착 사진' },
  core: { id: 'core', price: 9900, originalPrice: 24900, name: '산타의 선물', popular: true },
  premium: { id: 'premium', price: 24900, originalPrice: 59900, name: 'VIP 마법의 크리스마스' }
};

const BUMP_OFFERS = {
  certificate: { id: 'certificate', price: 2900, name: '🎖️ 착한아이 인증서' },
  extraPhoto: { id: 'extraPhoto', price: 3900, name: '📸 추가 사진 2장' },
  rush: { id: 'rush', price: 4900, name: '⚡ 30분 급행' },
  letter: { id: 'letter', price: 2900, name: '💌 산타 손편지' }
};

// 토스페이먼츠 클라이언트 키 (테스트용)
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initUploader();
  initFormValidation();
  initPackageSelection();
  initBumpOffers();
  initPayment();
  initNavigation();
  updateRemainingSlots();
});

// ============================================
// 긴급성 카운트다운
// ============================================
function initCountdown() {
  const countdownEl = document.getElementById('countdown');
  
  // 크리스마스 자정까지
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
    
    countdownEl.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  update();
  setInterval(update, 1000);
}

function updateRemainingSlots() {
  const slotsEl = document.getElementById('remainingSlots');
  // 랜덤하게 감소하는 효과 (실제로는 서버에서)
  let slots = Math.floor(Math.random() * 20) + 15;
  slotsEl.textContent = slots;
  
  setInterval(() => {
    if (Math.random() > 0.7 && slots > 5) {
      slots--;
      slotsEl.textContent = slots;
    }
  }, 30000);
}

// ============================================
// STEP 1: 사진 업로드 (카메라 + 갤러리 분리)
// ============================================
function initUploader() {
  const uploadArea = document.getElementById('uploadArea');
  const photoInput = document.getElementById('photoInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const qualityBadge = document.getElementById('qualityBadge');
  const retryBtn = document.getElementById('retryBtn');
  const nextBtn = document.getElementById('nextStep1');
  
  // Null 체크
  if (!uploadArea || !photoInput) {
    console.warn('initUploader: 필수 요소 없음');
    return;
  }
  
  // === 카메라/갤러리 버튼 동적 추가 ===
  const uploadButtons = document.createElement('div');
  uploadButtons.className = 'upload-buttons';
  uploadButtons.innerHTML = `
    <button type="button" class="upload-btn camera" id="cameraBtn">
      📷 카메라로 촬영
    </button>
    <button type="button" class="upload-btn gallery" id="galleryBtn">
      🖼️ 앨범에서 선택
    </button>
  `;
  
  // upload-placeholder 뒤에 버튼 추가
  const placeholder = uploadArea.querySelector('.upload-placeholder');
  if (placeholder) {
    placeholder.after(uploadButtons);
  } else {
    uploadArea.appendChild(uploadButtons);
  }
  
  const cameraBtn = document.getElementById('cameraBtn');
  const galleryBtn = document.getElementById('galleryBtn');
  
  // 카메라 버튼 - 실시간 촬영
  if (cameraBtn) {
    cameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.setAttribute('capture', 'environment'); // 후면 카메라
      photoInput.value = '';
      photoInput.click();
    });
  }
  
  // 갤러리 버튼 - 앨범 선택
  if (galleryBtn) {
    galleryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.removeAttribute('capture');
      photoInput.value = '';
      photoInput.click();
    });
  }
  
  // 영역 클릭은 갤러리로 (placeholder 클릭 시)
  if (placeholder) {
    placeholder.addEventListener('click', (e) => {
      e.stopPropagation();
      photoInput.removeAttribute('capture');
      photoInput.value = '';
      photoInput.click();
    });
  }
  
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
  
  // 파일 선택
  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
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
} // initUploader 함수 끝

async function handlePhotoUpload(file) {
  const uploadArea = document.getElementById('uploadArea');
  const previewContainer = document.getElementById('previewContainer');
  const previewImage = document.getElementById('previewImage');
  const qualityBadge = document.getElementById('qualityBadge');
  const nextBtn = document.getElementById('nextStep1');
  
  // 미리보기 표시
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadArea.style.display = 'none';
    previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  // 품질 체크 (서버로 전송)
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    showToast('🔍 사진 품질 확인 중...', 'info');
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      APP_STATE.uploadedPhoto = result.filename;
      qualityBadge.querySelector('strong').textContent = result.quality || '95';
      qualityBadge.classList.add('quality-good');
      nextBtn.disabled = false;
      showToast('✅ 완벽한 사진이에요!', 'success');
    } else {
      qualityBadge.querySelector('strong').textContent = '낮음';
      qualityBadge.classList.add('quality-bad');
      showToast('⚠️ ' + (result.message || '다시 촬영해주세요'), 'warning');
    }
  } catch (error) {
    console.error('Upload error:', error);
    // 오프라인이거나 서버 에러 시에도 진행 가능하게
    APP_STATE.uploadedPhoto = file;
    qualityBadge.querySelector('strong').textContent = '확인중';
    nextBtn.disabled = false;
    showToast('📶 오프라인 모드로 진행합니다', 'info');
  }
}

// ============================================
// STEP 2: 아이 정보 입력 (버그 수정: santaMessage)
// ============================================
function initFormValidation() {
  const childName = document.getElementById('childName');
  const childAge = document.getElementById('childAge');
  const santaMessage = document.getElementById('santaMessage'); // 수정됨!
  const charCount = document.getElementById('charCount');
  const nextBtn = document.getElementById('nextStep2');
  
  // Null 체크 추가 (방어적 코딩)
  if (!childName || !nextBtn) {
    console.warn('initFormValidation: 필수 요소 없음');
    return;
  }
  
  function validateForm() {
    const isValid = childName.value.trim().length >= 1;
    nextBtn.disabled = !isValid;
    return isValid;
  }
  
  childName.addEventListener('input', () => {
    APP_STATE.childInfo.name = childName.value.trim();
    validateForm();
    // STEP 3에서 아이 이름 표시 업데이트
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
      const text = santaMessage.value;
      const count = text.length;
      charCount.textContent = count; // HTML: 0/80 형식이므로 숫자만
      
      if (count > 80) {
        santaMessage.value = text.slice(0, 80);
        charCount.textContent = '80';
      }
      
      APP_STATE.childInfo.message = santaMessage.value;
    });
  }
}

// ============================================
// STEP 3: 패키지 선택 (클래스명 수정: price-card)
// ============================================
function initPackageSelection() {
  const packageCards = document.querySelectorAll('.price-card');
  
  if (packageCards.length === 0) {
    console.warn('initPackageSelection: 패키지 카드 없음');
    return;
  }
  
  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      // 이전 선택 해제
      packageCards.forEach(c => c.classList.remove('selected'));
      
      // 새 선택
      card.classList.add('selected');
      
      const packageId = card.dataset.package;
      APP_STATE.selectedPackage = packageId;
      
      updatePriceSummary();
      const payBtn = document.getElementById('payButton');
      if (payBtn) payBtn.disabled = false;
    });
  });
}

function initBumpOffers() {
  const bumpCheckboxes = document.querySelectorAll('.bump-item input[type="checkbox"]');
  
  bumpCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const bumpItem = checkbox.closest('.bump-item');
      const bumpId = checkbox.value; // value 속성 사용
      
      if (checkbox.checked) {
        if (!APP_STATE.bumpOffers.includes(bumpId)) {
          APP_STATE.bumpOffers.push(bumpId);
        }
        if (bumpItem) bumpItem.classList.add('selected');
      } else {
        APP_STATE.bumpOffers = APP_STATE.bumpOffers.filter(id => id !== bumpId);
        if (bumpItem) bumpItem.classList.remove('selected');
      }
      
      updatePriceSummary();
    });
  });
}

function updatePriceSummary() {
  const totalEl = document.getElementById('totalPrice');
  const originalEl = document.getElementById('originalPrice');
  const savingsEl = document.getElementById('savingsAmount');
  const savingsRow = document.getElementById('savingsRow');
  
  if (!APP_STATE.selectedPackage) return;
  
  const pkg = PRICING[APP_STATE.selectedPackage];
  let total = pkg.price;
  let original = pkg.originalPrice;
  
  // 범프 오퍼 추가
  APP_STATE.bumpOffers.forEach(bumpId => {
    const bump = BUMP_OFFERS[bumpId];
    if (bump) {
      total += bump.price;
      original += bump.price;
    }
  });
  
  totalEl.textContent = `₩${total.toLocaleString()}`;
  originalEl.textContent = `₩${original.toLocaleString()}`;
  
  const savings = original - total;
  if (savings > 0) {
    savingsEl.textContent = `₩${savings.toLocaleString()}`;
    savingsRow.style.display = 'flex';
  }
}

// ============================================
// 네비게이션
// ============================================
function initNavigation() {
  // Step 1 → 2
  document.getElementById('nextStep1').addEventListener('click', () => {
    goToStep(2);
  });
  
  // Step 2 → 1
  document.getElementById('backStep2').addEventListener('click', () => {
    goToStep(1);
  });
  
  // Step 2 → 3
  document.getElementById('nextStep2').addEventListener('click', () => {
    goToStep(3);
  });
  
  // Step 3 → 2
  document.getElementById('backStep3').addEventListener('click', () => {
    goToStep(2);
  });
}

function goToStep(step) {
  // 현재 스텝 숨기기
  document.querySelectorAll('.step-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // 새 스텝 표시
  document.getElementById(`step${step}`).classList.add('active');
  APP_STATE.currentStep = step;
  
  // 스크롤 최상단
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 결제 처리
// ============================================
function initPayment() {
  const payButton = document.getElementById('payButton');
  
  payButton.addEventListener('click', async () => {
    if (!APP_STATE.selectedPackage) {
      showToast('패키지를 선택해주세요', 'warning');
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
  
  // 범프 오퍼 추가
  APP_STATE.bumpOffers.forEach(bumpId => {
    const bump = BUMP_OFFERS[bumpId];
    if (bump) totalAmount += bump.price;
  });
  
  // 주문 ID 생성
  const orderId = `SANTA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  APP_STATE.orderId = orderId;
  
  try {
    // 1. 서버에 주문 생성
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
    
    // 2. 토스페이먼츠 결제창 호출
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
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 애니메이션
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // 3초 후 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoading(show = true, text = '산타가 준비 중이에요...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  
  if (show) {
    loadingText.textContent = text;
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

// 로딩 스텝 애니메이션
function animateLoadingSteps() {
  const steps = document.querySelectorAll('.loading-step');
  let currentStep = 0;
  
  const interval = setInterval(() => {
    if (currentStep > 0) {
      steps[currentStep - 1].classList.add('done');
    }
    
    if (currentStep < steps.length) {
      steps[currentStep].classList.add('active');
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 2000);
  
  return interval;
}

// ============================================
// CSS for Toast (인라인 추가)
// ============================================
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 90%;
    text-align: center;
  }
  
  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  
  .toast-info {
    background: #e3f2fd;
    color: #1565c0;
  }
  
  .toast-success {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .toast-warning {
    background: #fff3e0;
    color: #ef6c00;
  }
  
  .toast-error {
    background: #ffebee;
    color: #c62828;
  }
  
  /* 카메라/갤러리 버튼 */
  .upload-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .upload-btn {
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    border: none;
    min-width: 140px;
    justify-content: center;
  }
  
  .upload-btn.camera {
    background: linear-gradient(135deg, #D42426, #B01E20);
    color: white;
    box-shadow: 0 4px 15px rgba(212, 36, 38, 0.3);
  }
  
  .upload-btn.camera:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 36, 38, 0.4);
  }
  
  .upload-btn.gallery {
    background: #f3f4f6;
    color: #374151;
    border: 2px solid #e5e7eb;
  }
  
  .upload-btn.gallery:hover {
    background: #e5e7eb;
  }
  
  .upload-btn:active {
    transform: scale(0.95);
  }
  
  /* 패키지 카드 선택 상태 */
  .price-card.selected {
    border-color: #D42426 !important;
    box-shadow: 0 0 0 3px rgba(212, 36, 38, 0.2) !important;
    transform: scale(1.02);
  }
  
  /* Bump 아이템 선택 상태 */
  .bump-item.selected {
    background: rgba(212, 36, 38, 0.05);
    border-color: #D42426;
  }
`;
document.head.appendChild(toastStyles);

console.log('🎅 산타를 만난 순간 - App Initialized');
