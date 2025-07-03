'use client';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

export default function Checkout() {
  const { cartItems, total, clearCart } = useCart();
  const router = useRouter();

  const handleConfirm = () => {
    clearCart();
    router.push('/checkout/thanks');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>注文確認</h1>
      {cartItems.map(item => (
        <p key={item.id}>{item.name} × {item.quantity}</p>
      ))}
      <p>合計金額：{total}円（税込）</p>
      <button onClick={handleConfirm}>確認</button>
    </div>
  );
}