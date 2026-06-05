"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserServices } from "@/types/users";
import { createSignedSessionCookie, clearSessionCookie } from "@/actions/auth-session";

/**
 * BPlen HUB — AuthContext (Estado Global de Autenticação)
 * Gerencia o estado do usuário de forma reativa e o expõe via hooks.
 * Agora com suporte a Real-time Permissions via onSnapshot 📡🛡️
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loadingPermissions: boolean;
  isAdmin: boolean;
  matricula: string | null;
  nickname: string | null;
  photoUrl: string | null;
  services: UserServices;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loadingPermissions: true,
  isAdmin: false,
  matricula: null,
  nickname: null,
  photoUrl: null,
  services: {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [matricula, setMatricula] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [services, setServices] = useState<UserServices>({});
  
  // Referência para gerenciar o encerramento rigoroso do listener de permissões
  const unsubscribePermissions = useRef<Unsubscribe | null>(null);
  const unsubscribeProfile = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Escuta mudanças no estado de autenticação (login/logout/refresh)
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup de listeners anteriores
      if (unsubscribePermissions.current) {
        unsubscribePermissions.current();
        unsubscribePermissions.current = null;
      }
      if (unsubscribeProfile.current) {
        unsubscribeProfile.current();
        unsubscribeProfile.current = null;
      }

      if (!currentUser) {
        setIsAdmin(false);
        setMatricula(null);
        setNickname(null);
        setPhotoUrl(null);
        setServices({});
        await clearSessionCookie();
        setLoading(false);
        setLoadingPermissions(false); // Usuário deslogado: permissões resolvidas (sem permissão)
        return;
      }
      
      // Criar cookie de sessão assinado via Firebase Admin SDK 🛡️
      try {
        const idToken = await currentUser.getIdToken();
        await createSignedSessionCookie(idToken);
      } catch (cookieErr) {
        console.error("⚠️ [AuthContext] Falha ao criar cookie assinado:", cookieErr);
      }

      // IMPORTANTE: Liberamos o render assim que temos o usuário autenticado.
      // loadingPermissions permanece true até o primeiro snapshot de permissões chegar.
      setLoading(false);

      try {
        const uidMapRef = doc(db, "_AuthMap", currentUser.uid);
        const uidMapSnap = await getDoc(uidMapRef);
        
        if (uidMapSnap.exists()) {
          const mat = uidMapSnap.data().matricula;
          setMatricula(mat);
          
          if (mat) {
            // listener em tempo real para o Perfil
            const userRef = doc(db, "User", mat);
            unsubscribeProfile.current = onSnapshot(userRef, (userSnap) => {
               if (userSnap.exists()) {
                  const d = userSnap.data();
                  const resolvedNick = d.User_Nickname || d.User_Welcome?.User_Nickname || d.Authentication_Name || d.User_Name || "Membro BPlen";
                  setNickname(resolvedNick);
                  setPhotoUrl(d.photoUrl || null);
               }
            }, (err) => {
               console.error("❌ [AuthContext] Erro no listener de perfil:", err);
            });

            // Listener de Permissões (subcoleção soberana)
            // loadingPermissions só vira false após o PRIMEIRO snapshot chegar,
            // evitando race condition com o AdminLayout.
            const permissionsRef = doc(db, "User", mat, "User_Permissions", "access");
            unsubscribePermissions.current = onSnapshot(permissionsRef, (permSnap) => {
              if (permSnap.exists()) {
                const pData = permSnap.data();
                setIsAdmin(pData.admin === true);
                setServices(pData.services || {});
              } else {
                setIsAdmin(false);
              }
              setLoadingPermissions(false); // Permissões resolvidas (seja admin ou não)
            }, (err) => {
               console.error("❌ [AuthContext] Erro no listener de permissões:", err);
               setLoadingPermissions(false); // Libera mesmo em caso de erro
            });
          } else {
            // Usuário autenticado mas sem matrícula no _AuthMap
            setLoadingPermissions(false);
          }
        }
      } catch (err: unknown) {
        console.error("❌ [AuthContext] Erro ao inicializar estado global:", err);
        setLoadingPermissions(false); // Libera em caso de erro
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePermissions.current) unsubscribePermissions.current();
      if (unsubscribeProfile.current) unsubscribeProfile.current();
    };
  }, []);

  const logout = async () => {
    try {
      await clearSessionCookie();
      await signOut(auth);
      window.location.href = "https://bplen.com";
    } catch (error) {
      console.error("❌ [AuthContext] Erro ao deslogar:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loadingPermissions, isAdmin, matricula, nickname, photoUrl, services, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook personalizado para consumir o contexto de autenticação */
export const useAuthContext = () => useContext(AuthContext);
