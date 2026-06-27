"use client";

import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Phone, Mail, Linkedin, Globe, Shield } from "lucide-react";

interface BusinessCardEngineProps {
  name: string;
  pitch: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
  visibleFields: {
    name: boolean;
    phone: boolean;
    email: boolean;
    linkedin: boolean;
    website: boolean;
  };
  theme: "light" | "dark" | "blue" | "grey" | "green";
  qrTarget: "whatsapp" | "linkedin" | "website";
}

export function BusinessCardEngine({
  name,
  pitch,
  phone,
  email,
  linkedin,
  website,
  visibleFields,
  theme,
  qrTarget
}: BusinessCardEngineProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Resolvendo a URL do QR Code
  let qrValue = "https://bplen.com/hub";
  if (qrTarget === "whatsapp" && phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    qrValue = `https://wa.me/${cleanPhone}`;
  } else if (qrTarget === "linkedin" && linkedin) {
    qrValue = linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`;
  } else if (qrTarget === "website" && website) {
    qrValue = website.startsWith("http") ? website : `https://${website}`;
  }

  // Estilos de tema para o preview HTML
  const themeStyles = {
    light: {
      bg: "bg-white border-slate-200 shadow-lg text-slate-800",
      accentText: "text-[var(--accent-start)]",
      mutedText: "text-slate-500",
      qrBg: "#ffffff",
      qrFg: "#1d1d1f",
      border: "border-slate-100",
      iconClass: "text-slate-600 bg-slate-50 border-slate-200"
    },
    dark: {
      bg: "bg-[#0b0c10] border-slate-800 shadow-2xl text-slate-100",
      accentText: "text-[var(--accent-start)]",
      mutedText: "text-slate-400",
      qrBg: "#0b0c10",
      qrFg: "#ffffff",
      border: "border-slate-800",
      iconClass: "text-slate-300 bg-slate-900 border-slate-800"
    },
    blue: {
      bg: "bg-gradient-to-br from-[#1a2a6c] via-[#2759a2] to-[#3885d6] border-blue-500/20 text-white shadow-2xl",
      accentText: "text-blue-200",
      mutedText: "text-blue-100/70",
      qrBg: "#ffffff",
      qrFg: "#1a2a6c",
      border: "border-blue-400/20",
      iconClass: "text-white bg-white/10 border-white/15"
    },
    grey: {
      bg: "bg-gradient-to-br from-[#232526] to-[#414345] border-neutral-700/30 text-white shadow-2xl",
      accentText: "text-neutral-300",
      mutedText: "text-neutral-400",
      qrBg: "#ffffff",
      qrFg: "#232526",
      border: "border-neutral-700/20",
      iconClass: "text-white bg-white/10 border-white/15"
    },
    green: {
      bg: "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] border-emerald-950/20 text-white shadow-2xl",
      accentText: "text-emerald-300",
      mutedText: "text-emerald-100/70",
      qrBg: "#ffffff",
      qrFg: "#0f2027",
      border: "border-emerald-800/20",
      iconClass: "text-white bg-white/10 border-white/15"
    }
  }[theme];

  const exportToImage = async (format: "png" | "jpeg") => {
    // Criamos um canvas de alta definicao 1080x1920 (9:16)
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Desenhar Fundo
    if (theme === "light") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "dark") {
      ctx.fillStyle = "#0b0c10";
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "blue") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#1a2a6c");
      grad.addColorStop(0.5, "#2759a2");
      grad.addColorStop(1, "#3885d6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "grey") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#232526");
      grad.addColorStop(1, "#414345");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (theme === "green") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0f2027");
      grad.addColorStop(0.5, "#203a43");
      grad.addColorStop(1, "#2c5364");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Cores de Fonte
    const textColor = theme === "light" ? "#1d1d1f" : "#ffffff";
    const accentColor = theme === "light" ? "#667eea" : "#a3b8ff";
    const mutedColor = theme === "light" ? "#68768a" : "rgba(255, 255, 255, 0.6)";

    // 3. Cabecalho - BPlen HUB
    ctx.textAlign = "center";
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = accentColor;
    ctx.fillText("BPlen HUB", width / 2, 140);

    // Linha divisoria
    ctx.strokeStyle = theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(150, 190);
    ctx.lineTo(width - 150, 190);
    ctx.stroke();

    // 4. Nome
    if (visibleFields.name) {
      ctx.font = "bold 72px sans-serif";
      ctx.fillStyle = textColor;
      ctx.fillText(name || "Seu Nome", width / 2, 300);
    }

    // 5. Pitch Curto
    ctx.font = "normal 42px sans-serif";
    ctx.fillStyle = mutedColor;
    
    // Raciocinio para quebra de texto do Pitch
    const pitchText = pitch || "Profissional em desenvolvimento de carreira.";
    const words = pitchText.split(" ");
    let line = "";
    let y = 370;
    const maxWidth = width - 180;
    const lineHeight = 55;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // 6. Desenhar QR Code do Canvas DOM
    const qrCanvas = document.getElementById("bplen-card-qrcode") as HTMLCanvasElement | null;
    if (qrCanvas) {
      const qrSize = 480;
      const qrx = (width - qrSize) / 2;
      const qry = 600;

      // Desenha fundo branco ou contorno para o QR Code para garantir leitura
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrx - 30, qry - 30, qrSize + 60, qrSize + 60, 40);
      ctx.fill();

      // Desenha a imagem do QR Code
      ctx.drawImage(qrCanvas, qrx, qry, qrSize, qrSize);

      // Legenda do QR Code
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = theme === "light" ? "#4a5568" : "#cbd5e1";
      let qrLabel = "Aponte a camera para o meu perfil";
      if (qrTarget === "whatsapp") qrLabel = "Fale comigo no WhatsApp";
      else if (qrTarget === "linkedin") qrLabel = "Conecte-se no LinkedIn";
      else if (qrTarget === "website") qrLabel = "Acesse o meu Portfolio";
      ctx.fillText(qrLabel, width / 2, qry + qrSize + 60);
    }

    // 7. Detalhes de Contato
    ctx.textAlign = "left";
    ctx.font = "normal 38px sans-serif";
    let startY = 1260;
    const contactLineHeight = 85;

    const drawContactItem = (labelVal: string, iconType: string) => {
      ctx.fillStyle = textColor;
      // Ajusta offset para o texto do icone
      ctx.fillText(labelVal, 220, startY + 12);
      startY += contactLineHeight;
    };

    if (visibleFields.phone && phone) drawContactItem(phone, "phone");
    if (visibleFields.email && email) drawContactItem(email, "email");
    if (visibleFields.linkedin && linkedin) {
      const cleanLinkedin = linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "");
      drawContactItem(cleanLinkedin, "linkedin");
    }
    if (visibleFields.website && website) {
      const cleanWeb = website.replace(/https?:\/\//, "");
      drawContactItem(cleanWeb, "website");
    }

    // 8. Rodape - Copia BPlen
    ctx.textAlign = "center";
    ctx.font = "normal 30px sans-serif";
    ctx.fillStyle = mutedColor;
    ctx.fillText("BPlen HUB — bplen.com/hub", width / 2, height - 100);

    // 9. Download
    const dataUrl = canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg");
    const link = document.createElement("a");
    link.download = `cartao_visita_${name.toLowerCase().replace(/\s+/g, "_")}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch gap-8">
      {/* Visualizador 9:16 Mockup */}
      <div className="flex-1 flex justify-center items-center">
        <div 
          ref={previewRef}
          className={`w-[290px] h-[515px] rounded-[2rem] border p-6 flex flex-col justify-between transition-all relative overflow-hidden select-none ${themeStyles.bg}`}
          style={{ aspectRatio: "9/16" }}
        >
          {/* Logo BPlen */}
          <div className="text-center space-y-1">
            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${themeStyles.accentText}`}>
              BPlen HUB
            </span>
            <div className={`w-12 h-[1.5px] mx-auto opacity-30 ${theme === "light" ? "bg-slate-400" : "bg-white"}`} />
          </div>

          {/* Nome e Pitch */}
          <div className="text-center space-y-2 mt-4">
            {visibleFields.name && (
              <h3 className="text-lg font-extrabold tracking-tight leading-tight select-all">
                {name || "Seu Nome"}
              </h3>
            )}
            <p className={`text-[10px] leading-relaxed max-w-[220px] mx-auto select-all ${themeStyles.mutedText}`}>
              {pitch || "Seu pitch de uma linha aparecera aqui."}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="my-auto flex flex-col items-center space-y-2">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-white/10 flex items-center justify-center">
              <QRCodeCanvas
                id="bplen-card-qrcode"
                value={qrValue}
                size={110}
                bgColor="#ffffff"
                fgColor="#1d1d1f"
                level="H"
              />
            </div>
            <span className={`text-[8px] font-bold tracking-wider uppercase opacity-80 ${themeStyles.mutedText}`}>
              {qrTarget === "whatsapp" && "WhatsApp"}
              {qrTarget === "linkedin" && "LinkedIn"}
              {qrTarget === "website" && "Portfolio"}
            </span>
          </div>

          {/* Dados de Contato */}
          <div className="space-y-2 text-left mb-2 pl-2">
            {visibleFields.phone && phone && (
              <div className="flex items-center gap-2 text-[10px]">
                <Phone size={10} className="opacity-70" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            {visibleFields.email && email && (
              <div className="flex items-center gap-2 text-[10px]">
                <Mail size={10} className="opacity-70" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {visibleFields.linkedin && linkedin && (
              <div className="flex items-center gap-2 text-[10px]">
                <Linkedin size={10} className="opacity-70" />
                <span className="truncate">
                  {linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
                </span>
              </div>
            )}
            {visibleFields.website && website && (
              <div className="flex items-center gap-2 text-[10px]">
                <Globe size={10} className="opacity-70" />
                <span className="truncate">
                  {website.replace(/https?:\/\//, "")}
                </span>
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className={`text-[7px] text-center uppercase tracking-widest ${themeStyles.mutedText}`}>
            bplen.com/hub
          </div>
        </div>
      </div>

      {/* Painel de Acoes / Downloads */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <div className="bg-[var(--input-bg)]/30 border border-[var(--border-primary)]/40 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-1">
            Opções de Exportação
          </span>
          
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            O cartao digital possui dimensao 9:16 ideal para visualizacao completa em celulares e compartilhamento em reunioes virtuais.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => exportToImage("png")}
              className="px-4 py-3 rounded-xl bg-[var(--accent-start)] hover:bg-[var(--accent-end)] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Download size={14} />
              <span>Baixar PNG</span>
            </button>

            <button
              type="button"
              onClick={() => exportToImage("jpeg")}
              className="px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--accent-soft)] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download size={14} />
              <span>Baixar JPEG</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-[var(--accent-soft)]/20 border border-[var(--accent-start)]/10 rounded-xl text-[var(--accent-start)] text-[10px] font-semibold mt-2 leading-relaxed">
            <Shield size={14} className="shrink-0" />
            <span>Formatado em alta resolucao (1080x1920px) para impressao e telas de alta definicao.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
