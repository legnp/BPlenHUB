# BPlen HUB: Design System "Glassmorphism v3.1" (Apple IOS Pro)

Este manual define a identidade visual Premium do BPlen HUB, focando em minimalismo extremo, transparências suaves e experiência Apple.

## 📐 Escala e Proporções (Fine-Tuning -10%)
- **Base Font Size**: `15px` (em vez de 16px) para um visual mais delicado.
- **Paddings**: Redução global de 10% para uma interface compacta e profissional.
- **Border Radius**: Padrão `2xl` (20px) em vez de `3xl`.

## 🎨 Paleta de Cores Apple IOS
- **Background Principal**: `#F5F7FA` (Perto do branco, mas com leveza).
- **Texto Principal**: `#1D1D1F` (Cinza escuro, nunca preto puro).
- **Acentuação**: Gradientes `667eea` -> `764ba2` (Azul-Roxo suave e premium).
- **Cards/Popups**: `bg-white/40` com blur intenso.

## 💎 Glassmorphism Tokens
Toda peça flutuante (Cards, Modals, Menus) deve seguir este padrão:
- **Background**: `rgba(255, 255, 255, 0.4)` (Transparência suave).
- **Blur (Acrílico)**: `backdrop-filter: blur(12px)`.
- **Bordas Ultra-finas**: `1px solid rgba(255, 255, 255, 0.5)`.
- **Sombras Discretas**: `shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]`.

## 🔘 Botões Ultra-Minimalistas
- **Design**: Foco em bordas finas com fundos semi-transparentes ou apenas ícones.
- **Interação**: Hover sutil com `scale: 1.01` ou mudança leve de opacidade.
- **Tipografia**: Peso `medium` ou `semibold` com `letter-spacing` leve.

## ✨ Animações (Framer Motion)
- **Entrada (Fade In)**: `opacity: 0` -> `1` com `y: 20` -> `0`.
- **Interação (Hover)**: `scale: 1.02` (Efeito de flutuação leve).
- **Transição de Páginas**: Efeito de "Slide & Fade".
- **Formulários**: Efeito de digitação suavizada (Typewriter) em enunciados.

---
*Este documento é a nossa assinatura estética. O BPlen HUB deve sempre parecer um produto da Apple.*
