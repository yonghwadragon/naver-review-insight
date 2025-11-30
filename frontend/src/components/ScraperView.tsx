// src/components/ScraperView.tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Loader2, AlertCircle, CheckCircle, FileJson, Server } from 'lucide-react';
import { analyzeUrlWithSearch } from '../services/geminiService';
import { Review, ProductSummary, AppStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ScraperViewProps {
  lang: Language;
}

const ScraperView: React.FC<ScraperViewProps> = ({ lang }) => {
  const [url, setUrl] = useState('');
  const [serverUrl, setServerUrl] = useState(''); // Ngrok 주소 상태
  const [cookieFile, setCookieFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const t = TRANSLATIONS[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCookieFile(e.target.files[0]);
  };

  const handleScrape = async () => {
    if (!serverUrl) {
        setErrorMessage("서버 주소(Ngrok URL)를 입력해주세요.");
        setStatus(AppStatus.ERROR);
        return;
    }
    if (!url) {
        setErrorMessage("상품 URL을 입력해주세요.");
        setStatus(AppStatus.ERROR);
        return;
    }
    if (!cookieFile) {
        setErrorMessage("네이버 쿠키 파일을 업로드해주세요.");
        setStatus(AppStatus.ERROR);
        return;
    }

    setStatus(AppStatus.ANALYZING);
    setErrorMessage("");
    
    try {
      const data = await analyzeUrlWithSearch(url, lang, cookieFile, serverUrl);
      setReviews(data.reviews);
      setStatus(AppStatus.COMPLETE);
    } catch (error: any) {
      setErrorMessage(error.message || "오류가 발생했습니다.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleDownload = () => {
    if (reviews.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(reviews);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reviews");
    XLSX.writeFile(wb, "naver_reviews.xlsx");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      
      {/* Input Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700 shadow-xl space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
          {t.appTitle}
        </h1>
        <p className="text-slate-400">네이버 스마트스토어 리뷰 수집기 (Local Server)</p>

        {/* 1. Ngrok URL Input */}
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Server className="h-5 w-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="서버 주소 입력 (예: https://xxxx.ngrok-free.app)"
              className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600"
            />
        </div>

        {/* 2. Target URL Input */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="네이버 쇼핑 상품 URL (https://smartstore.naver.com/...)"
              className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
            />
        </div>

        {/* 3. Cookie File Input */}
        <div className="relative">
             <label className="flex items-center gap-3 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <FileJson className="h-5 w-5 text-yellow-500" />
                <span className="text-slate-300 text-sm flex-1 font-medium">
                    {cookieFile ? `✅ ${cookieFile.name}` : "📂 네이버 쿠키 파일 업로드 (.json)"}
                </span>
                <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
             </label>
        </div>

        {/* Action Button */}
        <button
            onClick={handleScrape}
            disabled={status === AppStatus.ANALYZING}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              status === AppStatus.ANALYZING
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
            }`}
        >
            {status === AppStatus.ANALYZING ? (
              <><Loader2 className="animate-spin h-5 w-5" /> 내 컴퓨터에서 수집 중...</>
            ) : "수집 시작"}
        </button>
      </div>

      {/* Error Message */}
      {status === AppStatus.ERROR && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Success View */}
      {status === AppStatus.COMPLETE && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 opacity-50" />
                <div>
                  <h3 className="text-white font-bold text-lg">완료되었습니다!</h3>
                  <p className="text-slate-400 text-sm mt-1">총 {reviews.length}개의 리뷰를 가져왔습니다.</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Download className="h-5 w-5" />
                  엑셀 다운로드
                </button>
            </div>

             <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden max-h-96 overflow-y-auto">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-slate-900 text-slate-200 sticky top-0">
                   <tr>
                     <th className="px-6 py-3 w-24">작성자</th>
                     <th className="px-6 py-3 w-20">평점</th>
                     <th className="px-6 py-3">내용</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                   {reviews.map((review, idx) => (
                     <tr key={idx} className="hover:bg-slate-700/50">
                       <td className="px-6 py-4 text-white">{review.user}</td>
                       <td className="px-6 py-4 text-yellow-400">★ {review.rating}</td>
                       <td className="px-6 py-4 text-slate-300 line-clamp-2">{review.content}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
        </div>
      )}
    </div>
  );
};

export default ScraperView;