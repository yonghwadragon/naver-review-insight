import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, FileSpreadsheet, Loader2, AlertCircle, 
  CheckCircle, Monitor, Laptop, PlayCircle, Download 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { analyzeReviewsFromCsv, generateSpeech, playAudioBuffer } from '../services/geminiService';
import { parseReviewFile } from '../utils/fileHelpers'; // 아까 만든 파일
import { Review, ProductSummary, AppStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ScraperViewProps {
  lang: Language;
}

const ScraperView: React.FC<ScraperViewProps> = ({ lang }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const t = TRANSLATIONS[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(AppStatus.IDLE); // 파일 바뀌면 상태 초기화
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setErrorMessage("파일을 먼저 업로드해주세요.");
      setStatus(AppStatus.ERROR);
      return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorMessage("");

    try {
      // 1. 엑셀/CSV 파싱
      const parsedReviews = await parseReviewFile(file);
      setReviews(parsedReviews);

      // 2. Gemini에게 분석 요청
      const aiSummary = await analyzeReviewsFromCsv(parsedReviews, lang);
      setSummary(aiSummary);
      
      setStatus(AppStatus.COMPLETE);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "분석 실패");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleTTS = async () => {
    if (!summary) return;
    setIsSpeaking(true);
    try {
      let text = "";
      if (lang === 'ko') {
        text = `${summary.name} 분석 결과입니다. 종합 의견: ${summary.overallSentiment}. 장점으로는 ${summary.pros.join(', ')} 등이 있습니다.`;
      } else {
        text = `Summary for ${summary.name}. Verdict: ${summary.overallSentiment}. Pros include ${summary.pros.join(', ')}.`;
      }
      const buffer = await generateSpeech(text);
      playAudioBuffer(buffer);
    } catch (e) {
      console.error("TTS Error", e);
    } finally {
      setIsSpeaking(false);
    }
  };

  // 차트 데이터 생성
  const sentimentData = [5, 4, 3, 2, 1].map(star => ({
    name: `${star} Stars`,
    count: reviews.filter(r => r.rating === star).length
  }));

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* 1. 상단 안내 및 다운로드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 왼쪽: 앱 다운로드 */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Download className="h-5 w-5 text-green-400" />
            {t.step1Title}
          </h2>
          <p className="text-slate-400 text-sm mb-6">{t.step1Desc}</p>
          
          <div className="flex gap-3">
            <a 
              href="/downloads/smartstore_scraper_gui.exe" 
              download
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-all border border-slate-600 hover:border-slate-500"
            >
              <Monitor className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xs text-slate-400">For Windows</div>
                <div className="font-semibold">Download .exe</div>
              </div>
            </a>
            <a 
              href="/downloads/SmartStoreScraper_Mac.zip" 
              download
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-all border border-slate-600 hover:border-slate-500"
            >
              <Laptop className="h-5 w-5 text-gray-300" />
              <div className="text-left">
                <div className="text-xs text-slate-400">For Mac</div>
                <div className="font-semibold">Download .zip</div>
              </div>
            </a>
          </div>
        </div>

        {/* 오른쪽: 파일 업로드 및 실행 */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col justify-center">
           <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-green-400" />
            {t.step2Title}
          </h2>
          <p className="text-slate-400 text-sm mb-4">{t.step2Desc}</p>

          <div className="flex gap-2">
             <label className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-900/80 transition-colors group">
                <FileSpreadsheet className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 text-sm flex-1 truncate">
                    {file ? file.name : t.uploadPlaceholder}
                </span>
                <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="hidden" />
             </label>

             <button
                onClick={handleAnalyze}
                disabled={!file || status === AppStatus.ANALYZING}
                className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                  !file || status === AppStatus.ANALYZING
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                }`}
             >
                {status === AppStatus.ANALYZING ? <Loader2 className="animate-spin h-5 w-5" /> : t.analyzeBtn}
             </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {status === AppStatus.ERROR && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* 2. 결과 섹션 (기존 디자인 유지 + 차트) */}
      {status === AppStatus.COMPLETE && summary && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
          
          {/* 상단 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500/50 transition-colors">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.productCard}</h3>
              <div className="text-xl font-bold text-white leading-tight">{summary.name}</div>
              <div className="text-green-400 font-mono mt-2 text-lg">{summary.price}</div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500/50 transition-colors relative">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.verdictCard}</h3>
              <div className="text-slate-200 text-sm leading-relaxed mb-8">{summary.overallSentiment}</div>
              <button 
                onClick={handleTTS}
                disabled={isSpeaking}
                className="absolute bottom-4 right-4 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-xs text-white transition-all"
              >
                {isSpeaking ? <Loader2 className="h-3 w-3 animate-spin"/> : <PlayCircle className="h-3 w-3 text-green-400"/>}
                {t.listenBtn}
              </button>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500/50 transition-colors">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t.keyPointsCard}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-green-400 font-bold block mb-1">{t.pros}</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {summary.pros.slice(0, 2).map((p, i) => <li key={i} className="truncate">{p}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-red-400 font-bold block mb-1">{t.cons}</span>
                  <p className="text-slate-300 truncate">{summary.cons[0] || t.none}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 차트 및 완료 상태 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="text-slate-400 text-sm font-medium mb-4">{t.chartTitle}</h3>
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                        cursor={{fill: '#334155', opacity: 0.4}}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name.startsWith('5') ? '#22c55e' : '#94a3b8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center space-y-4">
                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{t.analysisComplete}</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {t.foundReviews(reviews.length)}
                  </p>
                </div>
            </div>
          </div>

          {/* 리뷰 테이블 */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
               <h3 className="text-white font-semibold flex items-center gap-2">
                 <FileSpreadsheet className="h-4 w-4 text-slate-400"/>
                 {t.recentReviews}
               </h3>
             </div>
             <div className="overflow-x-auto max-h-[500px]">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10">
                   <tr>
                     <th className="px-6 py-3 w-24">{t.tableUser}</th>
                     <th className="px-6 py-3 w-28">{t.tableRating}</th>
                     <th className="px-6 py-3 w-32">{t.tableDate}</th>
                     <th className="px-6 py-3">{t.tableContent}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                   {reviews.slice(0, 50).map((review, idx) => (
                     <tr key={idx} className="hover:bg-slate-700/30 transition-colors group">
                       <td className="px-6 py-4 font-medium text-slate-300">{review.user}</td>
                       <td className="px-6 py-4 text-yellow-400 font-bold">
                         ★ {review.rating}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs">{review.date}</td>
                       <td className="px-6 py-4 text-slate-300 group-hover:text-white transition-colors">
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