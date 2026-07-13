import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { getActiveSession } from "@/lib/auth";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { Order, OrderItem } from "@/types";
import { productName } from "@/data/productTranslations";

export function Checkout() {
  const { t, language, formatPrice } = useLanguage();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const session = getActiveSession();

  // Direct navigation to /checkout should require login too, not just the cart drawer's button
  useEffect(() => {
    if (!session) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [session, navigate]);

  // Form states
  const [shippingName, setShippingName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Flow states
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Cart calculations
  const subtotalUSD = cart.reduce((acc, item) => acc + item.product.priceUSD * item.quantity, 0);
  const subtotalTRY = cart.reduce((acc, item) => acc + item.product.priceTRY * item.quantity, 0);
  
  // Fake Tax (8%) & Shipping
  const taxUSD = Math.round(subtotalUSD * 0.08);
  const taxTRY = Math.round(subtotalTRY * 0.08);
  const shippingUSD = subtotalUSD > 200 ? 0 : 15;
  const shippingTRY = subtotalTRY > 5000 ? 0 : 500;

  const totalUSD = subtotalUSD + taxUSD + shippingUSD;
  const totalTRY = subtotalTRY + taxTRY + shippingTRY;

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = val.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 3);
    setCardCvv(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!shippingName || !address || !city || !zipCode || !cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      setValidationError(t("testDrive.validationError"));
      return;
    }

    if (cart.length === 0) {
      setValidationError(language === "en" ? "Your cart is empty." : "Sepetiniz boş.");
      return;
    }

    setSubmitting(true);

    // Simulate payment transaction latency (1.5s)
    setTimeout(() => {
      const currency = language === "en" ? "$" : "₺";
      const subtotal = language === "en" ? totalUSD : totalTRY;

      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: language === "en" ? item.product.priceUSD : item.product.priceTRY
      }));

      const newOrder: Order & { shippingDetails: any } = {
        id: `ord-${Date.now()}`,
        userId: session?.user.id || "customer-user",
        items: orderItems,
        subtotal,
        currency: currency as "$" | "₺",
        status: "processing",
        createdAt: new Date().toISOString(),
        shippingDetails: {
          name: shippingName,
          address,
          city,
          zipCode
        }
      };

      // Save order to localStorage
      const existingOrders = readStorage<Order[]>(storageKeys.orders, []);
      writeStorage(storageKeys.orders, [newOrder, ...existingOrders]);

      // Success
      setCreatedOrder(newOrder);
      setSubmitting(false);
      setSuccess(true);
      clearCart();
    }, 1500);
  };

  if (!session) return null;

  return (
    <div className="space-y-12 pt-28 pb-10 max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block animate-fade-in">
          {language === "en" ? "SECURE CHECKOUT" : "GÜVENLİ ÖDEME"}
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-widest uppercase text-white">
          {t("nav.checkout")}
        </h1>
        <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
      </div>

      {success && createdOrder ? (
        /* Order Confirmed Receipt screen */
        <div className="max-w-2xl mx-auto border border-white/10 bg-white/[0.02] rounded-3xl p-8 md:p-12 text-center space-y-8 animate-fade-in shadow-xl">
          <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-light uppercase tracking-widest text-white">
              {language === "en" ? "ORDER PLACED" : "SİPARİŞ VERİLDİ"}
            </h2>
            <p className="text-slate-400 font-light text-sm max-w-md mx-auto leading-relaxed">
              {language === "en"
                ? `Your transaction was completed successfully. Order ID: ${createdOrder.id}`
                : `İşleminiz başarıyla tamamlandı. Sipariş Numarası: ${createdOrder.id}`}
            </p>
          </div>

          {/* Receipt Info details */}
          <div className="border border-white/5 bg-black/40 rounded-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">
                {language === "en" ? "Recipient" : "Alıcı"}
              </span>
              <span className="text-sm font-medium text-white">{shippingName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest">
                {language === "en" ? "Shipping Address" : "Teslimat Adresi"}
              </span>
              <span className="text-sm font-medium text-slate-200 text-right max-w-xs truncate">
                {address}, {city}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest">
                {language === "en" ? "Total Charge" : "Toplam Tutar"}
              </span>
              <span className="text-lg font-semibold text-accent">
                {formatPrice(
                  createdOrder.currency === "$" ? createdOrder.subtotal : createdOrder.subtotal / 34,
                  createdOrder.currency === "₺" ? createdOrder.subtotal : createdOrder.subtotal * 34
                )}
              </span>
            </div>
          </div>

          <Link
            to="/shop"
            className="inline-block px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-[0.18em] hover:bg-slate-200 transition"
          >
            {language === "en" ? "Continue Shopping" : "Alışverişe Devam Et"}
          </Link>
        </div>
      ) : (
        /* Checkout Form & Order Summary */
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-start">
          
          {/* Checkout billing & shipping form */}
          <form
            onSubmit={handleSubmit}
            className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 md:p-8 space-y-8 shadow-md"
          >
            {validationError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs tracking-wider">
                {validationError}
              </div>
            )}

            {/* Credit Card Animation Widget */}
            <div className="flex justify-center py-4">
              <div className="w-80 h-48 [perspective:1000px] cursor-pointer">
                <div
                  className={`relative w-full h-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] ${
                    isCardFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* Card Front Face */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1f2937] to-[#111827] border border-white/10 p-6 flex flex-col justify-between [backface-visibility:hidden] z-10 text-white">
                    <div className="flex justify-between items-start">
                      {/* Chip */}
                      <div className="w-10 h-7 bg-amber-200/20 rounded-md border border-amber-300/20 flex items-center justify-center">
                        <div className="w-6 h-4 border border-amber-300/40 rounded-sm" />
                      </div>
                      <span className="text-xs font-light tracking-[0.25em] text-slate-400">EVALIS SECURE</span>
                    </div>

                    {/* Card Number */}
                    <div className="text-md font-light tracking-[0.2em] font-mono text-center">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="text-[7px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Cardholder" : "Kart Sahibi"}</span>
                        <span className="text-xs font-light tracking-wider uppercase truncate block max-w-[180px]">
                          {cardHolder || (language === "en" ? "YOUR NAME" : "AD SOYAD")}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[7px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Expires" : "Son Kul."}</span>
                        <span className="text-xs font-light tracking-wider block">
                          {cardExpiry || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Back Face */}
                  <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-[#1f2937] via-[#111827] to-[#1f2937] border border-white/10 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between py-6 text-white z-0">
                    {/* Magnetic Stripe */}
                    <div className="w-full h-10 bg-black" />

                    <div className="px-6 space-y-4">
                      {/* Signature strip and CVV */}
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-8 bg-slate-700/40 rounded px-3 flex items-center text-[10px] text-slate-400 italic">
                          {language === "en" ? "Authorized Signature" : "Yetkili İmza"}
                        </div>
                        <div className="w-12 h-8 bg-white text-black font-semibold text-xs flex items-center justify-center rounded">
                          {cardCvv || "CVV"}
                        </div>
                      </div>
                      <p className="text-[6px] text-slate-500 font-light leading-relaxed text-center">
                        {language === "en"
                          ? "This card is a secure mock preview model. Only authorized transactions on the EVALIS platform are supported."
                          : "Bu kart güvenli bir örnek önizleme modelidir. Yalnızca EVALIS platformundaki yetkili işlemler desteklenir."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section 1: Shipping Details */}
            <div className="space-y-4">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                1. {language === "en" ? "SHIPPING INFORMATION" : "TESLİMAT BİLGİLERİ"}
              </label>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Full Name" : "Ad Soyad"}</span>
                <input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder={language === "en" ? "Jane Doe" : "Ahmet Yılmaz"}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Address" : "Adres"}</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === "en" ? "123 Main Street, Apt 4B" : "Barbaros Mah. Mor Sümbül Sok. No: 12"}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "City" : "Şehir"}</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Istanbul"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Zip Code" : "Posta Kodu"}</span>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="34746"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 2: Credit Card Inputs */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold block">
                2. {language === "en" ? "PAYMENT DETAILS" : "ÖDEME BİLGİLERİ"}
              </label>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Cardholder Name" : "Kart Sahibinin Adı"}</span>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  onFocus={() => setIsCardFlipped(false)}
                  placeholder={language === "en" ? "JANE DOE" : "AHMET YILMAZ"}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Card Number" : "Kart Numarası"}</span>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onFocus={() => setIsCardFlipped(false)}
                  placeholder="4000 1234 5678 9010"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">{language === "en" ? "Expiry Date" : "Son Kullanma Tarihi"}</span>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setIsCardFlipped(false)}
                    placeholder="MM/YY"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">CVV</span>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    onFocus={() => setIsCardFlipped(true)}
                    onBlur={() => setIsCardFlipped(false)}
                    placeholder="•••"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent transition"
                  />
                </div>
              </div>
            </div>

            {/* Confirm transaction Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-full bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                submitting
                  ? "bg-slate-300 opacity-80 cursor-wait"
                  : "hover:bg-slate-200 cursor-pointer"
              }`}
            >
              {submitting
                ? (language === "en" ? "Processing payment..." : "Ödeme işleniyor...")
                : (language === "en" ? "Place Secure Order" : "Güvenli Sipariş Ver")}
            </button>
          </form>

          {/* Right Column: Order Summary */}
          <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
            <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold block pb-3 border-b border-white/5">
              {language === "en" ? "ORDER SUMMARY" : "SİPARİŞ ÖZETİ"}
            </h3>

            {cart.length === 0 ? (
              <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-6">
                {language === "en" ? "No items in cart" : "Sepette ürün yok"}
              </p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/[0.02] border border-white/5 rounded-xl p-2 flex items-center justify-center shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-grow space-y-0.5">
                      <h4 className="text-xs font-light uppercase tracking-wider text-slate-200 truncate max-w-[160px]">
                        {productName(item.product.id, item.product.name, language)}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {language === "en" ? "Qty" : "Adet"}: {item.quantity} x {formatPrice(item.product.priceUSD, item.product.priceTRY)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-200">
                      {formatPrice(
                        item.product.priceUSD * item.quantity,
                        item.product.priceTRY * item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations and Totals */}
            <div className="border-t border-white/10 pt-6 space-y-3 text-xs font-light text-slate-400">
              <div className="flex justify-between items-center">
                <span>{language === "en" ? "Subtotal" : "Ara Toplam"}</span>
                <span className="text-slate-200">
                  {formatPrice(subtotalUSD, subtotalTRY)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{language === "en" ? "Tax (8%)" : "KDV (8%)"}</span>
                <span className="text-slate-200">
                  {formatPrice(taxUSD, taxTRY)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{language === "en" ? "Shipping" : "Kargo"}</span>
                <span className="text-slate-200">
                  {(language === "en" ? shippingUSD : shippingTRY) === 0
                    ? (language === "en" ? "Free" : "Ücretsiz")
                    : formatPrice(shippingUSD, shippingTRY)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-accent border-t border-white/5 pt-3">
                <span>{language === "en" ? "Total" : "Toplam"}</span>
                <span>
                  {formatPrice(totalUSD, totalTRY)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
