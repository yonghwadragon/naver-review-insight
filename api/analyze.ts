import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(request: Request) {
  // Preflight 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const { reviews } = await request.json();

      if (!reviews || reviews.length === 0) {
        return new Response(JSON.stringify({ error: "리뷰 데이터가 없습니다." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // [1] 통계 직접 계산
      let totalRating = 0;
      let positive = 0;
      let neutral = 0;
      let negative = 0;

      reviews.forEach((r: any) => {
        const score = Number(r.rating);
        totalRating += score;
        if (score >= 4) positive++;
        else if (score === 3) neutral++;
        else negative++;
      });

      const stats = {
        total: reviews.length,
        averageRating: (totalRating / reviews.length).toFixed(1),
        positive,
        neutral,
        negative
      };

      // [2] AI 분석 (Gemini)
      const apiKey = process.env.GEMINI_API_KEY;
      let aiInsights = {
        summary: "AI 분석 대기 중...",
        keywords: [],
        pain_points: []
      };

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          // 토큰 절약을 위해 텍스트만 추출 (최대 100개)
          const reviewTexts = reviews.slice(0, 100).map((r: any) => 
            `- (평점:${r.rating}) ${r.content}`
          ).join("\n");

          const prompt = `
            너는 리뷰 데이터 분석가야. 아래 데이터를 분석해줘.
            
            [통계] 리뷰수:${stats.total}, 평점:${stats.averageRating}
            [리뷰]
            ${reviewTexts}

            [요청] JSON 포맷으로만 답해.
            1. summary: 3줄 요약
            2. keywords: 핵심 키워드 5개
            3. pain_points: 불만/단점 3개
            
            {"summary": "...", "keywords": [], "pain_points": []}
          `;

          const result = await model.generateContent(prompt);
          const text = result.response.text().replace(/```json|```/g, "").trim();
          aiInsights = JSON.parse(text);
        } catch (e) { console.error("AI Error", e); }
      }

      // [3] 결과 병합 반환
      return new Response(JSON.stringify({
        success: true,
        reportId: `report_${Date.now()}`,
        data: {
          ...aiInsights,
          sentiment_stats: { positive, negative, neutral },
          total_reviews: stats.total,
          average_rating: stats.averageRating
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405, headers: corsHeaders
  });
}