import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-5xl sm:text-6xl">Your cart</h1>
      <CartView />
    </div>
  );
}
