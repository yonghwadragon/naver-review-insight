import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_API_KEY } from "../constants";
import { Review, ProductSummary, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Audio decoding helper
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ✅ [변경] URL 대신 리뷰 데이터를 직접 받아서 분석
export const analyzeReviewsFromCsv = async (
  reviews: Review[],
  lang: Language
): Promise<ProductSummary> => {
  const langName = lang === "ko" ? "Korean" : "English";
  
  // 리뷰가 너무 많으면 토큰 제한 걸릴 수 있으니 최신 50~100개만 샘플링
  const sampleReviews = reviews.slice(0, 100).map(r => 
    `[${r.date}] ${r.rating} stars: ${r.content}`
  ).join("\n");

  const prompt = `
    You are an expert e-commerce analyst.
    Below is a list of real user reviews for a specific product.
    
    **REVIEWS DATA**:
    ${sampleReviews}

    **MISSION**:
    Analyze these reviews and provide a structured summary in **${langName}**.
    
    **OUTPUT FORMAT (JSON ONLY)**:
    {
      "name": "Infer the product name from context (e.g., 'Vital Beautie Metagreen')",
      "price": "Estimate price range if mentioned, or 'Unknown'",
      "pros": ["Key benefit 1", "Key benefit 2", "Key benefit 3"],
      "cons": ["Key drawback 1", "Key drawback 2"],
      "overallSentiment": "A comprehensive 2-3 sentence verdict summarizing buyer sentiment."
    }
    
    **CRITICAL**: Return ONLY raw JSON. No markdown blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Search 도구 필요 없음 (훨씬 빠름)
      contents: prompt,
    });

    let text = response.text;
    if (!text) throw new Error("No data returned from Gemini");

    text = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const summary = JSON.parse(text);

    return summary;
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    throw new Error("Failed to analyze reviews.");
  }
};

// TTS 기능 (기존 유지)
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data generated");

  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBytes = decode(base64Audio);
  const dataInt16 = new Int16Array(audioBytes.buffer);
  const float32 = new Float32Array(dataInt16.length);

  for (let i = 0; i < dataInt16.length; i++) {
    float32[i] = dataInt16[i] / 32768.0;
  }

  const buffer = outputAudioContext.createBuffer(1, float32.length, 24000);
  buffer.getChannelData(0).set(float32);
  return buffer;
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};