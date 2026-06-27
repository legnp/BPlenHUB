"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

export function CvAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Nao foi possivel acessar o seu microfone. Por favor, verifique as permissoes do seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;
    return `${mins}:${remain < 10 ? "0" : ""}${remain}`;
  };

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-start)] ml-1 block mb-3">
          Gravador de Audio
        </span>

        <div className="flex flex-col items-center justify-center p-6 bg-white/40 border border-[var(--input-border)]/50 rounded-xl space-y-4 min-h-[140px]">
          {isRecording ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping" />
                <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center relative">
                  <Mic className="w-6 h-6" />
                </div>
              </div>
              <span className="text-sm font-semibold text-red-500">
                Gravando... {formatTime(recordingTime)}
              </span>
            </div>
          ) : audioUrl ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-[var(--accent-start)]/10 text-[var(--accent-start)] rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Audio gravado com sucesso!
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-muted)] rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                Pronto para gravar o seu pitch.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {!audioUrl && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-start)] text-white hover:bg-[var(--accent-end)] transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold shadow-sm"
              >
                <Mic className="w-4 h-4" />
                <span>Gravar</span>
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold shadow-sm animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>Parar</span>
              </button>
            )}

            {audioUrl && (
              <>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="px-5 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? "Pausar" : "Ouvir"}</span>
                </button>

                <button
                  type="button"
                  onClick={resetAudio}
                  className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-red-500 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center"
                  title="Regravar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
