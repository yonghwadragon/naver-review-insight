// frontend/src/components/LiveAssistant.tsx

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Activity, Volume2 } from "lucide-react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

import { GEMINI_API_KEY, TRANSLATIONS } from "../constants";
import { createPcmBlob, decodeAudioData } from "../utils/audio-utils";
import { Language } from "../types";

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    initializeLiveSession();

    return () => cleanup();
  }, [isOpen, lang]);

  const initializeLiveSession = async () => {
    try {
      cleanup();

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      inputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 16000 });

      outputAudioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction =
        lang === "ko"
          ? "당신은 도움이 되는 네이버 쇼핑 어시스턴트입니다. 상품, 리뷰, 트렌드에 대해 한국어로 토론하세요."
          : "You are a helpful Naver Shopping assistant. Discuss products, reviews, and trends in English.";

      sessionPromiseRef.current = ai.live.connect({
        model: "gemini-2.5-flash-native-audio", // 공식 LIVE 모델명
        callbacks: {
          onopen: handleOnOpen,
          onmessage: handleOnMessage,
          onclose: () => {
            console.log("Live session closed");
            setConnected(false);
          },
          onerror: (e) => console.error("Live session error", e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" },
            },
          },
          systemInstruction,
        },
      });
    } catch (err) {
      console.error("Failed to init live session:", err);
    }
  };

  const handleOnOpen = () => {
    setConnected(true);
    startAudioInput();
  };

  const startAudioInput = () => {
    if (
      !inputAudioContextRef.current ||
      !streamRef.current ||
      !sessionPromiseRef.current
    )
      return;

    const source =
      inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
    const scriptProcessor =
      inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
    scriptProcessorRef.current = scriptProcessor;

    scriptProcessor.onaudioprocess = (e) => {
      if (isMuted) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      sessionPromiseRef.current?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContextRef.current.destination);
  };

  const handleOnMessage = async (message: LiveServerMessage) => {
    const modelTurn = message.serverContent?.modelTurn;

    if (modelTurn?.parts?.[0]?.inlineData?.data) {
      const base64Audio = modelTurn.parts[0].inlineData.data;
      await playAudioChunk(base64Audio);
    }

    if (message.serverContent?.interrupted) {
      stopAllAudio();
      nextStartTimeRef.current = 0;
    }
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current) return;

    const ctx = outputAudioContextRef.current;
    nextStartTimeRef.current = Math.max(
      nextStartTimeRef.current,
      ctx.currentTime
    );

    const audioBuffer = await decodeAudioData(base64Audio, ctx, 24000);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    source.addEventListener("ended", () =>
      sourcesRef.current.delete(source)
    );

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    sourcesRef.current.add(source);
  };

  const stopAllAudio = () => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
  };

  const cleanup = () => {
    stopAllAudio();

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((session) => {
        try {
          session.close();
        } catch {}
      });
      sessionPromiseRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setConnected(false);
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
              }`}
            ></span>
            <h3 className="text-white font-semibold">{t.liveTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center mb-4 border border-slate-700 relative overflow-hidden">
          {connected ? (
            <div className="flex items-center gap-1">
              <div className="w-1 bg-green-500 animate-[bounce_1s_infinite] h-8"></div>
              <div className="w-1 bg-green-500 animate-[bounce_1.2s_infinite] h-12"></div>
              <div className="w-1 bg-green-500 animate-[bounce_0.8s_infinite] h-6"></div>
              <div className="w-1 bg-green-500 animate-[bounce_1.1s_infinite] h-10"></div>
              <div className="w-1 bg-green-500 animate-[bounce_0.9s_infinite] h-4"></div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">{t.liveConnecting}</div>
          )}

          {isMuted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <MicOff className="h-8 w-8 text-red-400" />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-all ${
              isMuted
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <div className="flex items-center justify-center p-3 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-center p-3 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <Volume2 className="h-5 w-5" />
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t.liveDesc}
        </p>
      </div>
    </div>
  );
};

export default LiveAssistant;