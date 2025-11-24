// frontend/components/ScraperView.tsx

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  Loader2,
  AlertCircle,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import { analyzeUrlWithSearch, generateSpeech, playAudioBuffer } from "../services/geminiService";
import { Review, ProductSummary, AppStatus, Language } from "../types";
import { TRANSLATIONS } from "../constants";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell
} from "recharts";

interface ScraperViewProps {
  lang: Language;
}

const ScraperView: React.FC<ScraperViewProps> = ({ lang }) => {
  const [url, setUrl] = useState(
    "https://brand.naver.com/vitalbeautie/products/6933282654"
  );
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleScrape = async () => {
    if (!url) return;

    setStatus(AppStatus.ANALYZING);

    try {
      const data = await analyzeUrlWithSearch(url, lang);
      setReviews(data.reviews);
      setSummary(data.summary);
      setStatus(AppStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (reviews.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(reviews);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reviews");
    XLSX.writeFile(wb, "naver_reviews_analysis.xlsx");
  };

  const handleTTS = async () => {
    if (!summary) return;

    setIsSpeaking(true);

    try {
      let text = "";

      if (lang === "ko") {
        text = `${summary.name}에 대한 요약입니다. 종합 평가는 다음과 같습니다: ${summary.overallSentiment}. 가격은 ${summary.price} 입니다. 주요 장점으로는 ${summary.pros.join(
          ", "
        )} 등이 있습니다.`;
      } else {
        text = `Here is the summary for ${summary.name}. Overall sentiment is ${summary.overallSentiment}. The price is around ${summary.price}. Pros include: ${summary.pros.join(
          ", "
        )}.`;
      }

      const buffer = await generateSpeech(text);
      playAudioBuffer(buffer);
    } catch (e) {
      console.error("TTS Error", e);
    } finally {
      setIsSpeaking(false);
    }
  };

  const sentimentData = useMemo(
    () => [
      { name: "5 Stars", count: reviews.filter((r) => r.rating === 5).length },
      { name: "4 Stars", count: reviews.filter((r) => r.rating === 4).length },
      { name: "3 Stars", count: reviews.filter((r) => r.rating === 3).length },
      { name: "2 Stars", count: reviews.filter((r) => r.rating === 2).length },
      { name: "1 Star", count: reviews.filter((r) => r.rating === 1).length },
    ],
    [reviews]
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 shadow-xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
          {t.appTitle}
        </h1>
        <p className="text-slate-400 mb-6">{t.subtitle}</p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.placeholder}
              className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={status === AppStatus.ANALYZING}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              status === AppStatus.ANALYZING
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/25"
            }`}
          >
            {status === AppStatus.ANALYZING ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" /> {t.analyzingBtn}
              </>
            ) : (
              t.analyzeBtn
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {status === AppStatus.ERROR && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          {t.error}
        </div>
      )}

      {status === AppStatus.COMPLETE && summary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                {t.productCard}
              </h3>
              <div className="text-xl font-bold text-white line-clamp-2">
                {summary.name}
              </div>
              <div className="text-green-400 font-mono mt-2 text-lg">
                {summary.price}
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                {t.verdictCard}
              </h3>
              <div className="text-white mb-4 text-sm leading-relaxed">
                {summary.overallSentiment}
              </div>
              <button
                onClick={handleTTS}
                disabled={isSpeaking}
                className="text-xs flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full transition-colors text-slate-200"
              >
                {isSpeaking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <PlayCircle className="h-3 w-3" />
                )}
                {t.listenBtn}
              </button>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
                {t.keyPointsCard}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-green-500 font-bold whitespace-nowrap">
                    {t.pros}:
                  </span>
                  <span className="text-slate-300">
                    {summary.pros.slice(0, 2).join(", ")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-red-400 font-bold whitespace-nowrap">
                    {t.cons}:
                  </span>
                  <span className="text-slate-300">
                    {summary.cons.slice(0, 1).join(", ") || t.none}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-slate-400 text-sm font-medium mb-4">
                {t.chartTitle}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentData}>
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#fff",
                      }}
                      cursor={{ fill: "#334155", opacity: 0.4 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {sentimentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === "5 Stars" ? "#22c55e" : "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 opacity-50" />
              <div>
                <h3 className="text-white font-bold text-lg">
                  {t.analysisComplete}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {t.foundReviews(reviews.length)}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Download className="h-5 w-5" />
                {t.downloadBtn}
              </button>
            </div>
          </div>

          {/* Review Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-white font-semibold">{t.recentReviews}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900 text-slate-200 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-3 w-24">{t.tableUser}</th>
                    <th className="px-6 py-3 w-24">{t.tableRating}</th>
                    <th className="px-6 py-3 w-32">{t.tableDate}</th>
                    <th className="px-6 py-3">{t.tableContent}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {reviews.map((review, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {review.user}
                      </td>
                      <td className="px-6 py-4 text-yellow-400">
                        <div className="flex">
                          {"★".repeat(review.rating)}
                          <span className="text-slate-600">
                            {"★".repeat(5 - review.rating)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.date}
                      </td>
                      <td className="px-6 py-4 text-slate-300 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                        {review.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperView;
