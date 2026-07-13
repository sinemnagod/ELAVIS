import { useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { useLanguage } from "@/i18n/LanguageContext";
import productsData from "@/data/products.json";
import productCategoriesData from "@/data/productCategories.json";
import { Product, ProductCategory } from "@/types";
import { useToast } from "@/context/ToastContext";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AdminProducts() {
  const { formatPrice, language } = useLanguage();
  const { showToast, confirmToast } = useToast();

  // Load products list
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(storageKeys.products, productsData as Product[])
  );

  useEffect(() => {
    writeStorage(storageKeys.products, products);
  }, [products]);

  // Load categories list
  const [categories, setCategories] = useState<ProductCategory[]>(() =>
    readStorage<ProductCategory[]>(storageKeys.productCategories, productCategoriesData as ProductCategory[])
  );

  useEffect(() => {
    writeStorage(storageKeys.productCategories, categories);
  }, [categories]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || id;

  // Category CRUD state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    let id = slugify(newCategoryName);
    if (categories.some((c) => c.id === id)) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }
    setCategories((prev) => [...prev, { id, name: newCategoryName.trim() }]);
    setNewCategoryName("");
    showToast(language === "en" ? "Category added" : "Kategori eklendi", "success");
  };

  const handleStartRenameCategory = (cat: ProductCategory) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const handleSaveRenameCategory = (id: string) => {
    if (!editingCategoryName.trim()) return;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: editingCategoryName.trim() } : c)));
    setEditingCategoryId(null);
    showToast(language === "en" ? "Category renamed" : "Kategori yeniden adlandırıldı", "success");
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    const inUse = products.some((p) => p.category === cat.id);
    if (inUse) {
      showToast(
        language === "en"
          ? "Cannot delete a category that still has products. Reassign those products first."
          : "Ürünleri olan bir kategori silinemez. Önce bu ürünleri başka bir kategoriye taşıyın.",
        "error"
      );
      return;
    }
    const confirmed = await confirmToast(
      language === "en" ? `Delete category "${cat.name}"?` : `"${cat.name}" kategorisi silinsin mi?`,
      {
        confirmLabel: language === "en" ? "Delete" : "Sil",
        cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
        tone: "danger"
      }
    );
    if (!confirmed) return;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    showToast(language === "en" ? "Category deleted" : "Kategori silindi", "info");
  };

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Input states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priceUSD, setPriceUSD] = useState(0);
  const [priceTRY, setPriceTRY] = useState(0);
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [stock, setStock] = useState(10);
  const [featured, setFeatured] = useState(false);

  const resetForm = () => {
    setName("");
    setCategory(categories[0]?.id || "");
    setPriceUSD(0);
    setPriceTRY(0);
    setShortDescription("");
    setFullDescription("");
    setStock(10);
    setFeatured(false);
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPriceUSD(p.priceUSD);
    setPriceTRY(p.priceTRY);
    setShortDescription(p.shortDescription || "");
    setFullDescription(p.fullDescription || "");
    setStock(p.stock || 0);
    setFeatured(p.featured || false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingProduct) {
      // Edit
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name,
                slug: slugify(name),
                category,
                priceUSD: Number(priceUSD),
                priceTRY: Number(priceTRY),
                shortDescription,
                fullDescription,
                stock: Number(stock),
                featured
              }
            : p
        )
      );
      showToast(
        language === "en" ? "Product listing updated" : "Ürün listesi güncellendi",
        "success"
      );
    } else {
      // Create
      const newProduct: Product = {
        id: "prod-" + Date.now().toString().slice(-6),
        slug: slugify(name),
        name,
        category,
        priceUSD: Number(priceUSD),
        priceTRY: Number(priceTRY),
        shortDescription,
        fullDescription,
        stock: Number(stock),
        featured,
        image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=300"
      };
      setProducts((prev) => [...prev, newProduct]);
      showToast(
        language === "en" ? "Product listed successfully" : "Ürün başarıyla listelendi",
        "success"
      );
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const confirmMessage =
      language === "en"
        ? "Are you sure you want to remove this product?"
        : "Bu ürünü kaldırmak istediğinizden emin misiniz?";
    const confirmed = await confirmToast(confirmMessage, {
      confirmLabel: language === "en" ? "Delete" : "Sil",
      cancelLabel: language === "en" ? "Cancel" : "Vazgeç",
      tone: "danger"
    });
    if (confirmed) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(language === "en" ? "Product removed" : "Ürün kaldırıldı", "info");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-slate-800 dark:text-slate-100">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-light uppercase tracking-widest text-slate-800 dark:text-white">
            {language === "en" ? "Shop Inventory" : "Mağaza Envanteri"}
          </h1>
          <p className="text-[10px] text-slate-500 font-light tracking-wide mt-1">
            {language === "en"
              ? "Configure catalog product entries, pricing tiers, and warehouse stock levels."
              : "Katalog ürün girişlerini, fiyat kademelerini ve depo stok seviyelerini yapılandırın."}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="rounded-full bg-accent text-black px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#348c70] transition duration-300 cursor-pointer"
        >
          {language === "en" ? "Add Product" : "Ürün Ekle"}
        </button>
      </div>

      {/* Category Management Panel */}
      <div className="dash-panel p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-200 dark:border-white/5 pb-2">
          {language === "en" ? "Product Categories" : "Ürün Kategorileri"}
        </h3>

        <form onSubmit={handleAddCategory} className="flex gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={language === "en" ? "New category name..." : "Yeni kategori adı..."}
            className="flex-grow bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-accent/40 transition"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-accent text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#348c70] transition cursor-pointer shrink-0"
          >
            {language === "en" ? "Add" : "Ekle"}
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center py-4">
            {language === "en" ? "No categories yet" : "Henüz kategori yok"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const productCount = products.filter((p) => p.category === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="dash-pill flex items-center gap-2 px-3 py-2 text-xs"
                >
                  {editingCategoryId === cat.id ? (
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveRenameCategory(cat.id);
                        }
                        if (e.key === "Escape") setEditingCategoryId(null);
                      }}
                      autoFocus
                      className="bg-slate-50 dark:bg-black/40 border border-accent/40 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none w-32"
                    />
                  ) : (
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">{cat.name}</span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono">({productCount})</span>
                  {editingCategoryId === cat.id ? (
                    <button
                      onClick={() => handleSaveRenameCategory(cat.id)}
                      aria-label={language === "en" ? "Save" : "Kaydet"}
                      className="text-accent hover:text-accent/80 text-xs cursor-pointer"
                    >
                      ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartRenameCategory(cat)}
                      aria-label={language === "en" ? "Rename category" : "Kategoriyi yeniden adlandır"}
                      className="text-slate-500 hover:text-accent text-[10px] uppercase font-bold cursor-pointer"
                    >
                      {language === "en" ? "Rename" : "Adı Değiştir"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    aria-label={language === "en" ? "Delete category" : "Kategoriyi sil"}
                    className="text-red-400 hover:text-red-300 text-[10px] uppercase font-bold cursor-pointer"
                  >
                    {language === "en" ? "Delete" : "Sil"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CRUD Form overlay card */}
      {isFormOpen && (
        <div className="dash-panel p-6 space-y-6 shadow-2xl animate-fade-in border-accent/25 bg-white dark:bg-[#0e1423]">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
            <h3 className="text-xs font-bold tracking-wider text-slate-800 dark:text-white uppercase">
              {editingProduct
                ? `${language === "en" ? "Edit Product" : "Ürünü Düzenle"} (${editingProduct.id})`
                : (language === "en" ? "Create New Shop Listing" : "Yeni Ürün Listesi Oluştur")}
            </h3>
            <button
              onClick={resetForm}
              aria-label={language === "en" ? "Close form" : "Formu kapat"}
              className="text-slate-450 hover:text-slate-700 dark:hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 text-xs font-light text-slate-700 dark:text-slate-350">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Product Name" : "Ürün Adı"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === "en" ? "e.g. Wall Connector (Gen 3)" : "örn. Duvar Konektörü (Gen 3)"}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Category" : "Kategori"}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                >
                  {categories.length === 0 && (
                    <option value="" disabled className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                      {language === "en" ? "No categories yet" : "Henüz kategori yok"}
                    </option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#0a0f18] text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Warehouse Stock" : "Depo Stoğu"}
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Price (USD)" : "Fiyat (USD)"}
                </label>
                <input
                  type="number"
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                  {language === "en" ? "Price (TRY)" : "Fiyat (TRY)"}
                </label>
                <input
                  type="number"
                  value={priceTRY}
                  onChange={(e) => setPriceTRY(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                {language === "en" ? "Short Description" : "Kısa Açıklama"}
              </span>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none h-20 resize-none font-sans"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                {language === "en" ? "Full Description" : "Detaylı Açıklama"}
              </span>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 outline-none h-28 resize-none font-sans"
                required
              />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-semibold">
                {language === "en" ? "Featured Item" : "Öne Çıkan Ürün"}
              </span>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded-md accent-accent border-slate-200 dark:border-white/10"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 font-sans text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                {language === "en" ? "Cancel" : "Vazgeç"}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-accent text-black hover:bg-[#348c70] transition"
              >
                {language === "en" ? "Save Product" : "Ürünü Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Listings Table */}
      <div className="dash-panel overflow-hidden shadow-lg">
        {products.length === 0 ? (
          <p className="text-xs text-slate-500 uppercase tracking-widest text-center py-20 font-light">
            {language === "en" ? "No products found in catalogue" : "Katalogda ürün bulunamadı"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light text-slate-550 dark:text-slate-400">
              <thead className="bg-slate-100/80 dark:bg-[#0e1423]/25 text-slate-650 dark:text-slate-455 uppercase tracking-widest text-[9px] font-bold border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4">{language === "en" ? "Item Details" : "Ürün Detayları"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Category" : "Kategori"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Price" : "Fiyat"}</th>
                  <th className="px-6 py-4">{language === "en" ? "Stock Level" : "Stok Seviyesi"}</th>
                  <th className="px-6 py-4 text-right">{language === "en" ? "Actions" : "İşlemler"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 font-mono text-[11px]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-55 dark:hover:bg-white/[0.01] transition duration-200">
                    <td className="px-6 py-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center p-1.5 shrink-0">
                          <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.name}
                            {p.featured && (
                              <span className="ml-2 bg-accent/10 border border-accent/20 text-accent text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                                {language === "en" ? "Featured" : "Öne Çıkan"}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-350 uppercase">
                      {categoryName(p.category)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {formatPrice(p.priceUSD, p.priceTRY)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={`font-semibold ${p.stock && p.stock < 5 ? "text-red-400" : "text-slate-600 dark:text-slate-250"}`}>
                        {p.stock ?? 0} {language === "en" ? "units" : "adet"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-sans">
                      <div className="flex justify-end gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white transition cursor-pointer"
                        >
                          {language === "en" ? "Edit" : "Düzenle"}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-3 py-1.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        >
                          {language === "en" ? "Delete" : "Sil"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminProducts;
