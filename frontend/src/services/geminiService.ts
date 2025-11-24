// frontend/services/geminiService.ts

import { GoogleGenAI, Modality } from "@google/genai";
import { GEMINI_API_KEY } from "../constants";
import { Review, ProductSummary, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export const analyzeUrlWithSearch = async (
  url: string,
  lang: Language
): Promise<{ reviews: Review[]; summary: ProductSummary }> => {
  const langName = lang === "ko" ? "Korean" : "English";

  const prompt = `
You are a highly advanced e-commerce data scraper and analyst specialized in Naver Shopping (Smart Store).

**Target URL**: ${url}

**MISSION**:
1. **Exact Product Metadata**:
   - Use Google Search to find this specific Naver Shopping page.
   - Extract the EXACT Product Name.
   - Extract the EXACT Price in KRW.

2. **Deep Review Extraction (Simulating Pagination)**:
   - Search for user reviews associated with this product across Naver Shopping, Blogs, and Cafes.
   - Do NOT make up reviews; synthesize from real snippets/cached data.
   - Goal: Find up to 15-20 distinct reviews.

3. **Data Extraction Rules**:
   - User: Extract nicknames or "Naver User".
   - Date: YYYY.MM.DD.
   - Rating: 1-5.
   - Content: keep nuance.

**OUTPUT FORMAT**:
Return a SINGLE JSON object. Language must be ${langName}.

{
  "summary": {
    "name": "Exact Product Name",
    "price": "XX,XXX원",
    "pros": ["Key benefit 1", "Key benefit 2", "Key benefit 3"],
    "cons": ["Key drawback 1", "Key drawback 2"],
    "overallSentiment": "2-3 sentence sentiment."
  },
  "reviews": [
    {
      "id": "1",
      "user": "UserNickname",
      "rating": 5,
      "content": "Review text...",
      "date": "2024.01.01"
    }
  ]
}

**CRITICAL**: Return ONLY raw JSON. No markdown.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  let text = response.text;
  if (!text) throw new Error("No data returned from Gemini");

  text = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

  try {
    const data = JSON.parse(text);

    if (!data.reviews) data.reviews = [];
    if (!data.summary) {
      data.summary = {
        name: "Unknown Product",
        price: "Unknown",
        pros: [],
        cons: [],
        overallSentiment: "Could not analyze.",
      };
    }

    return data;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", text);
    throw new Error("Invalid JSON response from Gemini");
  }
};

export const generateSpeech = async (
  text: string
): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio data generated");
  }

  const outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });

  const audioBytes = decode(base64Audio);

  const dataInt16 = new Int16Array(audioBytes.buffer);
  const float32 = new Float32Array(dataInt16.length);

  for (let i = 0; i < dataInt16.length; i++) {
    float32[i] = dataInt16[i] / 32768.0;
  }

  const buffer = outputAudioContext.createBuffer(
    1,
    float32.length,
    24000
  );
  buffer.getChannelData(0).set(float32);

  return buffer;
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
};
