import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing — Ontor",
  description: "Try Ontor free for 14 days, no card required. Then choose $10 a month or $100 a year.",
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title: "Pricing — Ontor",
    description: "Try Ontor free for 14 days, no card required. Then choose $10 a month or $100 a year.",
    url: "https://ontor.ai/pricing/",
  },
};

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.label}>Pricing</p>
          <h1>Try Ontor free for 14 days.</h1>
          <p>Then choose $10 a month or $100 a year. No card required to start.</p>
        </header>

        <section className={styles.individual} aria-labelledby="individual-plan">
          <div className={styles.planHeading}>
            <div>
              <p className={styles.planName}>Individual</p>
              <h2 id="individual-plan"><strong>$10</strong><span>/month</span></h2>
              <p className={styles.annual}>Or $100 a year ($8.33/month).</p>
            </div>
            <div className={styles.planAction}>
              <Link href="/login/?next=/dashboard/subscription/">Start 14-day trial</Link>
              <span>No card required. Cancel anytime.</span>
            </div>
          </div>

          <div className={styles.benefit}>
            <p>Help you stay focused on your work and finish the day with more energy.</p>
            <p className={styles.benefitSupporting}>
              Move more to support metabolic health and lower diabetes and heart disease risk.
            </p>
          </div>
        </section>

        <section className={styles.teams}>
          <div>
            <p className={styles.planName}>For teams</p>
            <h2>Bring Ontor to your team.</h2>
            <p>Team pricing depends on how many people will use Ontor and what you want to learn from a pilot.</p>
          </div>
          <div className={styles.teamActions}>
            <Link href="/for-teams">See how teams use Ontor</Link>
            <a href="https://calendly.com/sabber-ahamed/30min" target="_blank" rel="noreferrer">Discuss a team pilot</a>
          </div>
        </section>

        <div className={styles.note}>
          <span>Available for Mac and Windows. Microphone access is needed for voice analysis.</span>
          <Link href="/privacy">Read the privacy policy</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
