<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>🎅 산타를 만난 순간 | 우리 집에 온 산타 증거</title>
  <script src="https://js.tosspayments.com/v1/payment"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- 실시간 주문 알림 -->
  <div class="order-notification" id="orderNotification">
    <div class="notif-icon">🎁</div>
    <div class="notif-content">
      <strong id="notifName">김**</strong>님이 <span id="notifPackage">산타의 선물 세트</span>를 주문했어요!
    </div>
  </div>

  <!-- 품질 체크 오버레이 -->
  <div class="quality-overlay" id="qualityOverlay">
    <div class="quality-modal">
      <div class="santa-checking">🎅</div>
      <h3 id="qualityTitle">산타가 사진을 확인중이에요...</h3>
      <p id="qualityMessage">AI 합성에 적합한지 검사하고 있어요</p>
      <div class="quality-progress">
        <div class="progress-bar" id="qualityProgressBar"></div>
      </div>
      <div class="quality-checklist">
        <div class="check-item" id="checkBrightness"><span class="check-icon">⏳</span><span>밝기 확인</span></div>
        <div class="check-item" id="checkSharpness"><span class="check-icon">⏳</span><span>흔들림 확인</span></div>
        <div class="check-item" id="checkResolution"><span class="check-icon">⏳</span><span>해상도 확인</span></div>
      </div>
    </div>
  </div>

  <div class="app-container">
    <!-- 긴급성 배너 -->
    <div class="urgency-banner">
      <span class="pulse-dot"></span>
      <span>🎄 크리스마스 특가! <strong id="countdown">--:--</strong> 후 종료</span>
      <span class="slots">남은 자리: <strong id="remainingSlots">47</strong>명</span>
    </div>

    <!-- 헤더 -->
    <header class="header">
      <h1>🎅 산타를 만난 순간</h1>
      <p class="tagline">아이에게 평생 잊지 못할 크리스마스를 선물하세요</p>
    </header>

    <!-- STEP 1: 사진 업로드 -->
    <section class="step-section active" id="step1">
      <div class="step-header">
        <span class="step-badge">STEP 1</span>
        <h2>거실 사진을 찍어주세요</h2>
        <p>산타가 선물을 놓고 갈 공간이에요</p>
      </div>

      <div class="upload-area" id="uploadArea">
        <div class="upload-placeholder" id="uploadPlaceholder">
          <span class="upload-icon">📷</span>
          <p>터치하여 사진 선택</p>
          <span class="upload-hint">트리나 거실이 잘 보이게 촬영해주세요</span>
        </div>
        <div class="upload-buttons">
          <button type="button" class="upload-btn camera" id="cameraBtn">📷 카메라</button>
          <button type="button" class="upload-btn gallery" id="galleryBtn">🖼️ 앨범</button>
        </div>
        <input type="file" id="photoInput" accept="image/*" hidden>
      </div>

      <div class="preview-container" id="previewContainer" style="display:none;">
        <img id="previewImage" src="" alt="미리보기">
        <div class="quality-badge" id="qualityBadge">
          <span class="quality-score">품질: <strong>--</strong>점</span>
        </div>
        <button class="btn-retry" id="retryBtn">다시 찍기</button>
      </div>

      <button class="btn-primary" id="nextStep1" disabled>다음 단계로 →</button>

      <div class="social-proof">
        <div class="proof-item"><strong>147</strong><span>오늘 주문</span></div>
        <div class="proof-item"><strong>⭐ 4.9</strong><span>만족도</span></div>
        <div class="proof-item"><strong>99%</strong><span>아이 반응</span></div>
      </div>
    </section>

    <!-- STEP 2: 정보 입력 + 이메일 -->
    <section class="step-section" id="step2">
      <div class="step-header">
        <span class="step-badge">STEP 2</span>
        <h2>정보를 입력해주세요</h2>
        <p>산타가 아이 이름을 불러줄 거예요</p>
      </div>

      <div class="form-card">
        <div class="form-group">
          <label for="childName">아이 이름 <span class="required">*</span></label>
          <input type="text" id="childName" placeholder="예: 민준이" maxlength="10">
        </div>
        
        <div class="form-group">
          <label for="childAge">나이</label>
          <select id="childAge">
            <option value="">선택</option>
            <option value="3">3세</option>
            <option value="4">4세</option>
            <option value="5">5세</option>
            <option value="6">6세</option>
            <option value="7">7세</option>
            <option value="8">8세 이상</option>
          </select>
        </div>

        <div class="form-group">
          <label for="santaMessage">산타에게 전할 말</label>
          <textarea id="santaMessage" placeholder="예: 올해 정말 착하게 지냈어요!" maxlength="100"></textarea>
          <span class="char-count"><span id="charCount">0</span>/100</span>
        </div>

        <div class="form-group">
          <label for="customerEmail">이메일 주소 <span class="required">*</span></label>
          <input type="email" id="customerEmail" placeholder="결과물을 받으실 이메일">
          <span class="email-hint">📩 완성된 산타 사진/영상을 이메일로 보내드려요</span>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn-secondary" id="backStep2">← 이전</button>
        <button class="btn-primary" id="nextStep2" disabled>다음 →</button>
      </div>
    </section>

    <!-- STEP 3: 패키지 선택 -->
    <section class="step-section" id="step3">
      <div class="step-header">
        <span class="step-badge">STEP 3</span>
        <h2><span id="childNameDisplay">아이</span>를 위한 패키지</h2>
      </div>

      <div class="packages">
        <div class="price-card" data-package="tripwire">
          <div class="price-header">
            <span class="package-emoji">📸</span>
            <h3>산타 포착 사진</h3>
          </div>
          <div class="price-body">
            <div class="price">
              <span class="original">₩5,000</span>
              <span class="current">₩1,900</span>
            </div>
            <div class="discount-badge">62% 할인</div>
            <ul class="features">
              <li>✓ 산타 합성 사진 1장</li>
              <li>✓ 고화질 다운로드</li>
              <li>✓ 24시간 내 이메일 전달</li>
            </ul>
          </div>
        </div>

        <div class="price-card popular" data-package="core">
          <div class="popular-badge">🔥 가장 인기</div>
          <div class="price-header">
            <span class="package-emoji">🎁</span>
            <h3>산타의 선물 세트</h3>
          </div>
          <div class="price-body">
            <div class="price">
              <span class="original">₩25,000</span>
              <span class="current">₩9,900</span>
            </div>
            <div class="discount-badge">60% 할인</div>
            <ul class="features">
              <li>✓ 산타 합성 사진 3장</li>
              <li>✓ 착한아이 인증서</li>
              <li>✓ 12시간 내 이메일 전달</li>
            </ul>
          </div>
        </div>

        <div class="price-card" data-package="premium">
          <div class="price-header">
            <span class="package-emoji">🎬</span>
            <h3>산타의 마법 영상</h3>
          </div>
          <div class="price-body">
            <div class="price">
              <span class="original">₩59,000</span>
              <span class="current">₩24,900</span>
            </div>
            <div class="discount-badge">58% 할인</div>
            <ul class="features">
              <li>✓ 사진 5장 + 영상 1편</li>
              <li>✓ 산타 음성 메시지</li>
              <li>✓ 6시간 급행 제작</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 범프 오퍼 -->
      <div class="bump-offers">
        <h4>🎄 추가 옵션</h4>
        <label class="bump-item">
          <input type="checkbox" name="bump" value="certificate">
          <div class="bump-content">
            <div class="bump-info"><span class="bump-icon">🎖️</span><span>착한아이 인증서</span></div>
            <span class="bump-price">+₩2,900</span>
          </div>
        </label>
        <label class="bump-item">
          <input type="checkbox" name="bump" value="extraPhoto">
          <div class="bump-content">
            <div class="bump-info"><span class="bump-icon">📸</span><span>추가 사진 2장</span></div>
            <span class="bump-price">+₩3,900</span>
          </div>
        </label>
        <label class="bump-item">
          <input type="checkbox" name="bump" value="rush">
          <div class="bump-content">
            <div class="bump-info"><span class="bump-icon">⚡</span><span>30분 급행</span></div>
            <span class="bump-price">+₩4,900</span>
          </div>
        </label>
      </div>

      <!-- 가격 요약 -->
      <div class="price-summary">
        <div class="summary-row">
          <span>선택 패키지</span>
          <span id="summaryPackage">-</span>
        </div>
        <div class="summary-row" id="summaryBumpsRow" style="display:none;">
          <span>추가 옵션</span>
          <span id="summaryBumps">-</span>
        </div>
        <div class="summary-row total">
          <span>총 결제금액</span>
          <span id="summaryTotal">₩0</span>
        </div>
        <div class="savings-highlight" id="savingsRow">
          <div class="savings-icon">🎉</div>
          <div class="savings-text">
            <span>지금 결제하면</span>
            <strong id="savingsAmount">₩0</strong>
            <span>절약!</span>
          </div>
        </div>
      </div>

      <!-- 개인정보 동의 -->
      <div class="privacy-consent">
        <label class="consent-checkbox">
          <input type="checkbox" id="privacyAgree">
          <span class="consent-text">[필수] <a href="#" onclick="showPrivacyPolicy(); return false;">개인정보 처리방침</a>에 동의합니다</span>
        </label>
        <p class="privacy-notice">📌 업로드된 사진은 제작 완료 후 7일 이내 자동 삭제됩니다.</p>
      </div>

      <div class="btn-group">
        <button class="btn-secondary" id="backStep3">← 이전</button>
        <button class="btn-primary btn-pay" id="payButton" disabled>
          <span class="btn-icon">🔒</span>
          <span>안전하게 결제하기</span>
        </button>
      </div>

      <div class="payment-info">
        <div class="payment-methods">
          <span>💳 카드</span>
          <span>📱 토스페이</span>
          <span>🏦 계좌이체</span>
        </div>
        <p class="guarantee">✅ 결과물 불만족 시 100% 환불 보장</p>
      </div>
    </section>

    <!-- 리뷰 섹션 (47개) -->
    <section class="review-section">
      <h3>💬 부모님들의 생생한 후기</h3>
      <div class="review-stats">
        <span class="review-score">⭐ 4.9</span>
        <span class="review-count">47개 리뷰</span>
      </div>
      <div class="reviews-container" id="reviewsContainer"></div>
    </section>

    <!-- FAQ (토글 작동) -->
    <section class="faq-section">
      <h3>❓ 자주 묻는 질문</h3>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <span>진짜처럼 보이나요?</span>
            <span class="faq-icon">+</span>
          </div>
          <div class="faq-answer">네! AI 전문가와 디자이너가 직접 제작하고 검수합니다. 자연스러운 조명과 그림자까지 세밀하게 조정해요.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <span>얼마나 걸리나요?</span>
            <span class="faq-icon">+</span>
          </div>
          <div class="faq-answer">패키지에 따라 6~24시간 내 이메일로 전달됩니다. 급행 옵션 선택 시 30분 내 가능해요!</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <span>결과물은 어떻게 받나요?</span>
            <span class="faq-icon">+</span>
          </div>
          <div class="faq-answer">입력하신 이메일로 구글 드라이브 다운로드 링크를 보내드립니다. 바로 다운받아 저장하실 수 있어요.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <span>개인정보는 안전한가요?</span>
            <span class="faq-icon">+</span>
          </div>
          <div class="faq-answer">업로드된 사진은 제작 목적으로만 사용되며, 완료 후 7일 이내 완전히 삭제됩니다. 제3자 제공은 절대 없습니다.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" onclick="toggleFaq(this)">
            <span>환불 가능한가요?</span>
            <span class="faq-icon">+</span>
          </div>
          <div class="faq-answer">결과물 불만족 시 100% 환불해드립니다. 단, 제작 시작 후에는 환불이 어려울 수 있어요.</div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>© 2024 산타를 만난 순간</p>
      <p class="footer-links">
        <a href="#" onclick="showPrivacyPolicy(); return false;">개인정보처리방침</a> | 
        <a href="mailto:santa.moment.official@gmail.com">문의하기</a>
      </p>
    </footer>
  </div>

  <!-- 개인정보 모달 -->
  <div class="modal" id="privacyModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>개인정보 처리방침</h3>
        <button class="modal-close" onclick="closeModal('privacyModal')">&times;</button>
      </div>
      <div class="modal-body">
        <h4>1. 수집하는 개인정보</h4>
        <p>아이 이름, 나이, 이메일 주소, 업로드된 사진, 결제 정보</p>
        <h4>2. 이용 목적</h4>
        <p>산타 합성 콘텐츠 제작 및 전달</p>
        <h4>3. 보유 및 파기</h4>
        <p>사진: 7일 이내 삭제 / 이메일: 30일 이내 삭제 / 결제정보: 5년 보관</p>
        <h4>4. 제3자 제공</h4>
        <p>절대 없음</p>
      </div>
      <button class="btn-primary" onclick="closeModal('privacyModal')">확인</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
