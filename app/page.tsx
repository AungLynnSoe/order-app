"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const MENU_API_URL = "https://woyuhhnkpf.microcms.io/api/v1/menu";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  comment?: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
};

type CartItem = MenuItem & {
  quantity: number;
};

export default function MenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(MENU_API_URL, {
          headers: {
            "X-API-KEY": process.env.NEXT_PUBLIC_MICROCMS_API_KEY || "",
          },
        });

        const data = await response.json();
        console.log("APIから取得したメニュー:", data);

        const fixedMenu = data.contents.map((item: MenuItem) => {
          const price =
            typeof item.price === "string"
              ? parseInt(item.price, 10)
              : item.price;

          if (isNaN(price) || price == null) {
            console.error(`無効な価格です: ${item.price}`, item);
            return {
              ...item,
              price: 0,
            };
          }

          return {
            ...item,
            price: Math.max(0, price),
          };
        });

        setMenu(fixedMenu);
      } catch (err) {
        console.error("メニュー取得エラー:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();

    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsedCart: CartItem[] = JSON.parse(saved).map(
          (item: CartItem) => ({
            ...item,
            price: parseInt(String(item.price), 10) || 999,
          })
        );
        setCart(parsedCart);
      } catch (e) {
        console.error("カートデータ読み込みエラー:", e);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  const formatPrice = (price: number) => {
    if (isNaN(price) || price == null) return "0";
    return price.toLocaleString("ja-JP");
  };

  // ✅ 税込み価格を計算（消費税10%）
  const calcTaxIncluded = (price: number) => {
    return Math.round(price * 1.1);
  };

  // ✅ 合計金額は税込みで計算
  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + calcTaxIncluded(item.price) * item.quantity,
      0
    );
  };

  const openConfirmModal = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const existingItemIndex = cart.findIndex(
      (item) => item.id === selectedItem.id
    );
    let updatedCart;

    if (existingItemIndex >= 0) {
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += quantity;
    } else {
      updatedCart = [...cart, { ...selectedItem, quantity }];
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSelectedItem(null);
  };

  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const completeOrder = () => {
    setOrderComplete(true);
  };

  const resetOrder = () => {
    setCart([]);
    localStorage.removeItem("cart");
    setShowCheckout(false);
    setOrderComplete(false);
  };

  if (isLoading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  return (
    <div className={styles.container}>
      {/* メニュー一覧 */}
      <main className={styles.menuList}>
        <h1 className={styles.title}>メニュー一覧</h1>
        <ul className={styles.grid}>
          {menu.map((item) => (
            <li key={item.id} className={styles.card}>
              {item.image && (
                <div className={styles.imageContainer}>
                  <Image
                    src={item.image.url}
                    alt={item.name}
                    width={200}
                    height={150}
                    className={styles.menuImage}
                  />
                </div>
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.name}>{item.name}</h3>
                <div className={styles.priceContainer}>
                  {/* ✅ 税抜き＋税込み価格表示 */}
                  <span className={styles.price}>
                    {formatPrice(item.price)}円 （税込
                    {formatPrice(calcTaxIncluded(item.price))}円）
                  </span>
                </div>
                {item.comment && (
                  <p className={styles.comment}>
                    {item.comment.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                )}
                <button
                  className={styles.addButton}
                  onClick={() => openConfirmModal(item)}
                >
                  注文
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* 注文状況 */}
      <aside className={styles.cartPanel}>
        <h2 className={styles.cartTitle}>注文状況</h2>
        {!showCheckout ? (
          <>
            {cart.length === 0 ? (
              <p className={styles.empty}>カートに商品がありません</p>
            ) : (
              <>
                <ul className={styles.cartItems}>
                  {cart.map((item) => (
                    <li key={item.id} className={styles.cartItem}>
                      {item.image && (
                        <Image
                          src={item.image.url}
                          alt={item.name}
                          width={80}
                          height={60}
                          className={styles.cartImage}
                        />
                      )}
                      <div className={styles.cartDetails}>
                        <p className={styles.cartName}>{item.name}</p>
                        <div className={styles.quantityControls}>
                          <span>{item.quantity}</span>
                        </div>
                        <p className={styles.cartPrice}>
                          {/* ✅ カートは税込み価格だけ */}
                          {formatPrice(
                            calcTaxIncluded(item.price) * item.quantity
                          )}
                          円 (税込)
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className={styles.removeButton}
                        >
                          削除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={styles.totalSection}>
                  <p className={styles.totalText}>
                    合計金額: {formatPrice(calculateTotal())}円
                  </p>
                  <button
                    className={styles.checkoutButton}
                    onClick={() => setShowCheckout(true)}
                  >
                    会計へ進む
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.checkoutSection}>
            {!orderComplete ? (
              <>
                <h3>注文確認</h3>
                <ul className={styles.checkoutItems}>
                  {cart.map((item) => (
                    <li key={item.id} className={styles.checkoutItem}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>
                        {formatPrice(
                          calcTaxIncluded(item.price) * item.quantity
                        )}
                        円
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.checkoutTotal}>
                  合計: {formatPrice(calculateTotal())}円
                </p>
                <div className={styles.checkoutButtons}>
                  <button
                    className={styles.backButton}
                    onClick={() => setShowCheckout(false)}
                  >
                    戻る
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={completeOrder}
                  >
                    注文を確定
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.completeSection}>
                <h3>ご注文ありがとうございました！</h3>
                <p>またのお越しをお待ちしております</p>
                <button className={styles.returnButton} onClick={resetOrder}>
                  トップに戻る
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 数量選択モーダル */}
      {selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{selectedItem.name}</h3>
            <p className={styles.modalPrice}>
              {/* ✅ モーダルも税込み価格 */}
              {formatPrice(calcTaxIncluded(selectedItem.price))}円
            </p>
            <div className={styles.quantitySelector}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className={styles.quantityButton}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className={styles.quantityButton}
              >
                +
              </button>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setSelectedItem(null)}
              >
                キャンセル
              </button>
              <button className={styles.addButton} onClick={addToCart}>
                カートに追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
