// (기존 import 유지)
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const MODELS = {
  TEXT: 'gemini-2.0-flash',
  TTS: 'gemini-2.0-flash-tts', // TTS 모델명 수정
  LIVE: 'gemini-2.0-flash-exp' // Live 모델명 최신화 (필요시)
};

export const TRANSLATIONS = {
  ko: {
    appTitle: "네이버 쇼핑 리뷰 인사이트 AI",
    subtitle: "전용 수집기로 추출한 데이터(CSV/Excel)를 업로드하여 AI 분석을 시작하세요.",
    step1Title: "1단계: 수집기 다운로드",
    step1Desc: "내 PC 환경에 맞는 수집 프로그램을 다운로드하세요.",
    step2Title: "2단계: 데이터 분석",
    step2Desc: "수집된 reviews.csv 파일을 여기에 드래그하거나 클릭하여 업로드하세요.",
    uploadPlaceholder: "파일 업로드 (reviews.csv)",
    analyzingBtn: "AI 분석 중...",
    analyzeBtn: "데이터 분석 시작",
    // ... 나머지 기존 번역 유지 ...
    error: "분석 중 오류가 발생했습니다.",
    productCard: "추정 상품명",
    verdictCard: "종합 평가",
    listenBtn: "요약 듣기",
    keyPointsCard: "핵심 포인트",
    pros: "장점",
    cons: "단점",
    none: "없음",
    chartTitle: "평점 분포",
    analysisComplete: "분석 완료",
    foundReviews: (count: number) => `${count}개의 리뷰 데이터를 성공적으로 불러왔습니다.`,
    downloadBtn: "분석 결과 저장", // 기능 변경 고려
    recentReviews: "리뷰 목록",
    tableUser: "작성자",
    tableRating: "평점",
    tableDate: "날짜",
    tableContent: "내용",
    liveTitle: "라이브 어시스턴트",
    liveConnecting: "연결 중...",
    liveDesc: "Gemini Live Audio",
    navStartVoice: "음성 채팅 시작",
    footer: "© 2025 Review Insight AI. Powered by Gemini 2.0"
  },
  en: {
    appTitle: "Naver Review Insight AI",
    subtitle: "Upload your scraped data (CSV/Excel) to start AI analysis.",
    step1Title: "Step 1: Download Scraper",
    step1Desc: "Download the scraper tool for your OS.",
    step2Title: "Step 2: Analyze Data",
    step2Desc: "Drag & drop your reviews.csv file here.",
    uploadPlaceholder: "Upload File (reviews.csv)",
    analyzingBtn: "Analyzing...",
    analyzeBtn: "Start Analysis",
    error: "An error occurred.",
    // ... rest same ...
    productCard: "Product Name",
    verdictCard: "Verdict",
    listenBtn: "Listen",
    keyPointsCard: "Key Points",
    pros: "Pros",
    cons: "Cons",
    none: "None",
    chartTitle: "Rating Dist.",
    analysisComplete: "Analysis Complete",
    foundReviews: (count: number) => `Successfully loaded ${count} reviews.`,
    downloadBtn: "Save Report",
    recentReviews: "Reviews List",
    tableUser: "User",
    tableRating: "Rating",
    tableDate: "Date",
    tableContent: "Content",
    liveTitle: "Live Assistant",
    liveConnecting: "Connecting...",
    liveDesc: "Gemini Live Audio",
    navStartVoice: "Start Voice Chat",
    footer: "© 2025 Review Insight AI. Powered by Gemini 2.0 · Made by Yonghwa"
  }
};