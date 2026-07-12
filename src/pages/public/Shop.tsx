import { useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { readStorage, storageKeys } from "@/lib/storage";
import productsData from "@/data/products.json";
import productCategoriesData from "@/data/productCategories.json";
import { Product, ProductCategory } from "@/types";

export function Shop() {
  const { t, language, formatPrice } = useLanguage();
  const { addToCart } = useCart();

  // Load products from JSON mock database
  const products = productsData as Product[];

  // Filter & Sort States
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Category list, admin-managed via the Products page
  const adminCategories = readStorage<ProductCategory[]>(storageKeys.productCategories, productCategoriesData as ProductCategory[]);
  const categories = [
    { id: "all", label: language === "en" ? "All Products" : "Tüm Ürünler" },
    ...adminCategories.map((cat) => ({ id: cat.id, label: cat.name }))
  ];

  // Product count per category (for sidebar counts)
  const categoryCounts: Record<string, number> = { all: products.length };
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // Filtering products
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return a.priceUSD - b.priceUSD;
      }
      if (sortBy === "price-high") {
        return b.priceUSD - a.priceUSD;
      }
      // "featured": featured products first
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setCarouselIndex(0);
  };

  return (
    <div className="space-y-12 pt-28 pb-10 max-w-7xl mx-auto px-6">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold block animate-fade-in">
          EVALIS STORE
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight tracking-widest uppercase text-white">
          {t("shop.title")}
        </h1>
        <div className="w-16 h-px bg-accent/40 mx-auto mt-4" />
      </div>

      {/* Shop Layout: Category Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Category Sidebar */}
        <aside className="border border-white/5 bg-white/[0.01] rounded-3xl p-5 space-y-1.5 shadow-md lg:sticky lg:top-28">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold px-2 pb-3 mb-1 border-b border-white/5">
            {language === "en" ? "Categories" : "Kategoriler"}
          </h3>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex justify-between items-center px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                activeCategory === category.id
                  ? "bg-white text-black"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{category.label}</span>
              <span
                className={`text-[9px] font-mono ${
                  activeCategory === category.id ? "text-black/60" : "text-slate-500"
                }`}
              >
                {categoryCounts[category.id] || 0}
              </span>
            </button>
          ))}
        </aside>

        {/* Content Column: Search/Sort + Product Grid */}
        <div className="space-y-8 min-w-0">
          {/* Search and Sort controls */}
          <div className="border border-white/5 bg-white/[0.01] rounded-3xl p-6 flex flex-col sm:flex-row gap-4 justify-end shadow-md">
            {/* Search bar */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "en" ? "Search store..." : "Mağazada ara..."}
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accent transition"
              />
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accent transition cursor-pointer"
            >
              <option value="featured" className="bg-site">
                {language === "en" ? "Sort: Featured" : "Sırala: Öne Çıkanlar"}
              </option>
              <option value="price-low" className="bg-site">
                {language === "en" ? "Sort: Price (Low to High)" : "Sırala: Fiyat (Artan)"}
              </option>
              <option value="price-high" className="bg-site">
                {language === "en" ? "Sort: Price (High to Low)" : "Sırala: Fiyat (Azalan)"}
              </option>
            </select>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 border border-white/5 bg-white/[0.01] rounded-3xl text-slate-500 uppercase tracking-widest text-xs font-light">
              {language === "en" ? "No products match your criteria" : "Kriterlerinize uygun ürün bulunamadı"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleOpenQuickView(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenQuickView(product);
                    }
                  }}
                  className="group border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between transition duration-300 shadow-sm cursor-pointer hover:bg-white/[0.02]"
                >
                  <div>
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] bg-white/[0.02] flex items-center justify-center p-8 overflow-hidden border-b border-white/5">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain rounded-2xl transition duration-500 group-hover:scale-105"
                      />
                      {product.featured && (
                        <span className="absolute top-4 left-4 text-[9px] font-bold tracking-widest bg-accent text-black px-2 py-1 rounded-md">
                          FEATURED
                        </span>
                      )}
                    </div>

                    {/* Product Info & CTA */}
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] text-accent uppercase tracking-widest block font-medium">
                            {categories.find((c) => c.id === product.category)?.label || product.category}
                          </span>
                          <h3 className="text-md font-light uppercase tracking-wider text-white mt-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-light mt-1">
                            {product.shortDescription}
                          </p>
                        </div>
                        <span className="text-md font-semibold text-accent shrink-0">
                          {formatPrice(product.priceUSD, product.priceTRY)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full py-2.5 rounded-full bg-white text-black text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
                    >
                      {t("shop.addToCart")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Details Modal */}
      {quickViewProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setQuickViewProduct(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-site border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Close trigger */}
            <button
              onClick={() => setQuickViewProduct(null)}
              aria-label={language === "en" ? "Close" : "Kapat"}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg cursor-pointer transition"
            >
              ✕
            </button>

            {/* Left Column: Image / Image Carousel */}
            <div className="relative bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              {quickViewProduct.images && quickViewProduct.images.length > 1 ? (
                /* Multi-image Carousel (Wall Charger) */
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={quickViewProduct.images[carouselIndex]}
                    alt={quickViewProduct.name}
                    className="max-h-[250px] object-contain rounded-xl transition-all duration-300"
                  />
                  {/* Controls */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                    <button
                      onClick={() =>
                        setCarouselIndex((prev) =>
                          prev === 0 ? quickViewProduct.images!.length - 1 : prev - 1
                        )
                      }
                      className="w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition cursor-pointer"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCarouselIndex((prev) =>
                          prev === quickViewProduct.images!.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="w-8 h-8 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition cursor-pointer"
                    >
                      →
                    </button>
                  </div>
                  {/* Indicators */}
                  <div className="flex gap-2 mt-4">
                    {quickViewProduct.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`w-2 h-2 rounded-full transition cursor-pointer ${
                          carouselIndex === idx ? "bg-accent" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Single Image product */
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="max-h-[250px] object-contain rounded-xl"
                />
              )}
            </div>

            {/* Right Column: Product specs and description */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-accent uppercase tracking-widest block font-medium">
                    {categories.find((c) => c.id === quickViewProduct.category)?.label || quickViewProduct.category}
                  </span>
                  <h2 className="text-3xl font-light uppercase tracking-widest text-white mt-1">
                    {quickViewProduct.name}
                  </h2>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-semibold text-accent">
                    {formatPrice(quickViewProduct.priceUSD, quickViewProduct.priceTRY)}
                  </span>
                  <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-full font-medium">
                    ✓ {t("shop.inStock")} ({quickViewProduct.stock})
                  </span>
                </div>

                <p className="text-slate-300 font-light text-sm leading-relaxed">
                  {quickViewProduct.fullDescription}
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button
                  onClick={() => {
                    addToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="flex-grow py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition cursor-pointer"
                >
                  {t("shop.addToCart")}
                </button>
                <button
                  onClick={() => setQuickViewProduct(null)}
                  className="px-6 py-3 rounded-full border border-white/15 text-xs text-slate-300 uppercase tracking-widest hover:border-white transition cursor-pointer"
                >
                  {language === "en" ? "Close" : "Kapat"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
