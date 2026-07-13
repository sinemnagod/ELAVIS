import React, { createContext, useContext, useState, useEffect } from "react";
import { readStorage, writeStorage, storageKeys } from "@/lib/storage";
import { Product } from "@/types";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { productName } from "@/data/productTranslations";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextProps {
  cart: CartItem[];
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(storageKeys.cart, []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    writeStorage(storageKeys.cart, cart);
  }, [cart]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const localizedName = productName(product.id, product.name, language);
      if (existing) {
        showToast(
          language === "en" ? `Increased quantity of ${localizedName}` : `${localizedName} miktarı artırıldı`,
          "info"
        );
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showToast(
        language === "en" ? `Added ${localizedName} to cart` : `${localizedName} sepete eklendi`,
        "success"
      );
      return [...prev, { product, quantity: 1 }];
    });
    // Auto-open drawer when adding an item for premium feedback
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    if (item) {
      const localizedName = productName(item.product.id, item.product.name, language);
      showToast(
        language === "en" ? `Removed ${localizedName} from cart` : `${localizedName} sepetten çıkarıldı`,
        "info"
      );
    }
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  // No toast here — the only caller is Checkout on order success, where an
  // "order placed" confirmation already covers the feedback.
  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
