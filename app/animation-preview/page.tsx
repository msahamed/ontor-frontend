import type { Metadata } from "next";
import Nav from "../components/Nav";
import ProductLoop from "../components/landing/ProductLoop";
import styles from "./preview.module.css";

export const metadata: Metadata = { title: "Ontor animation preview", robots: { index: false, follow: false } };

export default function AnimationPreview() {
  return <><Nav /><main className={styles.hero}>
    <div className={styles.copy}>
      <h1>See what your voice shows.</h1>
      <p>While you speak, Ontor compares stress, energy, confidence, breathing, and other signals with your usual range. When a shift lasts, it suggests a short exercise and lets you see the difference afterward.</p>
      <p className={styles.desktop}>Lives in your desktop menu bar.</p>
      <a href="/login/?next=/dashboard/subscription/">Start free</a>
      <small>14 days free. No card required.</small>
    </div>
    <ProductLoop />
  </main></>;
}
