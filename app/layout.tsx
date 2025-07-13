import "./globals.css";
import { ReactNode } from "react";
import { CartProvider } from "./context/CartContext";

export const metadata = {
  title: "焼肉注文アプリ",
  description: "Next.js App Router 版",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
