import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import usersData from "@/data/users.json";
import { User } from "@/types";

function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extralight font-orbitron uppercase tracking-[0.38em] text-xl md:text-2xl leading-none text-white pl-[0.38em] ${className}`}>
      EVALIS
    </span>
  );
}

export function Signup() {
  const { t, language, changeLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError(t("testDrive.validationError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(language === "en" ? "Passwords do not match." : "Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      setError(
        language === "en"
          ? "Password must be at least 6 characters."
          : "Şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    const existingUsers = readStorage<User[]>(storageKeys.users, usersData as User[]);
    const emailTaken = existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (emailTaken) {
      setError(
        language === "en"
          ? "An account with this email already exists."
          : "Bu e-posta ile kayıtlı bir hesap zaten var."
      );
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      const newUser: User = {
        id: "usr-" + Date.now().toString().slice(-6),
        role: "customer",
        name,
        email,
        phone,
        ownedVehicleIds: []
      };
      writeStorage(storageKeys.users, [...existingUsers, newUser]);

      const success = login(email, true);
      setSubmitting(false);

      if (success) {
        navigate("/dashboard");
      } else {
        setError(
          language === "en"
            ? "Account created, but automatic login failed. Please log in manually."
            : "Hesap oluşturuldu ancak otomatik giriş başarısız oldu. Lütfen manuel olarak giriş yapın."
        );
      }
    }, 800);
  };

  return (
    <div className="relative h-screen w-full bg-[#141414] overflow-hidden flex flex-col md:flex-row">
      <header className="absolute top-0 left-0 right-0 bg-transparent z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <Link to="/" className="hover:opacity-80 flex items-center text-white">
            <LogoText />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/vehicles" className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition">
              {t("nav.vehicles")}
            </Link>
            <Link to="/charging" className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition">
              {t("nav.charging")}
            </Link>
            <Link to="/shop" className="text-sm uppercase tracking-[0.22em] font-extralight text-slate-400 hover:text-white transition">
              {t("nav.shop")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
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

      <div className="relative w-full md:w-3/5 h-1/2 md:h-full bg-black overflow-hidden z-0 shrink-0">
        <img
          src="/images/login.png"
          alt="EVALIS Signup Backdrop"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#141414]/20 to-[#141414]" />
      </div>

      <div className="w-full md:w-2/5 h-1/2 md:h-full bg-[#141414] flex items-center justify-center p-6 md:p-10 pt-24 md:pt-28 overflow-y-auto z-10">
        <div className="w-full max-w-sm bg-[#222224]/85 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase tracking-[0.25em] text-accent font-semibold block">
              EVALIS SECURE
            </span>
            <h2 className="text-2xl font-light uppercase tracking-widest text-white">
              {t("cta.signUp")}
            </h2>
            <p className="text-xs text-slate-400 font-light">
              {language === "en"
                ? "Create your account to book test drives, shop, and manage your EVALIS vehicles."
                : "Test sürüşü rezervasyonu yapmak, alışveriş yapmak ve EVALIS araçlarınızı yönetmek için hesap oluşturun."}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs tracking-wider">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                {language === "en" ? "Full Name" : "Ad Soyad"}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                {language === "en" ? "Email Address" : "E-posta Adresi"}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                {language === "en" ? "Phone Number" : "Telefon Numarası"}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 555 123 45 67"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                {language === "en" ? "Password" : "Şifre"}
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

            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                {language === "en" ? "Confirm Password" : "Şifreyi Onayla"}
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                required
                disabled={submitting}
              />
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
              {submitting ? t("testDrive.submitting") : t("cta.signUp")}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400">
            {language === "en" ? "Already have an account?" : "Zaten bir hesabınız var mı?"}{" "}
            <Link to="/login" className="text-accent hover:underline font-semibold">
              {t("cta.login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Signup;
