import { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import vehiclesData from "@/data/vehicles.json";
import productsData from "@/data/products.json";
import { productName } from "@/data/productTranslations";
import { vehicleType } from "@/data/vehicleTranslations";

function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extralight font-orbitron uppercase tracking-[0.38em] text-xl md:text-2xl leading-none text-white pl-[0.38em] ${className}`}>
      EVALIS
    </span>
  );
}

function EarthIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
      <path strokeWidth={1.8} strokeLinecap="round" d="M3.5 12h17M12 3c2.4 2.35 3.6 5.35 3.6 9S14.4 18.65 12 21M12 3C9.6 5.35 8.4 8.35 8.4 12S9.6 18.65 12 21" />
    </svg>
  );
}

function QuestionIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
      <path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.2a2.4 2.4 0 0 1 4.62.9c0 1.95-2.37 2.1-2.37 4.05" />
      <path strokeWidth={2.2} strokeLinecap="round" d="M12 17.2h.01" />
    </svg>
  );
}

function ProfileIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
      <circle cx="12" cy="9.2" r="2.45" strokeWidth={1.8} />
      <path strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M7.6 17.2c.9-2.25 2.35-3.35 4.4-3.35s3.5 1.1 4.4 3.35" />
    </svg>
  );
}

type MegaLink = {
  id: "vehicles" | "charging" | "shop";
  to: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  cards: Array<{
    title: string;
    meta: string;
    image: string;
    to: string;
  }>;
};

export function PublicLayout() {
  const { language, changeLanguage, t, formatPrice } = useLanguage();
  const { cart, cartCount, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMega, setActiveMega] = useState<MegaLink["id"] | null>(null);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { showToast } = useToast();

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Scroll to top on navigation path change (unless there is a hash scroll target)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const vehicles = vehiclesData.slice(0, 3);
  const products = productsData.slice(0, 3);

  const megaLinks: MegaLink[] = [
    {
      id: "vehicles",
      to: "/vehicles",
      label: t("nav.vehicles"),
      eyebrow: language === "en" ? "Three models" : "Üç model",
      title: language === "en" ? "Explore the lineup" : "Model ailesini incele",
      description:
        language === "en"
          ? "Sedan, SUV, and motorcycle options built around the EVALIS electric platform."
          : "EVALIS elektrikli platformu etrafında tasarlanan sedan, SUV ve motosiklet seçenekleri.",
      cards: vehicles.map((vehicle) => ({
        title: vehicle.name,
        meta: vehicleType(vehicle.id, vehicle.type, language),
        image: vehicle.image,
        to: `/vehicles/${vehicle.id}`
      }))
    },
    {
      id: "charging",
      to: "/charging",
      label: t("nav.charging"),
      eyebrow: language === "en" ? "Charging network" : "Şarj ağı",
      title: language === "en" ? "Power at home and on the road" : "Evde ve yolda enerji",
      description:
        language === "en"
          ? "Plan charging, browse equipment, and keep every route within reach."
          : "Şarj planlayın, ekipmanları inceleyin ve her rotayı erişilebilir tutun.",
      cards: [
        {
          title: language === "en" ? "Home Charging" : "Ev Şarjı",
          meta: language === "en" ? "22 kW wall unit" : "22 kW duvar ünitesi",
          image: "/images/products/home-charger-1.png",
          to: "/shop"
        },
        {
          title: language === "en" ? "Public Stations" : "Halka Açık İstasyonlar",
          meta: language === "en" ? "Istanbul coverage" : "İstanbul kapsama",
          image: "/images/cloud-detail.png",
          to: "/charging"
        },
        {
          title: language === "en" ? "Mobile Cable" : "Mobil Kablo",
          meta: language === "en" ? "Type 2 connector" : "Type 2 bağlantı",
          image: "/images/products/mobile-connector.png",
          to: "/shop"
        }
      ]
    },
    {
      id: "shop",
      to: "/shop",
      label: t("nav.shop"),
      eyebrow: language === "en" ? "Store" : "Mağaza",
      title: language === "en" ? "Accessories and essentials" : "Aksesuarlar ve temel ürünler",
      description:
        language === "en"
          ? "Browse charging gear, access items, and parts designed for the EVALIS ecosystem."
          : "EVALIS ekosistemi için tasarlanan şarj ekipmanlarını, erişim ürünlerini ve parçaları inceleyin.",
      cards: products.map((product) => ({
        title: productName(product.id, product.name, language),
        meta: formatPrice(product.priceUSD, product.priceTRY),
        image: product.image,
        to: "/shop"
      }))
    }
  ];

  const currentMega = megaLinks.find((link) => link.id === activeMega);

  // Calculate subtotals
  const subtotalUSD = cart.reduce((acc, item) => acc + item.product.priceUSD * item.quantity, 0);
  const subtotalTRY = cart.reduce((acc, item) => acc + item.product.priceTRY * item.quantity, 0);

  const handleLogoutAndRedirect = () => {
    logout();
    navigate("/");
    window.scrollTo(0, 0);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newsletterEmail)) {
      showToast(
        language === "en" ? "Please enter a valid email address" : "Lütfen geçerli bir e-posta adresi girin",
        "error"
      );
      return;
    }
    showToast(
      language === "en" ? "Subscribed to EVALIS updates!" : "EVALIS güncellemelerine abone oldunuz!",
      "success"
    );
    setNewsletterEmail("");
  };

  const handleUnavailableLink = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast(
      language === "en" ? "This page isn't available in the demo" : "Bu sayfa demoda mevcut değil",
      "info"
    );
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCartOpen(false);
    if (!session) {
      showToast(
        language === "en" ? "Please log in to proceed to checkout" : "Ödemeye geçmek için lütfen giriş yapın",
        "info"
      );
      navigate("/login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="min-h-screen bg-site text-white flex flex-col justify-between relative overflow-x-hidden">
      <div className="relative w-full">
        <header
          className="fixed top-0 left-0 right-0 z-30 border-b border-white/5 bg-site/40 backdrop-blur-md"
          onMouseLeave={() => setActiveMega(null)}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
            {/* Logo */}
            <NavLink to="/" className="hover:opacity-80 flex items-center text-white">
              <LogoText />
            </NavLink>

            {/* Navigation links */}
            <nav className="hidden items-center gap-8 md:flex">
              {megaLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onMouseEnter={() => setActiveMega(link.id)}
                  onFocus={() => setActiveMega(link.id)}
                  className={({ isActive }) =>
                    `text-sm uppercase tracking-[0.22em] font-extralight transition ${
                      isActive ? "text-accent" : "text-slate-400 hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {/* Header Test Drive CTA matches link colors */}
              <Link
                to="/test-drive"
                className="hidden lg:inline-flex items-center justify-center px-3.5 py-1.5 border border-white/10 hover:border-white/35 text-slate-400 hover:text-white rounded-full text-[9px] font-extralight uppercase tracking-widest transition bg-transparent"
              >
                {t("cta.bookTestDrive")}
              </Link>

              {/* Language Selection Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  title={language === "en" ? "Select Language" : "Dil Seçin"}
                  aria-label={language === "en" ? "Select Language" : "Dil Seçin"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-accent/40 hover:text-white cursor-pointer uppercase transition"
                >
                  <EarthIcon />
                </button>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-site/95 border border-white/10 p-2 shadow-2xl z-50 backdrop-blur-md animate-slide-down flex flex-col gap-1 text-[11px] uppercase tracking-wider font-light">
                      <button
                        onClick={() => {
                          changeLanguage("en");
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${
                          language === "en" ? "bg-accent/15 text-accent font-semibold" : "text-slate-450 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage("tr");
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${
                          language === "tr" ? "bg-accent/15 text-accent font-semibold" : "text-slate-450 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        Türkçe
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Link
                to="/about"
                title={language === "en" ? "About and FAQ" : "Hakkında ve SSS"}
                aria-label={language === "en" ? "About and FAQ" : "Hakkında ve SSS"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-accent/40 hover:text-white transition"
              >
                <QuestionIcon />
              </Link>

              {/* Shopping Cart Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={language === "en" ? "Open cart" : "Sepeti aç"}
                className="relative h-8 w-8 rounded-full border border-white/10 hover:border-accent/40 hover:text-white cursor-pointer flex items-center justify-center text-slate-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-site">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Login Action Trigger */}
              {session ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogoutAndRedirect}
                    className="hidden md:inline-flex rounded-full bg-white/5 border border-white/15 px-3 py-1 hover:bg-white/10 hover:text-white cursor-pointer text-[10px] uppercase tracking-widest font-semibold text-slate-400"
                  >
                    {t("nav.logout")}
                  </button>
                  <Link
                    to="/profile"
                    title={t("nav.profile")}
                    aria-label={t("nav.profile")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-accent/40 hover:text-white transition"
                  >
                    <ProfileIcon />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full bg-white/5 border border-white/15 px-3.5 py-1.5 hover:bg-white/10 hover:text-white cursor-pointer text-[10px] uppercase tracking-widest font-semibold text-slate-400"
                >
                  {t("cta.login")}
                </button>
              )}

              {/* Mobile menu hamburger trigger */}
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? (language === "en" ? "Close menu" : "Menüyü kapat") : (language === "en" ? "Open menu" : "Menüyü aç")}
                aria-expanded={isMobileMenuOpen}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-accent/40 hover:text-white transition md:hidden"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/5 bg-site/95 backdrop-blur-md animate-slide-down">
              <nav className="flex flex-col px-6 py-4 gap-1">
                {megaLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `py-3 text-sm uppercase tracking-[0.2em] font-extralight border-b border-white/5 transition ${
                        isActive ? "text-accent" : "text-slate-300 hover:text-white"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <Link
                  to="/test-drive"
                  className="py-3 text-sm uppercase tracking-[0.2em] font-extralight text-slate-300 hover:text-white border-b border-white/5 transition"
                >
                  {t("cta.bookTestDrive")}
                </Link>
                <Link
                  to="/about"
                  className="py-3 text-sm uppercase tracking-[0.2em] font-extralight text-slate-300 hover:text-white border-b border-white/5 transition"
                >
                  {language === "en" ? "About & FAQ" : "Hakkında ve SSS"}
                </Link>
                {session ? (
                  <>
                    <Link
                      to="/profile"
                      className="py-3 text-sm uppercase tracking-[0.2em] font-extralight text-slate-300 hover:text-white border-b border-white/5 transition"
                    >
                      {t("nav.profile")}
                    </Link>
                    <button
                      onClick={handleLogoutAndRedirect}
                      className="py-3 text-sm uppercase tracking-[0.2em] font-extralight text-red-400 hover:text-red-300 text-left transition cursor-pointer"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="py-3 text-sm uppercase tracking-[0.2em] font-extralight text-accent hover:text-white transition"
                  >
                    {t("cta.login")}
                  </Link>
                )}
              </nav>
            </div>
          )}

          {currentMega && (
            <div
              key={currentMega.id}
              className="hidden md:block border-t border-white/5 bg-site/95 shadow-2xl animate-slide-down"
              onMouseEnter={() => setActiveMega(currentMega.id)}
            >
              <div className="mx-auto grid max-w-7xl grid-cols-[0.8fr_1.2fr] gap-8 px-6 py-6">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-semibold">
                    {currentMega.eyebrow}
                  </span>
                  <h3 className="text-2xl font-light uppercase tracking-widest text-white">
                    {currentMega.title}
                  </h3>
                  <p className="max-w-md text-sm leading-relaxed text-slate-400 font-light">
                    {currentMega.description}
                  </p>
                  <Link
                    to={currentMega.to}
                    onClick={() => setActiveMega(null)}
                    className="inline-flex rounded-full border border-white/15 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-200 hover:border-white hover:text-white"
                  >
                    {language === "en" ? "View all" : "Tümünü gör"}
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {currentMega.cards.map((card) => (
                    <Link
                      key={`${currentMega.id}-${card.title}`}
                      to={card.to}
                      onClick={() => setActiveMega(null)}
                      className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-black/20">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-1 p-4">
                        <h4 className="text-xs uppercase tracking-widest text-white">
                          {card.title}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {card.meta}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Global Cart Drawer Overlay */}
        {/* Global Cart Drawer Overlay */}
        <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-500 ${isCartOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-500 ${isCartOpen ? "opacity-100" : "opacity-0"}`}
          />
          {/* Drawer Panel */}
          <div className={`relative w-[85vw] max-w-md h-full bg-site/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md z-10 transition-transform duration-500 ease-out ${
            isCartOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="space-y-6 flex-grow overflow-y-auto pr-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-light tracking-widest uppercase text-white">{t("nav.shop")} ({cartCount})</h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  aria-label={language === "en" ? "Close cart" : "Sepeti kapat"}
                  className="text-slate-400 hover:text-white text-md cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500 uppercase tracking-widest text-[10px] font-light">
                  {language === "en" ? "Your cart is empty" : "Sepetiniz boş"}
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 border-b border-white/5 pb-4 items-center">
                      <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-xl p-2 flex items-center justify-center shrink-0">
                        <img src={item.product.image} alt={item.product.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex-grow space-y-1">
                        <h4 className="text-xs font-light uppercase tracking-wider text-slate-200">{productName(item.product.id, item.product.name, language)}</h4>
                        <p className="text-xs text-accent font-semibold">
                          {formatPrice(item.product.priceUSD, item.product.priceTRY)}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs hover:bg-white/10 transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs text-slate-200 w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-xs hover:bg-white/10 transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        {language === "en" ? "Remove" : "Kaldır"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase tracking-widest">{language === "en" ? "Subtotal" : "Ara Toplam"}</span>
                  <span className="text-md font-semibold text-accent">
                    {formatPrice(subtotalUSD, subtotalTRY)}
                  </span>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="block w-full py-3 text-center rounded-full bg-white text-black text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
                >
                  {language === "en" ? "Proceed to Checkout" : "Ödemeye Geç"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area - starts at top for full bleed */}
        <main key={location.pathname} className="w-full animate-page-fade">
          <Outlet />
        </main>
      </div>

      {/* Professional Advanced Footer */}
      <footer className="border-t border-white/10 bg-[#0d0d0f]/90 py-6 px-6 mt-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
            {/* Column 1: Brand Info */}
            <div className="space-y-4 md:col-span-2">
              <span className="font-extralight font-orbitron uppercase tracking-[0.38em] text-xl leading-none text-white pl-[0.38em] block">
                EVALIS
              </span>
              <p className="text-xs text-slate-400 font-light leading-relaxed max-w-xs">
                {language === "en"
                  ? "Crafting the future of intelligent electric mobility. Sleek design, state-of-the-art battery grids, and autonomous safety integrated into every chassis."
                  : "Akıllı elektrikli mobilitenin geleceğini tasarlıyoruz. Şık tasarım, son teknoloji batarya ağları ve her şaside bütünleşik otonom güvenlik."}
              </p>
              {/* Newsletter */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold block">
                  {language === "en" ? "Subscribe to updates" : "Bültene Abone Olun"}
                </span>
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-xs">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-grow rounded-l-full bg-white/5 border border-white/10 border-r-0 px-4 py-2 text-xs outline-none focus:border-accent text-slate-200"
                  />
                  <button
                    type="submit"
                    aria-label={language === "en" ? "Subscribe" : "Abone Ol"}
                    className="rounded-r-full bg-accent hover:bg-[#348c70] text-black px-4 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
                  >
                    ➔
                  </button>
                </form>
              </div>
            </div>

            {/* Column 2: Vehicles */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block">
                {language === "en" ? "Vehicles" : "Araçlar"}
              </span>
              <ul className="space-y-2 text-xs text-slate-400 font-light">
                <li><Link to="/vehicles/vector" className="hover:text-white transition">Vector (Sedan)</Link></li>
                <li><Link to="/vehicles/cloud" className="hover:text-white transition">Cloud (SUV)</Link></li>
                <li><Link to="/vehicles/bullet" className="hover:text-white transition">Bullet ({language === "en" ? "Motorcycle" : "Motosiklet"})</Link></li>
                <li><Link to="/vehicles" className="hover:text-white transition">{language === "en" ? "All Models" : "Tüm Modeller"}</Link></li>
              </ul>
            </div>

            {/* Column 3: Tech & Energy */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block">
                {language === "en" ? "Energy & Tech" : "Enerji ve Teknoloji"}
              </span>
              <ul className="space-y-2 text-xs text-slate-400 font-light">
                <li><Link to="/charging" className="hover:text-white transition">{language === "en" ? "Home Charger" : "Ev Şarj Cihazı"}</Link></li>
                <li><Link to="/charging" className="hover:text-white transition">{language === "en" ? "Superchargers" : "Süper Şarj İstasyonları"}</Link></li>
                <li><Link to="/charging" className="hover:text-white transition">{language === "en" ? "Solar Panel Grid" : "Güneş Paneli Şebekesi"}</Link></li>
                <li><Link to="/about" className="hover:text-white transition">{language === "en" ? "Autopilot ADAS" : "Otonom ADAS"}</Link></li>
              </ul>
            </div>

            {/* Column 4: Company */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block">
                {language === "en" ? "Company" : "Şirket"}
              </span>
              <ul className="space-y-2 text-xs text-slate-400 font-light">
                <li><Link to="/about" className="hover:text-white transition">{language === "en" ? "About Us" : "Hakkımızda"}</Link></li>
                <li><a href="#" onClick={handleUnavailableLink} className="hover:text-white transition">{language === "en" ? "Careers" : "Kariyer"}</a></li>
                <li><a href="#" onClick={handleUnavailableLink} className="hover:text-white transition">{language === "en" ? "Press Kit" : "Basın Kiti"}</a></li>
                <li><a href="#" onClick={handleUnavailableLink} className="hover:text-white transition">{language === "en" ? "Sustainability" : "Sürdürülebilirlik"}</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 tracking-wider">
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" onClick={handleUnavailableLink} className="hover:text-slate-350 transition">{language === "en" ? "Privacy Policy" : "Gizlilik Politikası"}</a>
              <a href="#" onClick={handleUnavailableLink} className="hover:text-slate-350 transition">{language === "en" ? "Terms of Service" : "Kullanım Koşulları"}</a>
              <a href="#" onClick={handleUnavailableLink} className="hover:text-slate-350 transition">{language === "en" ? "Cookie Settings" : "Çerez Ayarları"}</a>
              <a href="#" onClick={handleUnavailableLink} className="hover:text-slate-350 transition">{language === "en" ? "Contact Us" : "Bize Ulaşın"}</a>
            </div>
            <div>
              {language === "en"
                ? "© 2026 EVALIS Inc. Istanbul, Turkey. All rights reserved."
                : "© 2026 EVALIS Inc. İstanbul, Türkiye. Tüm hakları saklıdır."}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
