import React, { createContext, useContext, useState, useEffect } from "react";
import { readStorage, writeStorage, removeStorage, storageKeys } from "@/lib/storage";
import { mockLogin, mockLogout, getActiveSession, Session } from "@/lib/auth";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface AuthContextProps {
  session: Session | null;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  login: (email: string, remember?: boolean) => boolean;
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { showToast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    setSession(getActiveSession());
  }, []);

  const handleLogin = (email: string, remember: boolean = true): boolean => {
    const res = mockLogin(email, remember);
    if (res) {
      setSession(res);
      setIsLoginOpen(false);
      showToast(
        language === "en" ? `Logged in successfully as ${res.user.name}` : `${res.user.name} olarak başarıyla giriş yapıldı`,
        "success"
      );
      return true;
    }
    showToast(
      language === "en"
        ? "Invalid login email. Try customer@evalis.com or admin@evalis.com"
        : "Geçersiz giriş e-postası. customer@evalis.com veya admin@evalis.com deneyin",
      "error"
    );
    return false;
  };

  const handleLogout = () => {
    mockLogout();
    setSession(null);
    showToast(language === "en" ? "Logged out successfully" : "Başarıyla çıkış yapıldı", "info");
  };

  const refreshSession = () => {
    setSession(getActiveSession());
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoginOpen,
        setIsLoginOpen,
        login: handleLogin,
        logout: handleLogout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
