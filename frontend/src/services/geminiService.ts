// src/services/geminiService.ts
import { Review, ProductSummary, Language } from "../types";

export const analyzeUrlWithSearch = async (
  url: string,
  lang: Language,
  cookieFile: File | null,
  serverUrl: string // ✅ Ngrok 주소를 인자로 받음
): Promise<{ reviews: Review[]; summary: ProductSummary }> => {
  
  if (!serverUrl) throw new Error("서버 주소(Ngrok URL)가 필요합니다.");
  if (!cookieFile) throw new Error("네이버 쿠키 파일(.json)이 필요합니다.");

  // URL 끝에 슬래시 제거 처리
  const baseUrl = serverUrl.replace(/\/$/, "");

  const formData = new FormData();
  formData.append("url", url);
  formData.append("limit_pages", "5"); // 기본 5페이지
  formData.append("cookie_file", cookieFile);

  try {
    const response = await fetch(`${baseUrl}/scrape`, {
      method: "POST",
      // 👇👇👇 [핵심 수정] 이 부분이 추가되었습니다! 👇👇👇
      headers: {
        "ngrok-skip-browser-warning": "69420", 
      },
      // 👆👆👆 Ngrok 경고창을 무시하는 프리패스권입니다 👆👆👆
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `서버 오류: ${response.status}`);
    }

    const data = await response.json();
    
    // 백엔드 결과를 프론트엔드 포맷으로 변환
    const summary: ProductSummary = {
      name: "네이버 쇼핑 분석",
      price: "-",
      pros: ["실제 데이터 기반", "엑셀 다운로드 가능"],
      cons: [],
      overallSentiment: `총 ${data.count}개의 리뷰를 수집했습니다. 엑셀로 다운로드하여 확인하세요.`
    };

    return {
      reviews: data.reviews,
      summary: summary
    };

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// TTS 더미 함수 (에러 방지용)
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  throw new Error("TTS not supported in local mode");
};
export const playAudioBuffer = (buffer: AudioBuffer) => {};