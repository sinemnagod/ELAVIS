import React, { createContext, useContext, useState, useEffect } from "react";
import { readStorage, writeStorage, removeStorage, storageKeys } from "@/lib/storage";
import { mockLogin, mockLogout, getActiveSession, Session } from "@/lib/auth";
import { useToast } from "@/context/ToastContext";

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

  useEffect(() => {
    setSession(getActiveSession());
  }, []);

  const handleLogin = (email: string, remember: boolean = true): boolean => {
    const res = mockLogin(email, remember);
    if (res) {
      setSession(res);
      setIsLoginOpen(false);
      showToast(`Logged in successfully as ${res.user.name}`, "success");
      return true;
    }
    showToast("Invalid login email. Try customer@evalis.com or admin@evalis.com", "error");
    return false;
  };

  const handleLogout = () => {
    mockLogout();
    setSession(null);
    showToast("Logged out successfully", "info");
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
