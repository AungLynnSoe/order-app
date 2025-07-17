"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css"; // ✅ 独自CSSモジュール

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
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [splitPeople, setSplitPeople] = useState<number>(1); // ✅ 割り勘人数 state

  // ✅ メニュー取得 & カート復元
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

        const fixedMenu = data.contents.map((item: MenuItem) => {
          const price =
            typeof item.price === "string"
              ? parseInt(item.price, 10)
              : item.price;
          return {
            ...item,
            price: isNaN(price) ? 0 : Math.max(0, price),
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

    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem("cart");
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
          observer.unobserve(entry.target); // 一度表示されたら監視終了
        }
      });
    });

    const cards = document.querySelectorAll(`.${styles.fadeIn}`);
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // ✅ 税込み価格
  const calcTaxIncluded = (price: number) => Math.round(price * 1.1);

  // ✅ 合計金額（税込）
  const calculateTotal = () =>
    cart.reduce(
      (sum, item) => sum + calcTaxIncluded(item.price) * item.quantity,
      0
    );

  // ✅ 数量取得
  const getCartQuantity = (id: string) =>
    cart.find((item) => item.id === id)?.quantity || 0;

  // ✅ 数量更新
  const updateQuantity = (id: string, quantity: number) => {
    let updatedCart: CartItem[];

    if (quantity <= 0) {
      updatedCart = cart.filter((item) => item.id !== id);
    } else {
      const existing = cart.find((item) => item.id === id);
      if (existing) {
        updatedCart = cart.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
      } else {
        const item = menu.find((m) => m.id === id);
        if (!item) return;
        updatedCart = [...cart, { ...item, quantity }];
      }
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // ✅ 注文確定
  const completeOrder = () => {
    setOrderComplete(true);
    // 🔄 API連携したいならここで fetch POST も可
  };

  // ✅ 注文リセット
  const resetOrder = () => {
    setCart([]);
    localStorage.removeItem("cart");
    setShowCheckout(false);
    setOrderComplete(false);
    setSplitPeople(1); // 割り勘人数もリセット
  };

  // ✅ 金額整形
  const formatPrice = (price: number) => price.toLocaleString("ja-JP");

  if (isLoading) return <div className={styles.loading}>読み込み中...</div>;

  return (
    <div className={styles.container}>
      <main className={styles.menuList}>
        <h1 className={styles.title}>カルビ屋</h1>
        <h2 className={styles.subtitle}>メニュー一覧</h2>
        <ul className={styles.grid}>
          {menu.map((item) => (
            <li key={item.id} className={`${styles.card} ${styles.fadeIn}`}>
              {item.image && (
                <Image
                  src={item.image.url}
                  alt={item.name}
                  width={200}
                  height={150}
                  className={styles.menuImage}
                />
              )}
              <div className={styles.cardBody}>
                <h3>{item.name}</h3>
                {item.comment && (
                  <p className={styles.comment}>{item.comment}</p>
                )}
                <p>
                  {formatPrice(item.price)}円（税込
                  {formatPrice(calcTaxIncluded(item.price))}円）
                </p>
                {getCartQuantity(item.id) === 0 ? (
                  <button
                    className={styles.addButton}
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    カートに追加
                  </button>
                ) : (
                  <div className={styles.stepper}>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, getCartQuantity(item.id) - 1)
                      }
                    >
                      −
                    </button>
                    <span>{getCartQuantity(item.id)}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, getCartQuantity(item.id) + 1)
                      }
                    >
                      ＋
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* ✅ カートパネル */}
      <aside className={styles.cartPanel}>
        <h2>注文状況</h2>
        {!showCheckout ? (
          <>
            {cart.length === 0 ? (
              <p>カートに商品がありません</p>
            ) : (
              <>
                <ul>
                  {cart.map((item) => (
                    <li key={item.id} className={styles.cartItemRow}>
                      <div className={styles.cartItemInfo}>
                        <strong>
                          {item.name} × {item.quantity}：
                        </strong>
                        {formatPrice(
                          calcTaxIncluded(item.price) * item.quantity
                        )}
                        円(税込)
                      </div>
                      <button
                        className={styles.removeButton}
                        onClick={() => removeFromCart(item.id)}
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowCheckout(true)}>注文確認</button>
              </>
            )}
          </>
        ) : (
          <div>
            {!orderComplete ? (
              <>
                <ul>
                  {cart.map((item) => (
                    <li key={item.id}>
                      {item.name} × {item.quantity}：
                      {formatPrice(calcTaxIncluded(item.price) * item.quantity)}
                      円(税込)
                    </li>
                  ))}
                </ul>
                <p>合計: {formatPrice(calculateTotal())}円(税込)</p>

                {/* ✅ 割り勘計算UI */}
                <div className={styles.splitBill}>
                  <label htmlFor="peopleInput">人数で割り勘:</label>
                  <select
                    id="peopleInput"
                    value={splitPeople}
                    onChange={(e) => setSplitPeople(Number(e.target.value))}
                    className={styles.peopleSelect}
                  >
                    {/* 1〜20人まで選べる */}
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <p>
                    1人あたり:{" "}
                    {formatPrice(Math.ceil(calculateTotal() / splitPeople))}円
                  </p>
                </div>

                <button onClick={() => setShowCheckout(false)}>戻る</button>
                <button onClick={completeOrder}>お会計へ進む</button>
              </>
            ) : (
              <div>
                <h3>ご注文</h3>
                <Image
                  src="/s300_s0050_11_0.png"
                  alt="ご注文"
                  width={200}
                  height={150}
                />
                <p>またのお越しをお待ちしております</p>
                <button onClick={resetOrder}>トップに戻る</button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
