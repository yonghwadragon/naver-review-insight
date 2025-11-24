import { Language } from "./types";

export const GEMINI_API_KEY: string =
  import.meta.env.VITE_GEMINI_API_KEY || "";

export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const TRANSLATIONS: Record<Language, any> = {
  ko: {
    appTitle: "네이버 리뷰 분석기",
    subtitle: "URL을 입력하세요",
    footer: "Made by Yonghwa",
    chartTitle: "평점 분포",
    liveTitle: "라이브 어시스턴트",
    placeholder: "상품 URL 입력",
  },
  en: {
    appTitle: "Review Insight",
    subtitle: "Enter the URL",
    footer: "Made by Yonghwa",
    chartTitle: "Rating Chart",
    liveTitle: "Live Assistant",
    placeholder: "Insert URL",
  },
};
