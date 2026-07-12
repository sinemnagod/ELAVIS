import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";

function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extralight font-orbitron uppercase tracking-[0.38em] text-xl md:text-2xl leading-none text-white pl-[0.38em] ${className}`}>
      EVALIS
    </span>
  );
}

export function Login() {
  const { t, language, changeLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!email || !password) {
      setLoginError(t("testDrive.validationError"));
      return;
    }

    setSubmitting(true);

    // Simulate login delay
    setTimeout(() => {
      const success = login(email, rememberMe);
      setSubmitting(false);

      if (success) {
        const isAdmin = email.toLowerCase() === "admin@evalis.com";
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setLoginError(language === "en" ? "Invalid demo credentials." : "Geçersiz demo giriş bilgileri.");
      }
    }, 800);
  };

  return (
    <div className="relative h-screen w-full bg-[#141414] overflow-hidden flex flex-col md:flex-row">
      {/* Header matched to PublicLayout and overlapping background */}
      <header className="absolute top-0 left-0 right-0 bg-transparent z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          {/* Logo */}
          <Link to="/" className="hover:opacity-80 flex items-center text-white">
            <LogoText />
          </Link>

          {/* Navigation Links matched to Home */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/vehicles"
              className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition"
            >
              {t("nav.vehicles")}
            </Link>
            <Link
              to="/charging"
              className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition"
            >
              {t("nav.charging")}
            </Link>
            <Link
              to="/shop"
              className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition"
            >
              {t("nav.shop")}
            </Link>
          </nav>

          {/* Action Buttons matched to Home */}
          <div className="flex items-center gap-3">
            {/* Header Test Drive CTA */}
            <Link
              to="/test-drive"
              className="hidden lg:inline-flex items-center justify-center px-3.5 py-1.5 border border-white/10 hover:border-white/35 text-slate-400 hover:text-white rounded-full text-[9px] font-extralight uppercase tracking-widest transition bg-transparent"
            >
              {t("cta.bookTestDrive")}
            </Link>

            <button
              onClick={() => changeLanguage(language === "en" ? "tr" : "en")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-accent/40 hover:text-white cursor-pointer uppercase transition text-[9px] tracking-widest font-extralight"
            >
              {language === "en" ? "TR" : "EN"}
            </button>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 border border-white/10 hover:border-white/35 text-slate-400 hover:text-white rounded-full text-[9px] font-extralight uppercase tracking-widest transition"
            >
              {language === "en" ? "Home" : "Ana Sayfa"}
            </Link>
          </div>
        </div>
      </header>

      {/* Left Side: 60% Width Cover Image */}
      <div className="relative w-full md:w-3/5 h-1/2 md:h-full bg-black overflow-hidden z-0 shrink-0">
        <img
          src="/images/login.png"
          alt="EVALIS Login Backdrop"
          className="w-full h-full object-cover opacity-85"
        />
        {/* Gradient transition overlay on the right side */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#141414]/20 to-[#141414]" />
      </div>

      {/* Right Side: 40% Width Empty Space for Form */}
      <div className="w-full md:w-2/5 h-1/2 md:h-full bg-[#141414] flex items-center justify-center p-6 md:p-10 pt-24 md:pt-28 overflow-y-auto z-10">
        <div className="w-full max-w-sm bg-[#222224]/85 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up">
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold block">
                EVALIS SECURE
              </span>
              <h2 className="text-2xl font-light uppercase tracking-widest text-white">
                {t("cta.login")}
              </h2>
              <p className="text-xs text-slate-400 font-light">
                {t("cta.welcomeSub")}
              </p>
            </div>

            {loginError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs tracking-wider">
                {loginError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@evalis.com or admin@evalis.com"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <label className="flex items-center gap-2 text-slate-450 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-black border-white/10 text-accent focus:ring-0 focus:ring-offset-0"
                  />
                  {t("cta.rememberMe")}
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-accent hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  submitting
                    ? "bg-slate-350 opacity-85 cursor-wait"
                    : "hover:bg-slate-200 cursor-pointer"
                }`}
              >
                {submitting ? t("testDrive.submitting") : t("cta.login")}
              </button>
            </form>

            {/* Demo Credentials hint */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-1.5 text-[10px] font-light text-slate-400">
              <p className="font-semibold text-accent uppercase tracking-wider">Demo Credentials:</p>
              <p>• Customer: <span className="font-mono text-white">customer@evalis.com</span></p>
              <p>• Admin: <span className="font-mono text-white">admin@evalis.com</span></p>
            </div>

            {/* Social logins */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <button className="w-full py-2 rounded-full border border-white/10 bg-white/5 text-[9px] uppercase tracking-widest text-slate-200 hover:bg-white/10 transition cursor-pointer">
                {t("cta.googleLogin")}
              </button>
              <button className="w-full py-2 rounded-full border border-white/10 bg-white/5 text-[9px] uppercase tracking-widest text-slate-200 hover:bg-white/10 transition cursor-pointer">
                {t("cta.appleLogin")}
              </button>
            </div>

            <div className="text-center text-xs text-slate-400">
              {t("cta.noAccount")}{" "}
              <Link to="/signup" className="text-accent hover:underline font-semibold">
                {t("cta.signUp")}
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
