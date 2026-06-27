"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

export function CvAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Microphone Devices & Permissions State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Detect initial permission status and load devices if already granted
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" as any }).then((result) => {
        setPermissionState(result.state as any);
        if (result.state === "granted") {
          loadAudioDevices();
        }
        result.onchange = () => {
          setPermissionState(result.state as any);
          if (result.state === "granted") {
            loadAudioDevices();
          }
        };
      }).catch((err) => {
        console.warn("navigator.permissions.query nao suportada para microfone:", err);
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadAudioDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);
      if (audioInputs.length > 0) {
        setSelectedDeviceId((prev) => {
          const exists = audioInputs.some((d) => d.deviceId === prev);
          return exists ? prev : audioInputs[0].deviceId;
        });
      }
    } catch (err) {
      console.error("Erro ao listar dispositivos de audio:", err);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionState("granted");
      await loadAudioDevices();
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Erro ao solicitar permissao do microfone:", err);
      setPermissionState("denied");
      return false;
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];

    if (permissionState !== "granted") {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      setPermissionState("denied");
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

        {/* Device selector and permissions message */}
        <div className="mb-4 space-y-3">
          {permissionState === "denied" && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-1 animate-fade-in">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Acesso ao Microfone Bloqueado</p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] leading-relaxed">
                Por favor, clique no icone de cadeado/microfone na barra de enderecos do navegador para liberar o acesso ao microfone.
              </p>
            </div>
          )}

          {devices.length > 1 && !isRecording && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block">Dispositivo de Entrada</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-xl text-[10px] font-bold text-[var(--text-primary)] focus:outline-none"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microfone ${device.deviceId.substring(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

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
