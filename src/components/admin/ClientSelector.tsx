"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, ChevronDown, Search, Loader2 } from "lucide-react";
import { getAdminUsersList } from "@/actions/users-admin";
import { AdminUser } from "@/types/users";

/**
 * BPlen HUB — Seletor de cliente do admin.
 *
 * Extraido da Devolutiva Comportamental sem mudar uma linha do visual: a pagina
 * Jornada do Cliente passou a ter mais de uma secao por cliente, e cada uma com seu
 * proprio seletor obrigava a escolher o mesmo cliente duas vezes. Agora a escolha e
 * unica, feita no topo da pagina, e as secoes recebem a matricula por prop.
 */
export function ClientSelector({
  value,
  onChange,
  label = "Selecionar Cliente",
  placeholder = "Escolha um cliente...",
}: {
  value: string;
  onChange: (matricula: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  // Ja nasce carregando: a busca dispara na montagem, e assim o efeito nao precisa
  // chamar setState de forma sincrona (regra set-state-in-effect).
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    getAdminUsersList()
      .then((res) => {
        if (active && res.success && res.data) setUsersList(res.data);
      })
      .catch((err) => console.error("Erro ao carregar lista de usuarios:", err))
      .finally(() => {
        if (active) setLoadingUsers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedUser = usersList.find((u) => u.matricula === value);

  return (
    <div className="relative w-full max-w-md">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 block mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-[var(--input-bg)] hover:bg-[var(--input-bg)]/80 border border-[var(--border-primary)] rounded-2xl py-4 px-6 flex items-center justify-between text-xs font-bold text-[var(--text-primary)] transition-all outline-none"
        >
          <div className="flex items-center gap-3">
            <UserCheck size={16} className="text-[var(--accent-start)]" />
            <span>{selectedUser ? `${selectedUser.name} (${selectedUser.matricula})` : placeholder}</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-[var(--text-muted)] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 w-full mt-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl max-h-[300px] flex flex-col"
            >
              <div className="p-4 border-b border-[var(--border-primary)] flex items-center gap-3 bg-[var(--input-bg)]/20">
                <Search size={14} className="text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, matricula ou @"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loadingUsers ? (
                  <div className="py-8 flex justify-center items-center gap-2 text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                    <Loader2 size={14} className="animate-spin text-[var(--accent-start)]" /> Carregando base de dados...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <button
                      key={u.matricula}
                      onClick={() => {
                        onChange(u.matricula);
                        setIsDropdownOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 ${u.matricula === value ? "bg-[var(--accent-soft)] text-[var(--accent-start)]" : "hover:bg-[var(--input-bg)]/40 text-[var(--text-primary)]"}`}
                    >
                      <span className="text-xs font-black">{u.name}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">
                        {u.nickname ? `@${u.nickname}` : u.matricula} • {u.email}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
