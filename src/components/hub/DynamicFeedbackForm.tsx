"use client";

import React, { useState } from "react";
import { Star, MessageSquare, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/utils/errors";

interface DynamicFeedbackFormProps {
  surveyId: string;
}

export function DynamicFeedbackForm({ surveyId }: DynamicFeedbackFormProps) {
  const { user, matricula } = useAuthContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor, selecione uma nota antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          responses: {
            title: `Avaliação do Artigo/Post`, // Identificador genérico
            nps_score: rating.toString(),
            comment: comment
          },
          uid: user?.uid,
          matricula
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar avaliação");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-black">Muito obrigada!</p>
          <p className="text-sm text-gray-500">Sua avaliação foi registrada com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
      {error && (
        <div className="w-full p-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Star Rating */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              setRating(star);
              setError(null);
            }}
            className={`p-2 transition-all hover:scale-110 active:scale-95 ${
              rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
            }`}
          >
            <Star className="w-8 h-8" />
          </button>
        ))}
      </div>

      {/* Comment Field */}
      <div className="w-full relative">
        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-300 pointer-events-none" />
        <textarea
          rows={3}
          placeholder="Escreva seu comentário aqui (Opcional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-black focus:outline-none focus:border-[#ff0080]/50 transition-all resize-none shadow-inner custom-scrollbar"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full md:w-auto px-12 py-4 rounded-2xl bg-black text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
      </button>
    </div>
  );
}
