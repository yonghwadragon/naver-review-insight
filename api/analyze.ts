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

      // [1] 통계 계산 (전체 데이터 사용 - 이건 돈 안 듦)
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

      // [2] AI 분석 (Gemini) - 429 에러 방지 핵심!
      const apiKey = process.env.GEMINI_API_KEY;
      let aiInsights = {
        summary: "AI 분석 결과를 불러오지 못했습니다.",
        keywords: [],
        pain_points: []
      };

      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          // [핵심] AI에게는 최대 30개만 보여줍니다. (토큰 절약 & 429 방지)
          // 섞어서 보내지 말고 최신순 30개만 보내도 분석에는 충분합니다.
          const limitedReviews = reviews.slice(0, 30); 
          
          const reviewTexts = limitedReviews.map((r: any) => 
            `- (${r.rating}점) ${r.content}`
          ).join("\n");

          const prompt = `
            너는 리뷰 분석가야. 아래 리뷰 샘플을 보고 분석해줘.
            
            [통계 정보] 전체 ${stats.total}개, 평균 ${stats.averageRating}점
            [리뷰 샘플 (최신 30개)]
            ${reviewTexts}

            [요청] JSON 포맷으로만 답해.
            1. summary: 전체적인 분위기 3줄 요약
            2. keywords: 핵심 키워드 5개
            3. pain_points: 주요 불만사항 3개
            
            {"summary": "...", "keywords": [], "pain_points": []}
          `;

          const result = await model.generateContent(prompt);
          const text = result.response.text().replace(/```json|```/g, "").trim();
          aiInsights = JSON.parse(text);
        } catch (e) { 
            console.error("AI Error:", e); 
            // AI가 실패해도 통계는 보여주기 위해 에러 무시
        }
      }

      // [3] 결과 반환
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
  
  return new Response("Method Not Allowed", { status: 405 });
}